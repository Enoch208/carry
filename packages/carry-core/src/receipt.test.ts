import { describe, it, expect } from "vitest";
import { buildReceipt } from "./receipt";
import type { Memory } from "./types";

const used: Memory[] = [{
  memoryId: "m1", namespace: "diet", content: "Prefers vegan meals",
  sourceAgent: "agent-a", walrusRef: "0x9f2c", createdAt: "t",
}];

describe("buildReceipt", () => {
  it("marks used memories authorized=true and verified by ref set", () => {
    const r = buildReceipt({
      agentId: "agent-b", answerId: "a1", used,
      blockedNamespaces: ["health"], verifiedRefs: new Set(["0x9f2c"]), createdAt: "t",
    });
    expect(r.usedMemories[0].authorized).toBe(true);
    expect(r.usedMemories[0].verified).toBe(true);
    expect(r.usedMemories[0].snippet).toBe("Prefers vegan meals");
    expect(r.blockedNamespaces).toEqual(["health"]);
  });
});
