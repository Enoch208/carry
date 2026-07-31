import { store } from "@/lib/store";
import { anchorOnChain } from "@/lib/sui";
import { digestHexOf } from "@/lib/blake";
import { isDeployed, type Network } from "@/lib/networks";

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
    const digestHex = digestHexOf(receipt);
    const blobId = await store.walrus
      .store(receipt, RECEIPT_EPOCHS)
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
      anchorNetwork()
    );

    return Response.json({ ...result, walrusBlob: blobId, digestHex, walrusStored: blobId !== "" });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "on-chain anchoring failed" }, { status: 503 });
  }
}
