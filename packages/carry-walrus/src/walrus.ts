export interface WalrusClient {
  store(data: unknown, epochs?: number): Promise<{ blobId: string }>;
  verify(blobId: string): Promise<boolean>;
}

function hash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  return "0x" + (h >>> 0).toString(16).padStart(8, "0");
}

export class MockWalrus implements WalrusClient {
  private issued = new Set<string>();
  async store(data: unknown) {
    const blobId = hash(JSON.stringify(data) + this.issued.size);
    this.issued.add(blobId);
    return { blobId };
  }
  async verify(blobId: string) {
    return blobId.length > 0;
  }
}
