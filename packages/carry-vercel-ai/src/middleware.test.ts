import { describe, it, expect } from "vitest";
import { carryMiddleware } from "./middleware.js";
import { createMemoryStore, type CarryReceipt } from "./store.js";

const memories = [
  { id: "m1", namespace: "health", content: "Allergic to penicillin" },
  { id: "m2", namespace: "billing", content: "Card ending 4242" },
];

const userPrompt = (text: string) => [{ role: "user" as const, content: [{ type: "text" as const, text }] }];

const call = (mw: ReturnType<typeof carryMiddleware>, prompt: ReturnType<typeof userPrompt>) =>
  mw.transformParams({ params: { prompt } });

describe("carryMiddleware — gate before generation", () => {
  it("injects only authorized memory and emits a receipt", async () => {
    const store = createMemoryStore({ memories, policy: { aria: { health: true, diet: true, billing: false } } });
    let receipt: CarryReceipt | undefined;
    const mw = carryMiddleware({ store, agent: "aria", onReceipt: (r) => (receipt = r) });

    const out = await call(mw, userPrompt("am I allergic to anything?"));

    expect(out.prompt[0].role).toBe("system");
    expect(out.prompt[0].content).toContain("penicillin");
    expect(receipt?.used.map((m) => m.namespace)).toEqual(["health"]);
    expect(receipt?.blockedNamespaces).toHaveLength(0);
  });

  it("never injects a revoked namespace, and reports it blocked", async () => {
    const store = createMemoryStore({ memories, policy: { aria: { health: true, diet: true, billing: false } } });
    let receipt: CarryReceipt | undefined;
    const mw = carryMiddleware({ store, agent: "aria", onReceipt: (r) => (receipt = r) });

    const out = await call(mw, userPrompt("what card ending do I use for billing?"));

    expect(receipt?.blockedNamespaces).toContain("billing");
    expect(receipt?.used).toHaveLength(0);
    // no system memory injected — the model never sees the revoked fact
    expect(out.prompt.some((m: { role: string }) => m.role === "system")).toBe(false);
  });

  it("gives an agent nobody configured nothing at all", async () => {
    const store = createMemoryStore({ memories, policy: { aria: { health: true } } });
    let receipt: CarryReceipt | undefined;
    const mw = carryMiddleware({ store, agent: "stranger", onReceipt: (r) => (receipt = r) });

    const out = await call(mw, userPrompt("am I allergic to anything?"));

    // default-deny: an unconfigured agent inherits no access
    expect(receipt?.used).toHaveLength(0);
    expect(out.prompt.some((m: { role: string }) => m.role === "system")).toBe(false);
  });

  it("does not grant a namespace that was never mentioned in the policy", async () => {
    const store = createMemoryStore({ memories, policy: { aria: { health: true } } });
    let receipt: CarryReceipt | undefined;
    const mw = carryMiddleware({ store, agent: "aria", onReceipt: (r) => (receipt = r) });

    await call(mw, userPrompt("what card ending do I use for billing?"));

    expect(receipt?.used).toHaveLength(0);
    expect(receipt?.blockedNamespaces).toContain("billing");
  });
});
