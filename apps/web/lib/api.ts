import type { AgentId, AnswerReceipt, Memory, NamespaceId, Policy } from "@carry/core";

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());

export const getMemories = (): Promise<{ memories: Memory[] }> => fetch("/api/memories").then((r) => r.json());
export const capture = (m: { namespace: NamespaceId; content: string; sourceAgent: AgentId }): Promise<{ memory: Memory }> => post("/api/memories", m);
export const sendChat = (agentId: AgentId, query: string): Promise<{ answer: string; receipt: AnswerReceipt }> => post("/api/chat", { agentId, query });
export const sendCompanion = (query: string): Promise<{ answer: string; receipt: AnswerReceipt }> => post("/api/companion", { query });
export const getPolicy = (): Promise<{ policy: Policy }> => fetch("/api/policy").then((r) => r.json());
export const setAccess = (agentId: AgentId, namespace: NamespaceId, allowed: boolean): Promise<{ policy: Policy }> => post("/api/policy", { agentId, namespace, allowed });
export const anchorReceipt = (receipt: AnswerReceipt): Promise<{ blobId: string; verified: boolean }> => post("/api/anchor", { receipt });
export const anchorOnSui = (receipt: AnswerReceipt): Promise<{ digest?: string; allAuthorized?: boolean; suiscanUrl?: string; error?: string }> => post("/api/anchor-sui", { receipt });
export const resetDemo = (): Promise<{ ok: true }> => post("/api/reset", {});
