import type { WalrusClient } from "./walrus";

export class WalrusHttp implements WalrusClient {
  private publisher = process.env.WALRUS_PUBLISHER!;
  private aggregator = process.env.WALRUS_AGGREGATOR!;

  async store(data: unknown): Promise<{ blobId: string }> {
    const res = await fetch(`${this.publisher}/v1/blobs?epochs=5`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = (await res.json()) as {
      newlyCreated?: { blobObject?: { blobId?: string } };
      alreadyCertified?: { blobId?: string };
    };
    const blobId =
      json.newlyCreated?.blobObject?.blobId ?? json.alreadyCertified?.blobId;
    if (!blobId) throw new Error("Walrus store: no blobId in response");
    return { blobId };
  }

  async verify(blobId: string): Promise<boolean> {
    const res = await fetch(`${this.aggregator}/v1/blobs/${blobId}`);
    return res.ok;
  }
}
