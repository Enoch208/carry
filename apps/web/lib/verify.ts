import { getReceipt, readIsAllowed, readPolicyVersion, type OnchainReceipt } from "@/lib/sui";
import { chainDigestHex, digestMatches } from "@/lib/blake";
import { DEFAULT_NETWORK, netCfg, type Network } from "@/lib/networks";

export type Check = { label: string; ok: boolean; detail: string };
export type VerifyResult = {
  found: boolean;
  receipt: OnchainReceipt | null;
  checks: Check[];
  allOk: boolean;
  network: Network;
};

/**
 * Independently verify a Carry Proof — read-only, no wallet:
 *   1. the blake2b256 hash chain links this receipt to its predecessor,
 *   2. the Walrus blob's content hashes to the on-chain digest,
 *   3. the authorization verdict, recomputed against the live policy, still holds.
 */
export async function verifyReceipt(id: string, network: Network = DEFAULT_NETWORK): Promise<VerifyResult> {
  const aggregator = netCfg(network).walrusAggregator;
  const receipt = await getReceipt(id, network);
  if (!receipt) return { found: false, receipt: null, checks: [], allOk: false, network };

  const checks: Check[] = [];

  // 1. hash chain intact
  const recomputedChain = chainDigestHex(receipt.prevDigestHex, receipt.digestHex);
  checks.push({
    label: "Hash chain intact",
    ok: recomputedChain === receipt.chainDigestHex,
    detail: "chain_digest = blake2b256(prev_digest ++ digest)",
  });

  // 2. content binding — Walrus blob hashes to the on-chain digest
  let contentOk = false;
  try {
    const res = await fetch(`${aggregator}/v1/blobs/${receipt.walrusBlob}`, { cache: "no-store" });
    if (res.ok) {
      const bytes = new Uint8Array(await res.arrayBuffer());
      contentOk = digestMatches(bytes, receipt.digestHex);
    }
  } catch {
    contentOk = false;
  }
  checks.push({
    label: "Content binding (Walrus ↔ chain)",
    ok: contentOk,
    detail: "blake2b256 of the canonical Walrus blob equals the on-chain digest",
  });

  // 3. authorization recomputed against the live on-chain policy
  const verdicts = await Promise.all(
    receipt.usedNamespaces.map((ns) =>
      readIsAllowed(receipt.agent, ns, receipt.policy, network, receipt.packageId)
    )
  );
  const recomputed = verdicts.every(Boolean);
  checks.push({
    label: "Authorization recomputed",
    ok: recomputed === receipt.allAuthorized,
    detail: "is_allowed(agent, namespace) for every used namespace matches all_authorized",
  });

  // 4. the policy has not moved since this verdict was computed. Receipts minted
  // before policy versioning existed have nothing to compare, so they say so
  // rather than claiming a guarantee they were never given.
  if (receipt.policyVersion !== null) {
    const current = await readPolicyVersion(receipt.policy, network, receipt.packageId);
    checks.push({
      label: "Policy version current",
      ok: current !== null && current === receipt.policyVersion,
      detail:
        current === null
          ? "could not read the live policy version"
          : `receipt cites v${receipt.policyVersion}, policy is at v${current}`,
    });
  }

  return { found: true, receipt, checks, allOk: checks.every((c) => c.ok), network };
}
