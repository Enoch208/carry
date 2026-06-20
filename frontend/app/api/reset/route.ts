import { store } from "@/lib/store";

export async function POST() {
  store.reset();
  return Response.json({ ok: true });
}
