# Carry SDK example

A ~50-line script that drives the Carry engine end-to-end using only the published packages — `@carry/core` (gate + receipts) and `@carry/walrus` (storage) — with no app or UI.

It shows the whole loop:

1. **Teach** — Agent A stores two memories on Walrus (real blob IDs).
2. **Gate before generation** — Agent B has the `health` namespace revoked, so the retrieval gate never returns it.
3. **Verify** — each recalled memory's blob is re-checked against the Walrus aggregator.
4. **Prove** — an Answer Receipt is printed: memories used, authorized, verified, `walrusRef`, and the blocked namespaces.

## Run

```bash
npm install                      # from the repo root
npm run start -w @carry/example
```

With `apps/web/.env.local` present (`WALRUS_PUBLISHER` + `WALRUS_AGGREGATOR`) it runs against **live Walrus testnet**; without it, it runs in **mock mode** — same output shape, no network.
