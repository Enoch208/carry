import type { CarryMemory, CarryStore } from "./store.js";

export type GatewayOptions = {
  /** e.g. https://usecarry.xyz */
  baseUrl: string;
  apiKey: string;
  /** Bound so a slow gateway cannot hold a generation open indefinitely. */
  timeoutMs?: number;
};

type RecallResponse = {
  memories?: { memoryId?: string; id?: string; namespace: string; content: string; walrusRef?: string }[];
  blockedNamespaces?: string[];
};

/**
 * A CarryStore backed by a hosted Carry gateway, so any framework adapter can
 * run against real gated memory instead of a local fixture.
 *
 * The gate runs server-side against the on-chain policy: blocked namespaces are
 * never fetched, so what comes back is already the authorized set. If the call
 * fails this returns no memories rather than falling back to ungated recall —
 * an outage must not become an access-control bypass.
 */
export function createGatewayStore(opts: GatewayOptions): CarryStore {
  const base = opts.baseUrl.replace(/\/$/, "");
  const timeout = opts.timeoutMs ?? 15000;

  return {
    async recall(agent, query) {
      try {
        const res = await fetch(`${base}/v1/recall`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${opts.apiKey}` },
          body: JSON.stringify({ agentId: agent, query }),
          signal: AbortSignal.timeout(timeout),
        });
        if (!res.ok) return { memories: [], blockedNamespaces: [] };
        const body = (await res.json()) as RecallResponse;
        const memories: CarryMemory[] = (body.memories ?? []).map((m) => ({
          id: m.memoryId ?? m.id ?? "",
          namespace: m.namespace,
          content: m.content,
          walrusRef: m.walrusRef,
        }));
        return { memories, blockedNamespaces: body.blockedNamespaces ?? [] };
      } catch {
        return { memories: [], blockedNamespaces: [] };
      }
    },
  };
}

/** Anchor a receipt through the gateway and get back a shareable verify link. */
export async function anchorReceipt(
  opts: GatewayOptions,
  receipt: {
    answerId: string;
    agentId?: string;
    query?: string;
    answer?: string;
    usedMemories: { memoryId?: string; namespace: string; content?: string }[];
    blockedNamespaces?: string[];
  }
): Promise<{ receiptId: string; verifyUrl: string; allAuthorized: boolean } | null> {
  const base = opts.baseUrl.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/v1/receipts/anchor`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${opts.apiKey}` },
      body: JSON.stringify(receipt),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 60000),
    });
    if (!res.ok) return null;
    const b = (await res.json()) as { receiptId: string; verifyPath: string; allAuthorized: boolean };
    return { receiptId: b.receiptId, verifyUrl: `${base}${b.verifyPath}`, allAuthorized: b.allAuthorized };
  } catch {
    return null;
  }
}
