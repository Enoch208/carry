# @carry/mcp

**Gated, receipted, Walrus-verified memory for any MCP agent** — Cursor, Claude Code, Claude Desktop.

Carry gives your agent long-term memory where every recall comes with an **Answer Receipt**: what was used, whether it was authorized, whether each blob still resolves on Walrus, and which namespaces were **blocked before retrieval**. The access gate runs *before* the model sees anything — so a revoked namespace is never fetched, and the receipt proves it.

Shares one on-disk vault (`~/.carry/store.json`) with the [`carry` CLI](https://www.npmjs.com/package/@carry/cli): a fact you `carry remember` in the terminal is recalled by your IDE agent, under the same gate.

## Use

Add to your MCP client config (`.cursor/mcp.json`, Claude Desktop config, etc.):

```json
{
  "mcpServers": {
    "carry": {
      "command": "npx",
      "args": ["-y", "@carry/mcp"],
      "env": {
        "WALRUS_PUBLISHER": "https://publisher.walrus-testnet.walrus.space",
        "WALRUS_AGGREGATOR": "https://aggregator.walrus-testnet.walrus.space"
      }
    }
  }
}
```

Omit the `env` block to run against a deterministic mock (no network).

## Tools

| Tool | What it does |
| --- | --- |
| `carry_remember` | Store a fact → written to Walrus as a blob; returns the real ref |
| `carry_recall` | Retrieve memory **gated before retrieval**, with an Answer Receipt (used · verified-on-Walrus · blocked) |
| `carry_set_access` | Grant/revoke a namespace — a revoked namespace is never returned |
| `carry_list_memories` | List every memory + its Walrus ref |
| `carry_policy` | Show the allow/deny policy |

Part of [Carry](https://carrysui.vercel.app) — proof-carrying memory for AI agents, with an on-chain `carry::access` policy on Sui.

MIT © Carry
