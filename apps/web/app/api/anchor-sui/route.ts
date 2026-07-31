import { store } from "@/lib/store";
import { anchorOnChain } from "@/lib/sui";
import { digestHexOf } from "@/lib/blake";
import { isDeployed, netCfg, type Network } from "@/lib/networks";
import { buildSealed } from "@/lib/sealed";
import { readPolicyVersion } from "@/lib/sui";

const ARIA_ONCHAIN_AGENT = "aria";

// Receipts must outlive the demo window, so they are stored well past the
// Walrus client's 5-epoch default, which expires in days and rots /verify links.
const RECEIPT_EPOCHS = 50;

/** Anchoring targets whichever network the current contract is deployed on. */
function anchorNetwork(): Network {
  const requested = process.env.CARRY_ANCHOR_NETWORK;
  if (requested === "testnet" || requested === "mainnet") return requested;
  return isDeployed("mainnet") ? "mainnet" : "testnet";
}

export async function POST(req: Request) {
  const { receipt, claimNamespaces } = await req.json();
  try {
    const used: string[] =
      claimNamespaces ?? [...new Set(receipt.usedMemories.map((m: { namespace: string }) => m.namespace))];
    const blocked: string[] = receipt.blockedNamespaces ?? [];

    // Bind the proof to the exact receipt content. Walrus mainnet has no public
    // publisher and testnet publishers can hang, so a failed write must not stop
    // the anchor — the chain's verdict does not depend on the blob existing.
    // Seal by default: the blob a stranger can fetch carries commitments, not
    // the user's memories. `?reveal=1` keeps the old plaintext receipt for the
    // demo screens that show what was used.
    const url = new URL(req.url);
    const reveal = url.searchParams.get("reveal") === "1";
    const network = anchorNetwork();

    const published = reveal
      ? receipt
      : buildSealed({
          answerId: receipt.answerId,
          agent: ARIA_ONCHAIN_AGENT,
          model: receipt.model ?? "unknown",
          query: receipt.query ?? "",
          answer: receipt.answer ?? "",
          memories: (receipt.usedMemories ?? []).map(
            (m: { memoryId?: string; namespace: string; content?: string }) => ({
              memoryId: m.memoryId ?? "",
              namespace: m.namespace,
              content: m.content ?? "",
            })
          ),
          blockedNamespaces: blocked,
          allAuthorized: used.every((ns) => !blocked.includes(ns)),
          policyVersion: await readPolicyVersion(netCfg(network).accessPolicy, network),
          expiresAtMs: Date.now() + 10 * 60 * 1000,
        }).receipt;

    const digestHex = digestHexOf(published);
    const blobId = await store.walrus
      .store(published, RECEIPT_EPOCHS)
      .then((r) => r.blobId)
      .catch(() => "");

    const result = await anchorOnChain(
      {
        answerId: receipt.answerId,
        agent: ARIA_ONCHAIN_AGENT,
        used,
        blocked,
        digestHex,
        walrusBlob: blobId,
      },
      network
    );

    return Response.json({ ...result, walrusBlob: blobId, digestHex, walrusStored: blobId !== "", sealed: !reveal });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "on-chain anchoring failed" }, { status: 503 });
  }
}
