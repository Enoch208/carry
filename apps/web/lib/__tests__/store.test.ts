import { describe, it, expect, beforeEach } from "vitest";
import { store } from "../store";

beforeEach(() => store.reset());

describe("store", () => {
  it("seeds demo memories and policy", () => {
    expect(store.list().length).toBeGreaterThan(0);
    expect(store.getPolicy()["agent-b"].health).toBe(true);
  });
  it("captures a memory with a walrus ref", async () => {
    const m = await store.add({ namespace: "diet", content: "Loves ramen", sourceAgent: "agent-a" });
    expect(m.walrusRef.length).toBeGreaterThan(0);
    expect(store.list().some((x) => x.memoryId === m.memoryId)).toBe(true);
  });
  it("flips access (revoke)", () => {
    store.setAccess("agent-b", "health", false);
    expect(store.getPolicy()["agent-b"].health).toBe(false);
  });
});
