# Publishing the Carry packages to npm

Two packages are publish-ready and verified: **`@carry/cli`** (the `carry` command) and **`@carry/mcp`** (the MCP server). Publishing is a one-time, outward-facing action that needs your npm account — run these yourself.

## 1. Log in

```bash
npm login          # opens npmjs.com to authenticate
npm whoami         # confirm you're logged in
```

## 2. Claim the `@carry` scope (free, public)

Scoped packages (`@carry/*`) require an npm **org** named `carry`. Create it once:

- Go to <https://www.npmjs.com/org/create>, name it **carry**, pick the **Free** (public-packages) plan.

If `carry` is taken, you have two fallbacks — pick one and tell me, I'll rename the packages:
- publish under your own user scope: `@<your-npm-username>/carry-cli`, `@<your-npm-username>/carry-mcp`
- publish unscoped: `carry-mcp` is free; the CLI would become e.g. `carry-memory` (the bin stays `carry`).

## 3. Publish

```bash
# from the repo root
npm publish -w @carry/cli --access public
npm publish -w @carry/mcp --access public     # prepublishOnly bundles dist/ automatically
```

`@carry/cli` ships a single `bin/carry.mjs` (no build). `@carry/mcp` runs `npm run build` (esbuild bundle, `@carry/walrus` inlined) via `prepublishOnly`, so the published `dist/index.js` is self-contained — `npx @carry/mcp` needs only `@modelcontextprotocol/sdk` and `zod`.

## 4. Verify it's live

```bash
npx @carry/cli seed && npx @carry/cli recall "am I allergic to anything?"
npx -y @carry/mcp        # should print "Carry MCP server ready on stdio", then Ctrl-C
```

Then the README's `npx @carry/mcp` / `npx @carry/cli` lines are real, and the MCP config in any IDE can point at `npx -y @carry/mcp`.

> Already verified locally: both tarballs pack cleanly (`npm publish --dry-run`), the `carry` and `carry-mcp` bins link on install, and the bundled MCP completes a full remember → recall → revoke → blocked flow over stdio.
