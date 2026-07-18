# Publishing the Carry packages to npm

Two packages are publish-ready and verified: **`@usecarry/cli`** (the `carry` command) and **`@usecarry/mcp`** (the MCP server). Publishing is a one-time, outward-facing action that needs your npm account — run these yourself.

## 1. Log in

```bash
npm login          # opens npmjs.com to authenticate
npm whoami         # confirm you're logged in
```

## 2. Scope — done ✅

The packages publish under the **`@usecarry`** org (already created; owner `enochid`). Nothing to set up — just publish.

## 3. Publish

```bash
# from the repo root
npm publish -w @usecarry/cli --access public
npm publish -w @usecarry/mcp --access public     # prepublishOnly bundles dist/ automatically
```

`@usecarry/cli` ships a single `bin/carry.mjs` (no build). `@usecarry/mcp` runs `npm run build` (esbuild bundle, `@carry/walrus` inlined) via `prepublishOnly`, so the published `dist/index.js` is self-contained — `npx @usecarry/mcp` needs only `@modelcontextprotocol/sdk` and `zod`.

## 4. Verify it's live

```bash
npx @usecarry/cli seed && npx @usecarry/cli recall "am I allergic to anything?"
npx -y @usecarry/mcp        # should print "Carry MCP server ready on stdio", then Ctrl-C
```

Then the README's `npx @usecarry/mcp` / `npx @usecarry/cli` lines are real, and the MCP config in any IDE can point at `npx -y @usecarry/mcp`.

> Already verified locally: both tarballs pack cleanly (`npm publish --dry-run`), the `carry` and `carry-mcp` bins link on install, and the bundled MCP completes a full remember → recall → revoke → blocked flow over stdio.
