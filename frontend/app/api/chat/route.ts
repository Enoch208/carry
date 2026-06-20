import { store } from "@/lib/store";
import { getLLM } from "@/lib/adapters";
import { recall } from "@/lib/gate";
import { buildReceipt } from "@/lib/receipt";

export async function POST(req: Request) {
  const { agentId, query } = await req.json();
  const { memories, blockedNamespaces } = recall(agentId, query, store.list(), store.getPolicy());
  const answer = await getLLM(agentId).complete({ agentId, query, memories });
  const verifiedRefs = new Set(memories.map((m) => m.walrusRef));
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
