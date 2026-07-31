/// Carry — on-chain access policy + tamper-evident Answer Receipt proofs.
///
/// The agent × namespace retrieval gate lives on-chain: granting/revoking a
/// namespace is a Sui transaction. Anchoring an Answer Receipt makes the chain
/// (1) recompute the authorization verdict, (2) bind the proof to the exact
/// Walrus receipt blob via a blake2b256 digest, and (3) link it into an
/// append-only blake2b256 hash chain — then mint an owned, Display-enabled
/// `Receipt` proof object anyone can fetch and verify with no wallet.
///
/// A receipt is only accepted while the policy it was generated against is
/// still current: retrieval reads the policy, generation takes time, and a
/// revoke landing in between must invalidate the proof rather than be papered
/// over. `policy_version` closes that window, and a single-use nonce plus a
/// caller-supplied expiry stop an old authorized receipt being replayed.
module carry::access;

use std::string::{Self, String};
use sui::table::{Self, Table};
use sui::event;
use sui::clock::Clock;
use sui::hash;
use sui::package;
use sui::display;

const ENotOwner: u64 = 0;
/// The policy changed between retrieval and anchoring.
const EStalePolicyVersion: u64 = 1;
/// This nonce already anchored a receipt against this policy.
const ENonceAlreadyUsed: u64 = 2;
/// The receipt was presented after its expiry.
const EReceiptExpired: u64 = 3;
const ENotVaultOwner: u64 = 4;
/// A vault manifest may only move forward.
const EStaleManifestVersion: u64 = 5;

/// One-time witness for claiming the Publisher (module name, uppercased).
public struct ACCESS has drop {}

/// Capability proving ownership of a specific AccessPolicy.
public struct OwnerCap has key, store {
    id: UID,
    policy: ID,
}

/// Shared object: the agent × namespace access policy + receipt-chain head.
public struct AccessPolicy has key {
    id: UID,
    owner: address,
    /// key = `agent::namespace`, value = allowed. Absent key = denied (default-deny).
    grants: Table<String, bool>,
    /// Number of receipts anchored against this policy (the next `seq`).
    receipt_count: u64,
    /// blake2b256 head of the append-only receipt chain (empty before the first anchor).
    chain_head: vector<u8>,
    /// Bumped on every effective access change; receipts must cite the current value.
    policy_version: u64,
    /// Nonces already spent, so an authorized receipt cannot be anchored twice.
    used_nonces: Table<String, bool>,
}

/// Owned, Display-enabled proof of a single Answer Receipt.
public struct Receipt has key, store {
    id: UID,
    policy: ID,
    seq: u64,
    answer_id: String,
    agent: String,
    used_namespaces: vector<String>,
    blocked_namespaces: vector<String>,
    /// The chain's own verdict, recomputed here — not the app's claim.
    all_authorized: bool,
    /// blake2b256 of the canonical Walrus receipt blob (content binding).
    digest: vector<u8>,
    /// chain head before this receipt.
    prev_digest: vector<u8>,
    /// blake2b256(prev_digest ++ digest) — tamper-evident ordering.
    chain_digest: vector<u8>,
    /// the Walrus blob id the receipt JSON was stored under.
    walrus_blob: String,
    /// the policy version the verdict was computed against.
    policy_version: u64,
    /// single-use, so this proof cannot be replayed.
    nonce: String,
    expires_at_ms: u64,
    timestamp_ms: u64,
}

/// Owned anchor for a portable memory vault: the manifest lives on Walrus,
/// its identity and integrity live here, so a wallet is enough to recover it.
public struct CarryVault has key, store {
    id: UID,
    owner: address,
    policy: ID,
    /// Walrus blob holding the (encrypted) memory manifest.
    manifest_blob: String,
    /// blake2b256 of the canonical manifest bytes.
    manifest_digest: vector<u8>,
    /// Monotonic manifest version — replaces "latest write wins".
    manifest_version: u64,
    updated_at_ms: u64,
}

public struct AccessChanged has copy, drop {
    policy: ID,
    agent: String,
    namespace: String,
    allowed: bool,
    policy_version: u64,
}

public struct ReceiptAnchored has copy, drop {
    policy: ID,
    receipt: ID,
    seq: u64,
    answer_id: String,
    agent: String,
    all_authorized: bool,
    chain_digest: vector<u8>,
    policy_version: u64,
    timestamp_ms: u64,
}

public struct VaultUpdated has copy, drop {
    vault: ID,
    owner: address,
    manifest_blob: String,
    manifest_version: u64,
    updated_at_ms: u64,
}

fun init(otw: ACCESS, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);
    let mut d = display::new<Receipt>(&publisher, ctx);
    d.add(string::utf8(b"name"), string::utf8(b"Carry Proof #{seq}"));
    d.add(
        string::utf8(b"description"),
        string::utf8(b"A proof-carrying Answer Receipt anchored on Sui by Carry."),
    );
    d.add(string::utf8(b"agent"), string::utf8(b"{agent}"));
    d.add(string::utf8(b"all_authorized"), string::utf8(b"{all_authorized}"));
    d.add(string::utf8(b"policy_version"), string::utf8(b"{policy_version}"));
    d.update_version();
    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(d, ctx.sender());
}

fun gkey(agent: &String, namespace: &String): String {
    let mut k = *agent;
    string::append(&mut k, string::utf8(b"::"));
    string::append(&mut k, *namespace);
    k
}

/// Create a shared AccessPolicy; the sender receives the matching OwnerCap.
#[allow(lint(self_transfer))]
public fun create(ctx: &mut TxContext) {
    let policy = AccessPolicy {
        id: object::new(ctx),
        owner: ctx.sender(),
        grants: table::new(ctx),
        receipt_count: 0,
        chain_head: vector[],
        policy_version: 1,
        used_nonces: table::new(ctx),
    };
    let cap = OwnerCap { id: object::new(ctx), policy: object::id(&policy) };
    transfer::share_object(policy);
    transfer::public_transfer(cap, ctx.sender());
}

/// Grant (`allowed = true`) or revoke (`false`) an agent's access to a namespace.
/// Only an effective change bumps `policy_version`, so re-asserting the current
/// state does not needlessly invalidate receipts that are mid-flight.
public fun set_access(
    cap: &OwnerCap,
    policy: &mut AccessPolicy,
    agent: String,
    namespace: String,
    allowed: bool,
) {
    assert!(cap.policy == object::id(policy), ENotOwner);
    let k = gkey(&agent, &namespace);
    let changed = if (policy.grants.contains(k)) {
        let current = policy.grants.borrow_mut(k);
        let differs = *current != allowed;
        *current = allowed;
        differs
    } else {
        policy.grants.add(k, allowed);
        // absent means denied, so a grant is a real change and a deny is not
        allowed
    };
    if (changed) {
        policy.policy_version = policy.policy_version + 1;
    };
    event::emit(AccessChanged {
        policy: object::id(policy),
        agent,
        namespace,
        allowed,
        policy_version: policy.policy_version,
    });
}

/// True only where the agent was explicitly granted the namespace.
///
/// Default-deny is the whole point: an agent nobody has configured, or a
/// namespace nobody thought about, must resolve to no access. Anything else
/// means a typo or a new namespace silently widens what a model can read.
public fun is_allowed(policy: &AccessPolicy, agent: String, namespace: String): bool {
    let k = gkey(&agent, &namespace);
    if (policy.grants.contains(k)) { *policy.grants.borrow(k) } else { false }
}

/// Anchor an Answer Receipt: reject it if the policy moved, the nonce was already
/// spent or it expired; then recompute the verdict, extend the hash chain, and
/// mint an owned `Receipt` proof object transferred to the caller. Callable by
/// anyone — the chain is append-only; only `set_access` needs the OwnerCap.
#[allow(lint(self_transfer))]
public fun anchor_receipt(
    policy: &mut AccessPolicy,
    answer_id: String,
    agent: String,
    used_namespaces: vector<String>,
    blocked_namespaces: vector<String>,
    digest: vector<u8>,
    walrus_blob: String,
    policy_version: u64,
    nonce: String,
    expires_at_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // 0. the receipt must describe the policy as it is now, be fresh, and be new
    assert!(policy_version == policy.policy_version, EStalePolicyVersion);
    let now = clock.timestamp_ms();
    assert!(expires_at_ms == 0 || now <= expires_at_ms, EReceiptExpired);
    assert!(!policy.used_nonces.contains(nonce), ENonceAlreadyUsed);
    policy.used_nonces.add(nonce, true);

    // 1. recompute the verdict on-chain
    let mut all_authorized = true;
    let mut i = 0;
    let n = used_namespaces.length();
    while (i < n) {
        if (!is_allowed(policy, agent, used_namespaces[i])) {
            all_authorized = false;
        };
        i = i + 1;
    };

    // 2. extend the blake2b256 hash chain: chain_digest = blake2b256(prev ++ digest)
    let prev = policy.chain_head;
    let mut buf = prev;
    vector::append(&mut buf, digest);
    let chain_digest = hash::blake2b256(&buf);
    let seq = policy.receipt_count;
    let pid = object::id(policy);

    // 3. mint the Receipt, advance the chain head
    let r = Receipt {
        id: object::new(ctx),
        policy: pid,
        seq,
        answer_id,
        agent,
        used_namespaces,
        blocked_namespaces,
        all_authorized,
        digest,
        prev_digest: prev,
        chain_digest,
        walrus_blob,
        policy_version,
        nonce,
        expires_at_ms,
        timestamp_ms: now,
    };
    let rid = object::id(&r);
    policy.receipt_count = seq + 1;
    policy.chain_head = chain_digest;

    event::emit(ReceiptAnchored {
        policy: pid,
        receipt: rid,
        seq,
        answer_id: r.answer_id,
        agent: r.agent,
        all_authorized,
        chain_digest: r.chain_digest,
        policy_version,
        timestamp_ms: r.timestamp_ms,
    });

    transfer::public_transfer(r, ctx.sender());
}

// ── portable vault ──────────────────────────────────────────────────────────

/// Create the on-chain anchor for a memory vault. The manifest itself stays on
/// Walrus; what lives here is who owns it, which policy governs it, and the
/// digest that proves the manifest has not been swapped.
#[allow(lint(self_transfer))]
public fun create_vault(
    policy: &AccessPolicy,
    manifest_blob: String,
    manifest_digest: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let vault = CarryVault {
        id: object::new(ctx),
        owner: ctx.sender(),
        policy: object::id(policy),
        manifest_blob,
        manifest_digest,
        manifest_version: 1,
        updated_at_ms: clock.timestamp_ms(),
    };
    event::emit(VaultUpdated {
        vault: object::id(&vault),
        owner: vault.owner,
        manifest_blob: vault.manifest_blob,
        manifest_version: vault.manifest_version,
        updated_at_ms: vault.updated_at_ms,
    });
    transfer::public_transfer(vault, ctx.sender());
}

/// Point the vault at a new manifest. `expected_version` must match the stored
/// version, so two devices writing concurrently cannot silently clobber one
/// another — the loser is rejected and re-reads.
public fun update_manifest(
    vault: &mut CarryVault,
    manifest_blob: String,
    manifest_digest: vector<u8>,
    expected_version: u64,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(vault.owner == ctx.sender(), ENotVaultOwner);
    assert!(expected_version == vault.manifest_version, EStaleManifestVersion);
    vault.manifest_blob = manifest_blob;
    vault.manifest_digest = manifest_digest;
    vault.manifest_version = vault.manifest_version + 1;
    vault.updated_at_ms = clock.timestamp_ms();
    event::emit(VaultUpdated {
        vault: object::id(vault),
        owner: vault.owner,
        manifest_blob: vault.manifest_blob,
        manifest_version: vault.manifest_version,
        updated_at_ms: vault.updated_at_ms,
    });
}

// ── read accessors (for off-chain verification) ────────────────────────────

public fun receipt_all_authorized(r: &Receipt): bool { r.all_authorized }
public fun receipt_seq(r: &Receipt): u64 { r.seq }
public fun receipt_digest(r: &Receipt): vector<u8> { r.digest }
public fun receipt_prev_digest(r: &Receipt): vector<u8> { r.prev_digest }
public fun receipt_chain_digest(r: &Receipt): vector<u8> { r.chain_digest }
public fun receipt_policy_version(r: &Receipt): u64 { r.policy_version }
public fun receipt_nonce(r: &Receipt): String { r.nonce }
public fun receipt_expires_at_ms(r: &Receipt): u64 { r.expires_at_ms }
public fun policy_receipt_count(p: &AccessPolicy): u64 { p.receipt_count }
public fun policy_chain_head(p: &AccessPolicy): vector<u8> { p.chain_head }
public fun policy_version(p: &AccessPolicy): u64 { p.policy_version }
public fun nonce_used(p: &AccessPolicy, nonce: String): bool { p.used_nonces.contains(nonce) }
public fun vault_manifest_blob(v: &CarryVault): String { v.manifest_blob }
public fun vault_manifest_digest(v: &CarryVault): vector<u8> { v.manifest_digest }
public fun vault_manifest_version(v: &CarryVault): u64 { v.manifest_version }
public fun vault_owner(v: &CarryVault): address { v.owner }
