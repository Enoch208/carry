import { store } from "@/lib/store";

export async function GET() {
  return Response.json({ memories: store.list() });
}
export async function POST(req: Request) {
  const { namespace, content, sourceAgent } = await req.json();
  try {
    const memory = await store.add({ namespace, content, sourceAgent });
    return Response.json({ memory });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to store memory on Walrus" },
      { status: 502 }
    );
  }
}
