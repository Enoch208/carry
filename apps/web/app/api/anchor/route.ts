import { store } from "@/lib/store";

export async function POST(req: Request) {
  const { receipt } = await req.json();
  const { blobId } = await store.walrus.store(receipt);
  const verified = await store.walrus.verify(blobId);
  return Response.json({ blobId, verified });
}
