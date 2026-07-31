import { getReceipt, readIsAllowed, readPolicyVersion, type OnchainReceipt } from "@/lib/sui";
import { chainDigestHex, digestMatches } from "@/lib/blake";
import { DEFAULT_NETWORK, NETWORKS, netCfg, type Network } from "@/lib/networks";

const ALL_AGGREGATORS = [...new Set(Object.values(NETWORKS).map((n) => n.walrusAggregator))];

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

  // 2. content binding — Walrus blob hashes to the on-chain digest.
  //
  // Blob ids are content-addressed and the digest is what proves the binding, so
  // which aggregator served the bytes cannot weaken the check: any blob that
  // hashes to the on-chain digest is the receipt. A receipt anchored on one
  // network can therefore reference a blob stored on the other, and we look on
  // both rather than reporting a false negative.
  const aggregators = [aggregator, ...ALL_AGGREGATORS.filter((a) => a !== aggregator)];
  let contentOk = false;
  let servedBy = "";
  for (const agg of aggregators) {
    try {
      const res = await fetch(`${agg}/v1/blobs/${receipt.walrusBlob}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (digestMatches(bytes, receipt.digestHex)) {
        contentOk = true;
        servedBy = agg;
        break;
      }
    } catch {
      // try the next aggregator
    }
  }
  checks.push({
    label: "Content binding (Walrus ↔ chain)",
    ok: contentOk,
    detail: contentOk
      ? `blake2b256 of the blob at ${servedBy.replace("https://", "")} equals the on-chain digest`
      : "blake2b256 of the canonical Walrus blob equals the on-chain digest",
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

  // 4. the receipt was anchored against a policy version the chain accepted.
  //
  // `anchor_receipt` refuses a receipt whose cited version is not the current
  // one, so a receipt existing at all proves its version was live when it was
  // written. A later grant or revoke moves the policy forward and must not
  // retroactively invalidate proofs — an audit trail that goes red every time
  // permissions change would be useless. What cannot happen is a receipt citing
  // a version the policy has never reached.
  if (receipt.policyVersion !== null) {
    const current = await readPolicyVersion(receipt.policy, network, receipt.packageId);
    const moved = current !== null && current > receipt.policyVersion;
    checks.push({
      label: "Policy version accepted on-chain",
      ok: current !== null && receipt.policyVersion <= current,
      detail:
        current === null
          ? "could not read the live policy version"
          : moved
            ? `anchored at v${receipt.policyVersion}; the policy has since moved to v${current}`
            : `anchored at v${receipt.policyVersion}, still the live policy version`,
    });
  }

  return { found: true, receipt, checks, allOk: checks.every((c) => c.ok), network };
}
