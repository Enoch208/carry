import { store } from "@/lib/store";
import { getLLM } from "@/lib/adapters";
import { recall } from "@carry/core";
import { buildReceipt } from "@carry/core";

export async function POST(req: Request) {
  const { agentId, query } = await req.json();
  const { memories, blockedNamespaces } = recall(agentId, query, store.list(), store.getPolicy());
  const answer = await getLLM(agentId).complete({ agentId, query, memories });
  const checks = await Promise.all(
    memories.map((m) => store.walrus.verify(m.walrusRef).catch(() => false))
  );
  const verifiedRefs = new Set(memories.filter((_, i) => checks[i]).map((m) => m.walrusRef));
  const receipt = buildReceipt({
    agentId,
    answerId: `ans-${crypto.randomUUID()}`,
    used: memories,
    blockedNamespaces,
    verifiedRefs,
    createdAt: new Date().toISOString(),
  });
  return Response.json({ answer, receipt });
}
