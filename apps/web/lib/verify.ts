import { getReceipt, readIsAllowed, type OnchainReceipt } from "@/lib/sui";
import { chainDigestHex, digestMatches } from "@/lib/blake";

const AGGREGATOR = process.env.WALRUS_AGGREGATOR || "https://aggregator.walrus-testnet.walrus.space";

export type Check = { label: string; ok: boolean; detail: string };
export type VerifyResult = { found: boolean; receipt: OnchainReceipt | null; checks: Check[]; allOk: boolean };

/**
 * Independently verify a Carry Proof — read-only, no wallet:
 *   1. the blake2b256 hash chain links this receipt to its predecessor,
 *   2. the Walrus blob's content hashes to the on-chain digest,
 *   3. the authorization verdict, recomputed against the live policy, still holds.
 */
export async function verifyReceipt(id: string): Promise<VerifyResult> {
  const receipt = await getReceipt(id);
  if (!receipt) return { found: false, receipt: null, checks: [], allOk: false };

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
    const res = await fetch(`${AGGREGATOR}/v1/blobs/${receipt.walrusBlob}`, { cache: "no-store" });
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
    receipt.usedNamespaces.map((ns) => readIsAllowed(receipt.agent, ns, receipt.policy))
  );
  const recomputed = verdicts.every(Boolean);
  checks.push({
    label: "Authorization recomputed",
    ok: recomputed === receipt.allAuthorized,
    detail: "is_allowed(agent, namespace) for every used namespace matches all_authorized",
  });

  return { found: true, receipt, checks, allOk: checks.every((c) => c.ok) };
}
