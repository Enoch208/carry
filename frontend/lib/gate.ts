import type { AgentId, Memory, NamespaceId, Policy } from "./types";
import { isAllowed } from "./policy";

export type RecallResult = { memories: Memory[]; blockedNamespaces: NamespaceId[] };

function matches(content: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const words = new Set(content.toLowerCase().split(/\W+/).filter(Boolean));
  return q.split(/\W+/).filter(Boolean).some((w) => words.has(w));
}

export function recall(agent: AgentId, query: string, all: Memory[], policy: Policy): RecallResult {
  const relevant = all.filter((m) => matches(m.content, query));
  const memories = relevant.filter((m) => isAllowed(agent, m.namespace, policy));
  const blockedNamespaces = Array.from(
    new Set(relevant.filter((m) => !isAllowed(agent, m.namespace, policy)).map((m) => m.namespace))
  );
  return { memories, blockedNamespaces };
}
