import { store } from "@/lib/store";
import { getLLM } from "@/lib/adapters";
import { recall, buildReceipt } from "@carry/core";
import { ARIA_AGENT, ARIA_PERSONA, ARIA_BLOCKED, ARIA_IDLE } from "@/lib/companion";

export async function POST(req: Request) {
  const { query } = await req.json();
  const { memories, blockedNamespaces } = recall(ARIA_AGENT, query, store.list(), store.getPolicy());

  const answer =
    memories.length > 0
      ? await getLLM(ARIA_AGENT).complete({ agentId: ARIA_AGENT, query, memories, persona: ARIA_PERSONA })
      : blockedNamespaces.length > 0
        ? ARIA_BLOCKED
        : ARIA_IDLE;

  const checks = await Promise.all(
    memories.map((m) => store.walrus.verify(m.walrusRef).catch(() => false))
  );
  const verifiedRefs = new Set(memories.filter((_, i) => checks[i]).map((m) => m.walrusRef));

  const receipt = buildReceipt({
    agentId: ARIA_AGENT,
    answerId: `ans-${crypto.randomUUID()}`,
    used: memories,
    blockedNamespaces,
    verifiedRefs,
    createdAt: new Date().toISOString(),
  });

  return Response.json({ answer, receipt });
}
