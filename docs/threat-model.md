# Carry — threat model

What Carry defends, what it does not, and the assumptions the guarantees rest on.
Written to be argued with: a claim nobody can attack is not a security claim.

Contracts referenced are `carry::access` v4 on Sui mainnet
(`0xeaf4e6e4e96e4f50dfcf2f4beebe3bacb766ad6cbf352b0982bd9631884032d8`).

## What Carry actually claims

1. An agent can only retrieve memory in a namespace it was explicitly granted.
2. Every memory-based answer can carry a proof of what was used, what was refused,
   and under which policy — verifiable by a stranger with no wallet.
3. That proof cannot be forged, replayed, or quietly re-pointed at other content.

Everything below is about how those three can fail.

## Assets

| Asset | Why an attacker wants it |
| --- | --- |
| Memory contents | the user's private facts |
| The access policy | widening it grants future reads |
| Receipts | a forged one launders an unauthorized answer |
| The vault manifest | swapping it changes what an agent recalls |
| The anchoring key | mints receipts |
| The OwnerCap | changes the gate |

## Defended, with the mechanism

**Retrieval of ungranted memory.** `is_allowed` is default-deny: absent means
denied. An agent nobody configured, or a namespace nobody defined, reads nothing.
Ten probes run against the live policy on every load of `/lab`, including
near-miss guessing, casing, prefix extension and separator injection.

**A lying receipt.** `anchor_receipt` recomputes the verdict on chain from the
policy rather than trusting the caller's claim, so a receipt asserting a
namespace the agent lacks is anchored with `all_authorized: false`.

**Revocation during generation.** Retrieval reads the policy, generation takes
time, and a revoke landing in between used to be papered over. A receipt cites
the `policy_version` it was computed against and consensus rejects it if the
policy has moved (`EStalePolicyVersion`).

**Replay.** Each receipt carries a single-use nonce; a second anchor with the
same nonce aborts (`ENonceAlreadyUsed`). A caller-supplied expiry stops an old
authorized receipt being presented later (`EReceiptExpired`).

**Swapping the content a proof refers to.** The receipt binds a blake2b256 digest
of the canonical blob. Changing the bytes changes the digest; the verifier
re-fetches and re-hashes rather than trusting the blob id.

**Reordering or excising history.** Receipts link into an append-only chain,
`chain_digest = blake2b256(prev_digest ++ digest)`.

**Exposing memory through the proof itself.** A Carry Proof is public. Sealed
receipts publish salted commitments instead of query, answer and memory
contents. The salt lives only in the openable payload, so a short value cannot
be brute-forced out of a hash.

**A compromised server widening access.** The anchoring key holds no OwnerCap.
It can append proofs; it cannot change the gate. The gateway refuses policy
writes with 501 for the same reason.

**Two devices clobbering a vault.** `update_manifest` takes the version the
writer read and rejects a stale write (`EStaleManifestVersion`).

## Not defended — be explicit

**A compromised OwnerCap holder.** Whoever holds it can grant anything. There is
no multisig, no timelock, no quorum. This is the single largest concentration of
risk in the system.

**The model provider.** Once memory is gated and handed to a model, Carry has no
control over what that provider does with it. The gate limits what is sent; it
cannot limit what a recipient retains.

**A malicious application.** Carry proves what the *contract* saw. An application
that retrieves memory and simply never anchors a receipt produces no proof —
absence of a receipt is not detected, only a false one is. Receipt coverage is a
property of the deployment, not of the protocol.

**Prompt injection inside stored memory.** A memory whose content manipulates a
model is retrieved and passed through if the namespace was granted. The gate is
an authorization boundary, not a content filter.

**Correlation from public receipts.** Commitments hide values, but namespaces,
timing, agent identity and frequency are public by design. An observer learns
that `manager-agent` read `legal` at a given time.

**Walrus availability.** Blobs expire when their epochs lapse and publishers can
fail. Content binding then cannot be checked — the verifier reports that rather
than passing, but the proof is weakened until the blob is restored.

**Key custody generally.** Keys live in environment variables and a local
keystore. There is no HSM and no rotation story yet.

## Assumptions

- Sui consensus is honest and live; a receipt is only as final as the chain.
- blake2b256 is collision-resistant. The Move and TypeScript implementations are
  pinned to each other by a golden-vector test, so a divergence is a build
  failure rather than a silent verification difference.
- Clock values come from Sui's `0x6`, so expiry is chain time, not caller time.
- Namespaces are exact strings. `health` and `Health` are different namespaces,
  deliberately — fuzzy matching would be a way to widen a grant.

## Known weaknesses worth attacking first

1. OwnerCap concentration — no multisig, no timelock.
2. No receipt-coverage guarantee: a deployment can answer without anchoring.
3. Sealed receipts commit to content but do not yet prove the *model* saw exactly
   that content; the binding is to what the application reported.
4. Vault manifests are integrity-protected but not confidential — entries reveal
   namespaces and blob ids even when memories are sealed.

Found something else? Open an issue. A threat model that only lists solved
problems is marketing.
