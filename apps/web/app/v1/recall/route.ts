import { recall } from "@carry/core";
import { store } from "@/lib/store";
import { authorize, ok, problem } from "@/lib/gateway";

export const maxDuration = 60;

/** The gate runs here, before anything is returned — never filtered afterwards. */
export async function POST(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) return auth.res;
  const { agentId, query } = await req.json().catch(() => ({}));
  if (!agentId || !query) return problem(400, "invalid_body", "`agentId` and `query` are required.");
  await store.ready();
  const { memories, blockedNamespaces } = recall(agentId, query, store.list(), store.getPolicy());
  return ok({
    agentId,
    query,
    memories,
    blockedNamespaces,
    note: "Blocked namespaces were never fetched — the gate ran before retrieval.",
  });
}
