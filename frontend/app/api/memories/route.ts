import { store } from "@/lib/store";

export async function GET() {
  return Response.json({ memories: store.list() });
}
export async function POST(req: Request) {
  const { namespace, content, sourceAgent } = await req.json();
  return Response.json({ memory: store.add({ namespace, content, sourceAgent }) });
}
