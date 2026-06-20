import { describe, it, expect } from "vitest";
import { MockLLM } from "../llm";
import type { Memory } from "@carry/core";

describe("MockLLM", () => {
  it("refuses when no memory was allowed", async () => {
    const out = await new MockLLM().complete({ agentId: "agent-b", query: "allergy?", memories: [] });
    expect(out.toLowerCase()).toContain("can");
  });
  it("uses provided memory", async () => {
    const m: Memory = { memoryId: "m1", namespace: "diet", content: "vegan", sourceAgent: "agent-a", walrusRef: "0x", createdAt: "t" };
    const out = await new MockLLM().complete({ agentId: "agent-b", query: "dinner", memories: [m] });
    expect(out.toLowerCase()).toContain("vegan");
  });
});
