import { store } from "@/lib/store";
import { authorize, ok, problem } from "@/lib/gateway";

export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) return auth.res;
  await store.ready();
  return ok({ memories: store.list(), manifestVersion: store.manifestVersion() });
}

export async function POST(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) return auth.res;
  const { namespace, content, sourceAgent } = await req.json().catch(() => ({}));
  if (!namespace || !content) return problem(400, "invalid_body", "`namespace` and `content` are required.");
  try {
    const before = store.manifestVersion();
    const memory = await store.add({ namespace, content, sourceAgent: sourceAgent ?? "agent-a" });
    const after = store.manifestVersion();
    return ok({ memory, durable: after > before, manifestVersion: after }, 201);
  } catch (e) {
    return problem(502, "storage_failed", (e as Error).message);
  }
}
