import { store } from "@/lib/store";
import { anchorOnChain, readPolicyVersion } from "@/lib/sui";
import { digestHexOf } from "@/lib/blake";
import { buildSealed } from "@/lib/sealed";
import { isDeployed, netCfg, type Network } from "@/lib/networks";
import { authorize, ok, problem } from "@/lib/gateway";

export const maxDuration = 60;

const RECEIPT_EPOCHS = 50;

function anchorNetwork(): Network {
  const requested = process.env.CARRY_ANCHOR_NETWORK;
  if (requested === "testnet" || requested === "mainnet") return requested;
  return isDeployed("mainnet") ? "mainnet" : "testnet";
}

/**
 * Anchors a proof of an answer. Sealed by default, so the blob this publishes
 * carries commitments rather than the caller's memories.
 */
export async function POST(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => null);
  if (!body?.answerId || !Array.isArray(body?.usedMemories))
    return problem(400, "invalid_body", "`answerId` and `usedMemories` are required.");

  const reveal = new URL(req.url).searchParams.get("reveal") === "1";
  const network = anchorNetwork();
  const agent: string = body.agentId ?? "aria";
  const used: string[] = [
    ...new Set(body.usedMemories.map((m: { namespace: string }) => m.namespace) as string[]),
  ];
  const blocked: string[] = body.blockedNamespaces ?? [];

  try {
    const published = reveal
      ? body
      : buildSealed({
          answerId: body.answerId,
          agent,
          model: body.model ?? "unknown",
          query: body.query ?? "",
          answer: body.answer ?? "",
          memories: body.usedMemories.map((m: { memoryId?: string; namespace: string; content?: string }) => ({
            memoryId: m.memoryId ?? "",
            namespace: m.namespace,
            content: m.content ?? "",
          })),
          blockedNamespaces: blocked,
          allAuthorized: used.every((ns) => !blocked.includes(ns)),
          policyVersion: await readPolicyVersion(netCfg(network).accessPolicy, network),
          expiresAtMs: Date.now() + 10 * 60 * 1000,
        }).receipt;

    const digestHex = digestHexOf(published);
    const blobId = await store.walrus
      .store(published, RECEIPT_EPOCHS)
      .then((r) => r.blobId)
      .catch(() => "");

    const result = await anchorOnChain(
      { answerId: body.answerId, agent, used, blocked, digestHex, walrusBlob: blobId },
      network
    );
    return ok({ ...result, walrusBlob: blobId, walrusStored: blobId !== "", digestHex, sealed: !reveal }, 201);
  } catch (e) {
    return problem(502, "anchor_failed", (e as Error).message);
  }
}
