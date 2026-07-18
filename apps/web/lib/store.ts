import type { AgentId, Memory, NamespaceId, Policy } from "@carry/core";
import { MockWalrus, type WalrusClient } from "@carry/walrus";
import { WalrusHttp } from "@carry/walrus";
import { memwalEnabled, rememberOnMemwal } from "./memwal";

const MEMORY_EPOCHS = 50;

const seed = (): { memories: Memory[]; policy: Policy } => ({
  memories: [
    { memoryId: "m1", namespace: "diet", content: "Prefers vegan meals", sourceAgent: "agent-a", walrusRef: "48oFqb9rDKoWi0-ynJbp9cFnerTCL6EhEQ9WFrvmJoU", createdAt: new Date(0).toISOString() },
    { memoryId: "m2", namespace: "health", content: "Allergic to penicillin", sourceAgent: "agent-a", walrusRef: "oHJRrapc1dfUR-IEuS1RO2xQZnGsPx8iFE12MXSylVs", createdAt: new Date(0).toISOString() },
    { memoryId: "m3", namespace: "project", content: "Building Carry", sourceAgent: "agent-a", walrusRef: "3-2wNAGA0-jb9sMMOpvl6IOiSJY-ILf5HsfiLEf5kd0", createdAt: new Date(0).toISOString() },
    { memoryId: "m4", namespace: "health", content: "Gets migraines a few times a month; they ease in a dark, quiet room", sourceAgent: "agent-a", walrusRef: "teb6wF9Ypzec4x3CPbleffMyQfWog0I1RLGPwsqcDUY", createdAt: new Date(0).toISOString() },
    { memoryId: "m5", namespace: "health", content: "Takes magnesium nightly to help prevent migraines", sourceAgent: "agent-a", walrusRef: "WPPxqHroWzga_IATFzgFZslOUyvqt8Ie9R-_EMiYob8", createdAt: new Date(0).toISOString() },
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
    process.env.CARRY_MODE === "mock" || !process.env.WALRUS_PUBLISHER || !process.env.WALRUS_AGGREGATOR
      ? new MockWalrus()
      : new WalrusHttp();

  list() { return this.state.memories; }
  getPolicy() { return this.state.policy; }
  setAccess(agent: AgentId, ns: NamespaceId, allowed: boolean) { this.state.policy[agent][ns] = allowed; }
  reset() { this.state = seed(); this.seq = 100; }

  async add(input: { namespace: NamespaceId; content: string; sourceAgent: AgentId }): Promise<Memory> {
    const memoryId = "m" + ++this.seq;
    const createdAt = new Date().toISOString();
    const walrusRef = memwalEnabled()
      ? await rememberOnMemwal(input.content, input.namespace)
      : (
          await this.walrus.store(
            { namespace: input.namespace, content: input.content, sourceAgent: input.sourceAgent, createdAt },
            MEMORY_EPOCHS
          )
        ).blobId;
    const m: Memory = { memoryId, walrusRef, createdAt, ...input };
    this.state.memories.push(m);
    return m;
  }
}

const g = globalThis as unknown as { __carryStore?: Store };
export const store = g.__carryStore ?? (g.__carryStore = new Store());
