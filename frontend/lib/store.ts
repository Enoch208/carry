import type { AgentId, Memory, NamespaceId, Policy } from "./types";
import { MockWalrus, type WalrusClient } from "./walrus";
import { WalrusHttp } from "./walrus-http";

const seed = (): { memories: Memory[]; policy: Policy } => ({
  memories: [
    { memoryId: "m1", namespace: "diet", content: "Prefers vegan meals", sourceAgent: "agent-a", walrusRef: "0x9f2ca7e1", createdAt: new Date(0).toISOString() },
    { memoryId: "m2", namespace: "health", content: "Allergic to penicillin", sourceAgent: "agent-a", walrusRef: "0xa11e0c3d", createdAt: new Date(0).toISOString() },
    { memoryId: "m3", namespace: "project", content: "Building Carry", sourceAgent: "agent-a", walrusRef: "0x41b80c3d", createdAt: new Date(0).toISOString() },
  ],
  policy: {
    "agent-a": { diet: true, health: true, project: true, billing: false },
    "agent-b": { diet: true, health: true, project: true, billing: false },
  },
});

class Store {
  private state = seed();
  private seq = 100;
  readonly walrus: WalrusClient =
    process.env.CARRY_MODE === "mock" || !process.env.WALRUS_PUBLISHER
      ? new MockWalrus()
      : new WalrusHttp();

  list() { return this.state.memories; }
  getPolicy() { return this.state.policy; }
  setAccess(agent: AgentId, ns: NamespaceId, allowed: boolean) { this.state.policy[agent][ns] = allowed; }
  reset() { this.state = seed(); this.seq = 100; }

  add(input: { namespace: NamespaceId; content: string; sourceAgent: AgentId }): Memory {
    const memoryId = "m" + ++this.seq;
    const ref = "0x" + Math.abs(this.hash(input.content)).toString(16).slice(0, 8).padStart(8, "0");
    const m: Memory = { memoryId, walrusRef: ref, createdAt: new Date().toISOString(), ...input };
    this.state.memories.push(m);
    return m;
  }
  private hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return h; }
}

const g = globalThis as unknown as { __carryStore?: Store };
export const store = g.__carryStore ?? (g.__carryStore = new Store());
