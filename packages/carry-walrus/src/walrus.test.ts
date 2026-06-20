import { describe, it, expect } from "vitest";
import { MockWalrus } from "./walrus";

describe("MockWalrus", () => {
  it("stores then verifies the blob", async () => {
    const w = new MockWalrus();
    const { blobId } = await w.store({ hello: "world" });
    expect(blobId).toMatch(/^0x/);
    expect(await w.verify(blobId)).toBe(true);
  });
});
