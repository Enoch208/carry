import { store } from "@/lib/store";

export async function GET() {
  return Response.json({ policy: store.getPolicy() });
}
export async function POST(req: Request) {
  const { agentId, namespace, allowed } = await req.json();
  store.setAccess(agentId, namespace, allowed);
  return Response.json({ policy: store.getPolicy() });
}
