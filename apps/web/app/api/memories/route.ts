import { store } from "@/lib/store";

// Capturing a memory writes the blob to Walrus, republishes the vault manifest
// and advances the vault on chain, so it needs more than a default handler slice.
export const maxDuration = 60;

export async function GET() {
  await store.ready();
  return Response.json({ memories: store.list() });
}

export async function POST(req: Request) {
  const { namespace, content, sourceAgent } = await req.json();
  try {
    const before = store.manifestVersion();
    const memory = await store.add({ namespace, content, sourceAgent });
    const after = store.manifestVersion();
    // Say plainly whether this memory outlived the process, rather than implying it.
    return Response.json({ memory, durable: after > before, manifestVersion: after });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to store memory on Walrus" },
      { status: 502 }
    );
  }
}
