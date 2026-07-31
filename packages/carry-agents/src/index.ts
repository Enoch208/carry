/**
 * Proof-carrying memory for any agent framework.
 *
 * Frameworks disagree about almost everything except one shape: something turns
 * a user's question into context for a model. That is the only place an access
 * decision can be honest, so this package exposes one primitive — `gateMemory`
 * — and thin adapters that drop it into whichever framework you use. Nothing
 * here imports a framework, so adding Carry never drags in a peer dependency.
 */

export type CarryMemory = { id: string; namespace: string; content: string; walrusRef?: string };

export interface CarryStore {
  recall(agent: string, query: string): Promise<{ memories: CarryMemory[]; blockedNamespaces: string[] }>;
}

export type CarryReceipt = {
  agent: string;
  query: string;
  used: CarryMemory[];
  blockedNamespaces: string[];
  createdAt: string;
};

export type GateResult = {
  /** The system message to prepend, or null when nothing was authorized. */
  systemPrompt: string | null;
  memories: CarryMemory[];
  blockedNamespaces: string[];
  receipt: CarryReceipt;
};

export type GateOptions = {
  store: CarryStore;
  agent: string;
  onReceipt?: (receipt: CarryReceipt) => void;
};

function memoryBlock(memories: CarryMemory[]): string {
  const facts = memories.map((m) => `- (${m.namespace}) ${m.content}`).join("\n");
  return (
    "You have access to the user's authorized memory. Use ONLY these facts; they are the only " +
    "memories you are permitted to access. Do not invent or recall anything outside them.\n\n" +
    facts
  );
}

/**
 * Retrieve only what this agent is allowed to see, and record what happened.
 *
 * The gate runs here — before the model is called — so a blocked namespace is
 * never fetched rather than fetched and filtered. That ordering is what makes
 * the receipt worth anything: it describes what the model could actually see.
 */
export async function gateMemory(query: string, opts: GateOptions): Promise<GateResult> {
  const { memories, blockedNamespaces } = await opts.store.recall(opts.agent, query);
  const receipt: CarryReceipt = {
    agent: opts.agent,
    query,
    used: memories,
    blockedNamespaces,
    createdAt: new Date().toISOString(),
  };
  opts.onReceipt?.(receipt);
  return {
    systemPrompt: memories.length ? memoryBlock(memories) : null,
    memories,
    blockedNamespaces,
    receipt,
  };
}

// ── LangGraph ───────────────────────────────────────────────────────────────

type LangGraphMessage = { role?: string; type?: string; content?: unknown };
type LangGraphState = { messages?: LangGraphMessage[] };

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p) => (typeof p === "string" ? p : ((p as { text?: string })?.text ?? "")))
      .join(" ");
  }
  return "";
}

/** LangGraph marks a human turn as `human` or `user` depending on the version. */
function lastHumanText(state: LangGraphState): string {
  const messages = state.messages ?? [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const kind = m.role ?? m.type;
    if (kind === "user" || kind === "human") return textOf(m.content).trim();
  }
  return "";
}

/**
 * A LangGraph node that prepends gated memory to the state.
 *
 * ```ts
 * graph.addNode("memory", carryLangGraphNode({ store, agent: "support-agent" }));
 * graph.addEdge("memory", "model");
 * ```
 *
 * Returns only the messages to append, which is the update shape LangGraph's
 * message reducers expect — so it composes with an existing graph untouched.
 */
export function carryLangGraphNode(opts: GateOptions) {
  return async (state: LangGraphState): Promise<{ messages: LangGraphMessage[] }> => {
    const query = lastHumanText(state);
    if (!query) return { messages: [] };
    const { systemPrompt } = await gateMemory(query, opts);
    return systemPrompt ? { messages: [{ role: "system", content: systemPrompt }] } : { messages: [] };
  };
}

// ── OpenAI Agents SDK ───────────────────────────────────────────────────────

type AgentsRunContext = { input?: unknown; messages?: { role?: string; content?: unknown }[] };

function lastUserFromContext(ctx: AgentsRunContext): string {
  if (typeof ctx.input === "string") return ctx.input.trim();
  const messages = ctx.messages ?? [];
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return textOf(messages[i].content).trim();
  }
  return "";
}

/**
 * Dynamic instructions for the OpenAI Agents SDK, which accepts a function so
 * the system prompt can be built per run.
 *
 * ```ts
 * const agent = new Agent({
 *   name: "support",
 *   instructions: carryInstructions("You are a support agent.", { store, agent: "support-agent" }),
 * });
 * ```
 *
 * The base instructions always survive; authorized memory is appended beneath
 * them, and a run with nothing authorized simply gets the base prompt.
 */
export function carryInstructions(base: string, opts: GateOptions) {
  return async (ctx: AgentsRunContext): Promise<string> => {
    const query = lastUserFromContext(ctx);
    if (!query) return base;
    const { systemPrompt } = await gateMemory(query, opts);
    return systemPrompt ? `${base}\n\n${systemPrompt}` : base;
  };
}

// ── hosted Carry ────────────────────────────────────────────────────────────

export type GatewayOptions = { baseUrl: string; apiKey: string; timeoutMs?: number };

/**
 * A store backed by a hosted Carry gateway. The gate runs server-side against
 * the on-chain policy, so what comes back is already the authorized set.
 *
 * A failed call returns no memories rather than falling back to ungated recall:
 * an outage must not quietly become an access-control bypass.
 */
export function createGatewayStore(opts: GatewayOptions): CarryStore {
  const base = opts.baseUrl.replace(/\/$/, "");
  return {
    async recall(agent, query) {
      try {
        const res = await fetch(`${base}/v1/recall`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${opts.apiKey}` },
          body: JSON.stringify({ agentId: agent, query }),
          signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
        });
        if (!res.ok) return { memories: [], blockedNamespaces: [] };
        const b = (await res.json()) as {
          memories?: { memoryId?: string; id?: string; namespace: string; content: string; walrusRef?: string }[];
          blockedNamespaces?: string[];
        };
        return {
          memories: (b.memories ?? []).map((m) => ({
            id: m.memoryId ?? m.id ?? "",
            namespace: m.namespace,
            content: m.content,
            walrusRef: m.walrusRef,
          })),
          blockedNamespaces: b.blockedNamespaces ?? [],
        };
      } catch {
        return { memories: [], blockedNamespaces: [] };
      }
    },
  };
}

/**
 * An in-memory store for local development and tests. Default-deny: a namespace
 * is unreadable until the policy grants it, matching the on-chain gate, so an
 * agent nobody configured reads nothing.
 */
export function createMemoryStore(opts: {
  memories: CarryMemory[];
  policy?: Record<string, Record<string, boolean>>;
}): CarryStore {
  const policy = opts.policy ?? {};
  const allowed = (agent: string, ns: string) => policy[agent]?.[ns] === true;
  const STOP = new Set(["a", "an", "the", "to", "of", "in", "on", "at", "for", "and", "or", "is", "am", "are", "be", "do", "does", "did", "i", "me", "my", "you", "your", "it", "its", "what", "which", "how", "when", "where", "why", "with", "about", "anything", "can", "any"]);
  const tokens = (t: string) => t.toLowerCase().split(/\W+/).filter((w) => w && !STOP.has(w));
  const matches = (content: string, query: string) => {
    const q = tokens(query);
    if (!q.length) return true;
    const w = new Set(tokens(content));
    return q.some((x) => w.has(x));
  };
  return {
    async recall(agent, query) {
      const relevant = opts.memories.filter((m) => matches(m.content, query));
      return {
        memories: relevant.filter((m) => allowed(agent, m.namespace)),
        blockedNamespaces: [...new Set(relevant.filter((m) => !allowed(agent, m.namespace)).map((m) => m.namespace))],
      };
    },
  };
}
