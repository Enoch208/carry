import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as store from "./store.js";

const server = new McpServer({ name: "carry", version: "0.1.0" });

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
const shortRef = (r: string) => (r.length > 16 ? `${r.slice(0, 10)}…${r.slice(-4)}` : r);

server.registerTool(
  "carry_remember",
  {
    title: "Remember a fact",
    description:
      "Store a fact in long-term memory. It is written to Walrus as a verifiable blob; the real blob reference is returned. Group facts with a namespace (e.g. project, prefs, health).",
    inputSchema: { content: z.string().describe("The fact to remember"), namespace: z.string().describe("Namespace/bucket for the fact") },
  },
  async ({ content, namespace }) => {
    const m = await store.remember(content, namespace);
    return text(`Stored in [${m.namespace}] on ${store.backend()}.\nwalrus:${m.walrusRef}\nmemoryId: ${m.memoryId}`);
  }
);

server.registerTool(
  "carry_recall",
  {
    title: "Recall memory with a proof receipt",
    description:
      "Retrieve memory relevant to a query. Access is GATED before retrieval — revoked namespaces are never returned. Returns the memories used plus an Answer Receipt: each memory's namespace, whether its blob still resolves on Walrus (verified), and which namespaces were blocked by policy.",
    inputSchema: { query: z.string().describe("What to recall") },
  },
  async ({ query }) => {
    const r = await store.recall(query);
    const used = r.usedMemories.length
      ? r.usedMemories
          .map((m) => `• [${m.namespace}] ${m.content}\n    authorized ✓  ${m.verified ? "verified ✓" : "unverified"}  ·  walrus:${shortRef(m.walrusRef)}`)
          .join("\n")
      : "  (no accessible memory matched this query)";
    const blocked = r.blockedNamespaces.length
      ? `\n\n⛔ Blocked by policy — never fetched: ${r.blockedNamespaces.join(", ")}`
      : "";
    return text(
      `MEMORY USED\n${used}${blocked}\n\nAnswer Receipt — ${r.usedMemories.length} used, ${r.blockedNamespaces.length} blocked. The gate ran before retrieval, so blocked memory never reached you.`
    );
  }
);

server.registerTool(
  "carry_set_access",
  {
    title: "Grant or revoke a namespace",
    description:
      "Flip the retrieval gate for a namespace. A revoked namespace is never returned by carry_recall — enforcement happens before retrieval, not after.",
    inputSchema: { namespace: z.string(), allowed: z.boolean().describe("true to grant, false to revoke") },
  },
  async ({ namespace, allowed }) => {
    store.setAccess(namespace, allowed);
    return text(`${allowed ? "Granted" : "Revoked"} access to [${namespace}]. Enforced before the next recall.`);
  }
);

server.registerTool(
  "carry_list_memories",
  { title: "List all memories", description: "List every stored memory with its namespace and Walrus reference.", inputSchema: {} },
  async () => {
    const ms = store.listMemories();
    return text(ms.length ? ms.map((m) => `• [${m.namespace}] ${m.content}  ·  walrus:${shortRef(m.walrusRef)}`).join("\n") : "(no memories yet)");
  }
);

server.registerTool(
  "carry_policy",
  { title: "Show the access policy", description: "Show the allow/deny policy per namespace (namespaces are allowed by default).", inputSchema: {} },
  async () => {
    const entries = Object.entries(store.policy());
    return text(entries.length ? entries.map(([k, v]) => `${k}: ${v ? "allow" : "deny"}`).join("\n") : "(all namespaces allowed by default)");
  }
);

await server.connect(new StdioServerTransport());
console.error(`Carry MCP server ready on stdio · backend: ${store.backend()} · store: ${store.storePath()}`);
