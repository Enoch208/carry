import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const ROOT = "/Users/enoch/Developer/personal/carry";
const transport = new StdioClientTransport({
  command: "node",
  args: ["--import", "tsx", `${ROOT}/packages/carry-mcp/src/index.ts`],
  env: { ...process.env, CARRY_STORE: "/tmp/carry-mcp-test.json" },
});
const client = new Client({ name: "carry-test", version: "0.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

const call = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  return r.content.map((c) => c.text).join("\n");
};

console.log("\n=== remember (Agent stores facts) ===");
console.log(await call("carry_remember", { content: "Allergic to penicillin", namespace: "health" }));
console.log(await call("carry_remember", { content: "Prefers TypeScript and dark mode", namespace: "prefs" }));

console.log("\n=== recall 'allergic' — BEFORE revoke ===");
console.log(await call("carry_recall", { query: "allergic" }));

console.log("\n=== revoke 'health' ===");
console.log(await call("carry_set_access", { namespace: "health", allowed: false }));

console.log("\n=== recall 'allergic' — AFTER revoke (gate before generation) ===");
console.log(await call("carry_recall", { query: "allergic" }));

await client.close();
process.exit(0);
