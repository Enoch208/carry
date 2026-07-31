import { describe, expect, it } from "vitest";
import { carryInstructions, carryLangGraphNode, createMemoryStore, gateMemory } from "./index.js";

const memories = [
  { id: "m1", namespace: "health", content: "Allergic to penicillin" },
  { id: "m2", namespace: "billing", content: "Card ending 4242" },
];
const granted = { "support-agent": { health: true } };

describe("gateMemory", () => {
  it("returns only granted memory and records the refusal", async () => {
    const store = createMemoryStore({ memories, policy: granted });
    const r = await gateMemory("am I allergic to anything?", { store, agent: "support-agent" });
    expect(r.memories.map((m) => m.namespace)).toEqual(["health"]);
    expect(r.systemPrompt).toContain("penicillin");
    expect(r.receipt.blockedNamespaces).toHaveLength(0);
  });

  it("never returns an ungranted namespace, and reports it blocked", async () => {
    const store = createMemoryStore({ memories, policy: granted });
    const r = await gateMemory("what card ending do I use for billing?", { store, agent: "support-agent" });
    expect(r.memories).toHaveLength(0);
    expect(r.systemPrompt).toBeNull();
    expect(r.receipt.blockedNamespaces).toContain("billing");
  });

  it("gives an agent nobody configured nothing", async () => {
    const store = createMemoryStore({ memories, policy: granted });
    const r = await gateMemory("am I allergic to anything?", { store, agent: "stranger" });
    expect(r.memories).toHaveLength(0);
    expect(r.systemPrompt).toBeNull();
  });
});

describe("LangGraph node", () => {
  it("appends gated memory as a system message", async () => {
    const node = carryLangGraphNode({ store: createMemoryStore({ memories, policy: granted }), agent: "support-agent" });
    const out = await node({ messages: [{ role: "user", content: "am I allergic to anything?" }] });
    expect(out.messages).toHaveLength(1);
    expect(out.messages[0].role).toBe("system");
    expect(String(out.messages[0].content)).toContain("penicillin");
  });

  it("reads LangGraph's `human` message type too", async () => {
    const node = carryLangGraphNode({ store: createMemoryStore({ memories, policy: granted }), agent: "support-agent" });
    const out = await node({ messages: [{ type: "human", content: "am I allergic to anything?" }] });
    expect(String(out.messages[0]?.content)).toContain("penicillin");
  });

  it("appends nothing when the question reaches only blocked memory", async () => {
    const node = carryLangGraphNode({ store: createMemoryStore({ memories, policy: granted }), agent: "support-agent" });
    const out = await node({ messages: [{ role: "user", content: "what card ending do I use for billing?" }] });
    expect(out.messages).toHaveLength(0);
  });
});

describe("OpenAI Agents instructions", () => {
  it("keeps the base instructions and appends authorized memory", async () => {
    const fn = carryInstructions("You are a support agent.", {
      store: createMemoryStore({ memories, policy: granted }),
      agent: "support-agent",
    });
    const out = await fn({ input: "am I allergic to anything?" });
    expect(out).toContain("You are a support agent.");
    expect(out).toContain("penicillin");
  });

  it("returns the base instructions untouched when nothing is authorized", async () => {
    const fn = carryInstructions("You are a support agent.", {
      store: createMemoryStore({ memories, policy: granted }),
      agent: "support-agent",
    });
    const out = await fn({ messages: [{ role: "user", content: "what card ending do I use for billing?" }] });
    expect(out).toBe("You are a support agent.");
    expect(out).not.toContain("4242");
  });
});
