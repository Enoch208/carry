import { store } from "@/lib/store";
import { authorize, ok, problem } from "@/lib/gateway";

export async function GET(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) return auth.res;
  return ok({ policy: store.getPolicy() });
}

export async function POST(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) return auth.res;
  const { agentId, namespace, allowed } = await req.json().catch(() => ({}));
  if (!agentId || !namespace || typeof allowed !== "boolean")
    return problem(400, "invalid_body", "`agentId`, `namespace` and boolean `allowed` are required.");
  store.setAccess(agentId, namespace, allowed);
  return ok({ policy: store.getPolicy() });
}
