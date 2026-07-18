# Carry — 90-second demo script (classic 4-screen flow)

> For the **live finalist demo**, use [RUNOFSHOW.md](RUNOFSHOW.md) — it leads with Aria (`/companion`) and escalates through the terminal, on-chain, and MCP proof. This file is the shorter classic flow across the four core screens.

Run locally for the live demo: `npm run dev` → http://localhost:3000
Reset to a clean state anytime with **Reset demo** in the sidebar.

---

## Beat 1 — Teach · Chat A (GPT-4o) · 0:00–0:20

- Open **Chat A**. Under *Capture a fact*: namespace `health`, text `Allergic to penicillin`, **Save**.
- Point at **"Stored on Walrus"** and the real `blob:…` id.
- Line: *"That memory isn't in a database — it's a verifiable blob on Walrus."*

## Beat 2 — Cross-model recall · Chat B (Claude) · 0:20–0:45

- Switch to **Chat B** — a different model provider (Claude).
- Ask: **"Am I allergic to anything?"**
- It answers from the memory taught to the *other* agent.
- Point at the **Answer Receipt**: memory used · source agent · `walrusRef` · **verified** (the blob resolves on Walrus).
- Line: *"Different model, same memory — and a receipt proving exactly what it used and where it lives."*

## Beat 3 — Live revoke · Access · 0:45–1:10  ← the moment

- Go to **Access**. Flip **agent-b × health** OFF.
- Back in **Chat B**, ask again: **"Am I allergic to anything?"**
- It refuses: *"I cannot access your Health memory"* + `health blocked by policy`.
- Line: *"We just revoked access. The gate runs **before** generation — the model never saw it. And the receipt proves the block."*

## Beat 4 — Anchor · Dashboard · 1:10–1:30

- **Dashboard** → **Anchor on Walrus** on the latest receipt.
- Show the real `blob:…` id and **Verified**.
- Line: *"The whole receipt is now anchored on Walrus — portable, tamper-evident proof."*

## Close

*"Carry: gated, cross-model memory that lives on Walrus and proves itself on every answer."*
