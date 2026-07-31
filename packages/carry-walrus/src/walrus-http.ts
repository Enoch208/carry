import type { WalrusClient } from "./walrus";

// Publishers can hang rather than refuse, and an unbounded fetch inside a
// serverless handler holds the request open until the platform kills it — so
// every call is bounded and fails fast instead.
const TIMEOUT_MS = Number(process.env.WALRUS_TIMEOUT_MS || 15000);

// Blobs must outlive the window they are cited in; the Walrus default of 5
// epochs expires within days and silently rots every link that referenced it.
const DEFAULT_EPOCHS = 50;

export class WalrusHttp implements WalrusClient {
  private publisher = process.env.WALRUS_PUBLISHER!;
  private aggregator = process.env.WALRUS_AGGREGATOR!;

  async store(data: unknown, epochs = DEFAULT_EPOCHS): Promise<{ blobId: string }> {
    if (!this.publisher) throw new Error("WALRUS_PUBLISHER is not configured");
    const res = await fetch(`${this.publisher}/v1/blobs?epochs=${epochs}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Walrus store failed: HTTP ${res.status}`);
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
    try {
      const res = await fetch(`${this.aggregator}/v1/blobs/${blobId}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
