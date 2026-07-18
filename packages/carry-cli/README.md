# @usecarry/cli

**Proof-carrying memory for AI agents — from your terminal.**

`carry` gives you gated, receipted, Walrus-verified memory as a command-line tool. Every `recall` prints an **Answer Receipt**: what memory was used, whether the agent was allowed to use it, and whether each blob still resolves on Walrus. Revoke a namespace and the gate runs *before* retrieval — so your data is never fetched, and the receipt proves it.

It shares one on-disk vault (`~/.carry/store.json`) with the [Carry MCP server](https://www.npmjs.com/package/@usecarry/mcp), so a fact you `remember` in the terminal is recalled by an MCP agent in your IDE — same vault, same gate, same proof.

## Install

```bash
npm i -g @usecarry/cli      # or: npx @usecarry/cli <command>
```

## Use

```bash
carry seed                                    # load a demo vault (real Walrus testnet blobs)
carry recall "am I allergic to anything?"     # → Answer Receipt: authorized ✓  verified ✓ on Walrus
carry access revoke health                    # flip the retrieval gate
carry recall "am I allergic to anything?"     # → 1 namespace blocked · your data never reached the model
carry remember "Blood type is O negative" --ns health   # store a new fact on Walrus
carry anchor                                  # write the receipt itself to Walrus (resolvable blob)
carry list                                    # every memory + its Walrus ref
carry policy                                  # the allow/deny policy
```

## Config

| Env | Default |
| --- | --- |
| `WALRUS_PUBLISHER` | `https://publisher.walrus-testnet.walrus.space` |
| `WALRUS_AGGREGATOR` | `https://aggregator.walrus-testnet.walrus.space` |
| `CARRY_STORE` | `~/.carry/store.json` |

Works out of the box against Walrus testnet — no keys required.

## How it works

The gate is enforced **before** retrieval: `recall` filters to allowed namespaces, then does a live aggregator `GET` on each used blob to prove it resolves. Blocked namespaces are never fetched — the receipt shows them as blocked, not omitted. This is the same engine behind the [Carry](https://carrysui.vercel.app) app and its on-chain `carry::access` policy on Sui.

MIT © Carry
