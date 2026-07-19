# Carry — live demo run-of-show

**Thesis in one line:** *Carry is proof-carrying memory for AI agents — one vault, gated on-chain, that proves on every answer what it used, whether it was allowed, and where it lives on Walrus.*

Target: **~3 minutes**, then Q&A. Lead with feeling, escalate to proof, close on the thesis. Every claim on screen is live.

---

## Pre-flight (before you walk up)

- [ ] `npm run dev` running → `http://localhost:3000` — open **`/companion`** in the front tab.
- [ ] A **terminal** tab, large font, ready. Run `carry seed` once so the vault is warm.
- [ ] `sui client active-address` set to testnet with a little SUI (`sui client gas`) — needed for the live on-chain anchor (`carry anchor --onchain` and the app's "Anchor on Sui"). If Sui isn't set up, the on-chain beat falls back to the pre-made Suiscan tx in the README.
- [ ] Browser tabs pre-opened (in case wifi is slow): the **violation tx** on Suiscan, `usecarry.xyz`.
- [ ] Vault clean: in the app, health granted (Aria's toggle blue). `carry access grant health` in the terminal.
- [ ] Phones-down moment planned for the revoke — that's the beat you want them watching.
- [ ] Backup ready: the recorded demo video + the screenshots (see bottom).

---

## Cold open — the problem (0:00–0:20)

> "AI agents are getting memory. The easy part is remembering. The hard part is **trust** — when an agent answers 'from memory,' you have no idea which memory it used, whether it was *allowed* to, or whether that data just leaked into a model you don't control. Carry fixes that. Watch."

Have **Aria** on screen.

## Act 1 — Aria, the feel (0:20–1:15) ← the emotional beat

1. Type: **"Am I allergic to anything?"**
   - Aria answers warmly: *"you're allergic to penicillin…"*
   - Point at the **Answer Receipt**: `health · Verified on Walrus`. On the right rail, the memory card glows green — *on Walrus*.
   > "It knows me — and under every answer is a receipt: exactly which memory it used, and proof that memory really lives on Walrus. Not a label. A live check."

2. **Flip the Health Vault toggle.** (This is the moment — slow down.)
   - The vault cards **lock red**. The gate log streams `policy … → revoke`.
   > "Now — I revoke Aria's access to my health data. Maybe I connected a third-party app. Maybe I just changed my mind."

3. Ask the **exact same question** again.
   - Aria: *"I can't see anything in your health vault right now… I won't guess."*
   - Receipt turns red: **`health — never fetched, the gate ran before Aria saw it`**.
   > "The model never saw it. The gate runs **before** generation — so the receipt doesn't *claim* privacy, it **proves** it. Your most sensitive data never reached the AI."

4. (Optional, 5s) Ask **"What vegan meals do I prefer?"** — it still answers.
   > "Diet still flows. This is per-namespace, not all-or-nothing."

## Act 2 — and it's real, everywhere (1:15–2:30)

**Terminal (infra credibility):**
```bash
carry recall "am I allergic to anything?"     # Answer Receipt prints in the shell, blob verified on Walrus
carry access revoke health
carry recall "am I allergic to anything?"     # 1 namespace blocked · your data never reached the model
```
> "Same vault, same gate — from a terminal. This isn't a UI trick; it's a memory layer any agent can use."

**On-chain, LIVE (the differentiator nobody else has):** in the terminal —
```bash
carry anchor --onchain                        # → all_authorized: true, real Sui tx + Suiscan link
carry anchor --onchain --claim billing        # → all_authorized: false — the chain caught the lie, live
```
> "The policy isn't my server — it's a Move package on Sui. Watch: I anchor an honest receipt, and consensus confirms it — here's the transaction. Now I anchor a receipt that **lies**, claiming a namespace it's not allowed — and the chain returns `false`. **It caught the lie. Live, on-chain.** None of the other memory projects can do that." *(Same button — "Anchor on Sui" — sits under every receipt in Aria if you'd rather stay in the app.)*

**MCP + SDK (the reach):** one line each.
> "The same vault plugs into Cursor, Claude Code, Claude Desktop over MCP — `npx @usecarry/mcp`. And any Vercel AI SDK agent gets it in one line — `withCarryMemory(model)` — gated memory in, a receipt out. One vault, every agent."

## Close — the thesis + the ask (2:30–3:00)

> "So: **one vault, every agent, provable everywhere.** Cross-model memory, gated before generation, stored on Walrus, enforced on Sui — and every answer carries its own proof. That's Carry. Everything you saw is live on testnet right now at usecarry.xyz. Thank you."

Land it, stop talking, take questions.

---

## If something breaks (backup plan)

- **Testnet slow / wifi flaky:** Carry is mock-first. Without Walrus env it degrades to deterministic mocks and the whole flow still runs — the receipts just say `mock` instead of a blob. The *gate and revoke logic is identical.* Don't apologize for it; the story is the same.
- **Live app won't load:** switch to `usecarry.xyz` (Vercel), or play the recorded demo video (in the repo root / YouTube link in the README).
- **Terminal misbehaves:** skip Act 2's terminal, go straight to the Suiscan tx tab — the on-chain proof is the strongest single artifact.
- **Everything dies:** the README's **Proof — nothing here is a mockup** section is all live links. Screen-share that and click through: the package on Suiscan, the two anchor txns, the Walrus blobs. It proves the whole thesis without the app.

## Anticipated judge questions (have answers ready)

- *"Isn't this just a permissions layer?"* → No — the differentiator is that enforcement happens **before retrieval** and every answer emits a portable **receipt** whose verdict is **recomputable on-chain**. Permissions systems tell you *no*; Carry *proves* what happened.
- *"Why Walrus / why Sui?"* → Walrus gives content-addressed, verifiable blobs so "verified" is a real GET, not a flag. Sui gives the policy an owner and makes the receipt verdict a consensus result, not my say-so.
- *"What's mocked?"* → Nothing in the core loop. Live GPT-4o + Claude, live Walrus blobs, a deployed Move package, real revoke. The only non-persistent piece is the in-process index across server restarts — it's in the honesty table.
- *"How is this different from Mem0 / a vector DB?"* → Those are recall engines. Carry is the **proof + access** layer on top: gate-before-generation, on-Walrus provenance, on-chain policy. Complementary, not competing.
