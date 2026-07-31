import { store } from "@/lib/store";
import { anchorOnChain } from "@/lib/sui";
import { digestHexOf } from "@/lib/blake";

const ARIA_ONCHAIN_AGENT = "aria";

export async function POST(req: Request) {
  const { receipt, claimNamespaces } = await req.json();
  try {
    const used: string[] =
      claimNamespaces ?? [...new Set(receipt.usedMemories.map((m: { namespace: string }) => m.namespace))];
    const blocked: string[] = receipt.blockedNamespaces ?? [];

    // Bind the proof to the exact receipt content, then store that content on Walrus.
    // Receipts must outlive the demo/judging window, so store with a long epoch count
    // (the Walrus client defaults to 5, which expires in days and rots /verify links).
    const RECEIPT_EPOCHS = 50;
    const digestHex = digestHexOf(receipt);
    const { blobId } = await store.walrus.store(receipt, RECEIPT_EPOCHS);

    const result = await anchorOnChain({
      answerId: receipt.answerId,
      agent: ARIA_ONCHAIN_AGENT,
      used,
      blocked,
      digestHex,
      walrusBlob: blobId,
    });

    return Response.json({ ...result, walrusBlob: blobId, digestHex });
  } catch (e) {
    return Response.json(
      { error: (e as Error).message || "on-chain anchoring runs locally with the Sui CLI" },
      { status: 503 }
    );
  }
}
