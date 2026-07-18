import { anchorOnChain } from "@/lib/sui";

export async function POST(req: Request) {
  const { receipt, claimNamespaces } = await req.json();
  try {
    const result = await anchorOnChain(receipt, claimNamespaces ? { claimNamespaces } : undefined);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: (e as Error).message || "on-chain anchoring unavailable (run locally with the Sui CLI)" },
      { status: 503 }
    );
  }
}
