export type CarryMemory = { id: string; namespace: string; content: string; walrusRef?: string };

export type CarryReceipt = {
  agent: string;
  query: string;
  used: (CarryMemory & { authorized: true })[];
  blockedNamespaces: string[];
  createdAt: string;
};

export interface CarryStore {
  recall(agent: string, query: string): Promise<{ memories: CarryMemory[]; blockedNamespaces: string[] }>;
}

const STOP = new Set([
  "a", "an", "the", "to", "of", "in", "on", "at", "for", "and", "or", "is", "am", "are", "be",
  "do", "does", "did", "i", "me", "my", "mine", "you", "your", "we", "it", "its", "as", "so",
  "if", "this", "that", "these", "those", "what", "which", "who", "how", "when", "where", "why",
  "with", "about", "anything", "something", "can", "will", "would", "should", "any",
]);

const tokens = (text: string): string[] => text.toLowerCase().split(/\W+/).filter((w) => w && !STOP.has(w));

function matches(content: string, query: string): boolean {
  const q = tokens(query);
  if (q.length === 0) return true;
  const words = new Set(tokens(content));
  return q.some((w) => words.has(w));
}

/**
 * An in-memory Carry vault. Gate-before-generation: a namespace is allowed
 * unless the policy explicitly revokes it for the agent (default-allow).
 */
export function createMemoryStore(opts: {
  memories: CarryMemory[];
  policy?: Record<string, Record<string, boolean>>;
}): CarryStore {
  const policy = opts.policy ?? {};
  const isAllowed = (agent: string, ns: string) => policy[agent]?.[ns] !== false;
  return {
    async recall(agent, query) {
      const relevant = opts.memories.filter((m) => matches(m.content, query));
      const memories = relevant.filter((m) => isAllowed(agent, m.namespace));
      const blockedNamespaces = [
        ...new Set(relevant.filter((m) => !isAllowed(agent, m.namespace)).map((m) => m.namespace)),
      ];
      return { memories, blockedNamespaces };
    },
  };
}
