import { verifyReceipt } from "@/lib/verify";
import { resolveNetwork } from "@/lib/networks";
import { authorize, ok, problem } from "@/lib/gateway";

export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = authorize(req);
  if (!auth.ok) return auth.res;
  const { id } = await params;
  const network = resolveNetwork(new URL(req.url).searchParams.get("network") ?? undefined);
  const result = await verifyReceipt(id, network);
  if (!result.found) return problem(404, "not_found", "No Carry Proof object at that id on this network.");
  return ok(result);
}
