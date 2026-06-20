import { recall, buildReceipt, type AgentId, type Memory, type NamespaceId, type Policy } from "@carry/core";
import { MockWalrus, WalrusHttp, type WalrusClient } from "@carry/walrus";

const live = Boolean(process.env.WALRUS_PUBLISHER && process.env.WALRUS_AGGREGATOR);
const walrus: WalrusClient = live ? new WalrusHttp() : new MockWalrus();

let seq = 0;

async function remember(content: string, namespace: NamespaceId, sourceAgent: AgentId): Promise<Memory> {
  const createdAt = new Date().toISOString();
  const { blobId } = await walrus.store({ namespace, content, sourceAgent, createdAt });
  return { memoryId: `m${++seq}`, namespace, content, sourceAgent, walrusRef: blobId, createdAt };
}

async function main() {
  console.log(`\nCarry SDK example — storage backend: ${live ? "Walrus (live testnet)" : "mock"}\n`);

  console.log("1. Agent A teaches two memories:");
  const memories = [
    await remember("Allergic to penicillin", "health", "agent-a"),
    await remember("Prefers vegan meals", "diet", "agent-a"),
  ];
  for (const m of memories) console.log(`   [${m.namespace}] ${m.content}  walrus:${m.walrusRef}`);

  const policy: Policy = {
    "agent-a": { diet: true, health: true, project: true, billing: false },
    "agent-b": { diet: true, health: false, project: true, billing: false },
  };

  const agentId: AgentId = "agent-b";
  const query = "Is the user vegan, and allergic to anything?";
  console.log(`\n2. Agent B asks: "${query}"`);
  console.log("   agent-b has 'health' revoked — the gate runs before generation, so it is never fetched.");

  const { memories: allowed, blockedNamespaces } = recall(agentId, query, memories, policy);

  const checks = await Promise.all(allowed.map((m) => walrus.verify(m.walrusRef).catch(() => false)));
  const verifiedRefs = new Set(allowed.filter((_, i) => checks[i]).map((m) => m.walrusRef));

  const receipt = buildReceipt({
    agentId,
    answerId: "example-1",
    used: allowed,
    blockedNamespaces,
    verifiedRefs,
    createdAt: new Date().toISOString(),
  });

  console.log("\n3. Answer Receipt:");
  console.log(JSON.stringify(receipt, null, 2));
  console.log(
    `\n-> used ${receipt.usedMemories.length} memory(ies); blocked: ${receipt.blockedNamespaces.join(", ") || "none"}\n`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
