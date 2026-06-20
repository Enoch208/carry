import type { AgentId, AnswerReceipt, Memory, NamespaceId } from "./types";

export function buildReceipt(args: {
  agentId: AgentId;
  answerId: string;
  used: Memory[];
  blockedNamespaces: NamespaceId[];
  verifiedRefs: Set<string>;
  createdAt: string;
}): AnswerReceipt {
  return {
    answerId: args.answerId,
    agentId: args.agentId,
    usedMemories: args.used.map((m) => ({
      memoryId: m.memoryId,
      namespace: m.namespace,
      snippet: m.content,
      sourceAgent: m.sourceAgent,
      walrusRef: m.walrusRef,
      authorized: true,
      verified: args.verifiedRefs.has(m.walrusRef),
    })),
    blockedNamespaces: args.blockedNamespaces,
    createdAt: args.createdAt,
  };
}
