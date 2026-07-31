import type { AgentId, Memory, NamespaceId, Policy } from "@carry/core";
import { MockWalrus, type WalrusClient } from "@carry/walrus";
import { WalrusHttp } from "@carry/walrus";
import { memwalEnabled, rememberOnMemwal } from "./memwal";
import { publishManifest, recoverVault } from "./vault";
import { isDeployed, netCfg, type Network } from "./networks";

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

/** Writes go to whichever network the vault lives on. */
function vaultNetwork(): Network {
  const requested = process.env.CARRY_ANCHOR_NETWORK;
  if (requested === "testnet" || requested === "mainnet") return requested;
  return isDeployed("mainnet") ? "mainnet" : "testnet";
}

class Store {
  private state = seed();
  private seq = 100;
  private hydrating: Promise<void> | null = null;
  private vaultVersion = 0;
  readonly walrus: WalrusClient =
    process.env.CARRY_MODE === "mock" || !process.env.WALRUS_PUBLISHER || !process.env.WALRUS_AGGREGATOR
      ? new MockWalrus()
      : new WalrusHttp();

  /**
   * Memory lives in the vault, not this process. The seed is only what a reader
   * sees before the vault has been read; once it resolves, chain state wins.
   */
  async ready(): Promise<void> {
    this.hydrating ??= this.hydrate();
    return this.hydrating;
  }

  private async hydrate(): Promise<void> {
    const network = vaultNetwork();
    if (!netCfg(network).carryVault) return;
    try {
      const v = await recoverVault(network);
      if (!v.found || !v.manifestIntact) return;
      const recovered = v.memories
        .filter((m) => m.content)
        .map((m) => ({
          memoryId: m.memoryId,
          namespace: m.namespace as NamespaceId,
          content: m.content as string,
          sourceAgent: "agent-a" as AgentId,
          walrusRef: m.walrusRef,
          createdAt: new Date(0).toISOString(),
        }));
      if (recovered.length) this.state.memories = recovered;
      this.vaultVersion = v.manifestVersion;
    } catch {
      // a vault that will not resolve must not take the app down; the seed stands
    }
  }

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

    // Durability lives in the vault: publish a new manifest so this memory
    // survives the process. A failure here must not lose the write in flight.
    try {
      const published = await publishManifest(
        this.state.memories.map((x) => ({
          memoryId: x.memoryId,
          namespace: x.namespace,
          walrusRef: x.walrusRef,
        })),
        async (data) => (await this.walrus.store(data, MEMORY_EPOCHS)).blobId,
        vaultNetwork()
      );
      if (published) this.vaultVersion = published.manifestVersion;
    } catch {
      // surfaced by /vault showing a stale manifest version rather than crashing
    }
    return m;
  }

  manifestVersion() { return this.vaultVersion; }
}

const g = globalThis as unknown as { __carryStore?: Store };
export const store = g.__carryStore ?? (g.__carryStore = new Store());
