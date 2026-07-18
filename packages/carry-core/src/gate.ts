import type { AgentId, Memory, NamespaceId, Policy } from "./types";
import { isAllowed } from "./policy";

export type RecallResult = { memories: Memory[]; blockedNamespaces: NamespaceId[] };

const STOP = new Set([
  "a", "an", "the", "to", "of", "in", "on", "at", "for", "and", "or", "is", "am", "are", "be",
  "do", "does", "did", "i", "me", "my", "mine", "you", "your", "we", "it", "its", "as", "so",
  "if", "this", "that", "these", "those", "what", "which", "who", "how", "when", "where", "why",
  "with", "about", "anything", "something", "can", "will", "would", "should", "any",
]);

function tokens(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter((w) => w && !STOP.has(w));
}

function matches(content: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const qWords = tokens(q);
  if (qWords.length === 0) return true;
  const words = new Set(tokens(content));
  return qWords.some((w) => words.has(w));
}

export function recall(agent: AgentId, query: string, all: Memory[], policy: Policy): RecallResult {
  const relevant = all.filter((m) => matches(m.content, query));
  const memories = relevant.filter((m) => isAllowed(agent, m.namespace, policy));
  const blockedNamespaces = Array.from(
    new Set(relevant.filter((m) => !isAllowed(agent, m.namespace, policy)).map((m) => m.namespace))
  );
  return { memories, blockedNamespaces };
}
