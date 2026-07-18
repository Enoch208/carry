/// Carry — on-chain access policy + tamper-evident Answer Receipt proofs.
///
/// The agent × namespace retrieval gate lives on-chain: granting/revoking a
/// namespace is a Sui transaction. Anchoring an Answer Receipt makes the chain
/// (1) recompute the authorization verdict, (2) bind the proof to the exact
/// Walrus receipt blob via a blake2b256 digest, and (3) link it into an
/// append-only blake2b256 hash chain — then mint an owned, Display-enabled
/// `Receipt` proof object anyone can fetch and verify with no wallet.
module carry::access;

use std::string::{Self, String};
use sui::table::{Self, Table};
use sui::event;
use sui::clock::Clock;
use sui::hash;
use sui::package;
use sui::display;

const ENotOwner: u64 = 0;

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
    /// key = `agent::namespace`, value = allowed. Absent key = allowed (default-allow).
    grants: Table<String, bool>,
    /// Number of receipts anchored against this policy (the next `seq`).
    receipt_count: u64,
    /// blake2b256 head of the append-only receipt chain (empty before the first anchor).
    chain_head: vector<u8>,
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
    timestamp_ms: u64,
}

public struct AccessChanged has copy, drop {
    policy: ID,
    agent: String,
    namespace: String,
    allowed: bool,
}

public struct ReceiptAnchored has copy, drop {
    policy: ID,
    receipt: ID,
    seq: u64,
    answer_id: String,
    agent: String,
    all_authorized: bool,
    chain_digest: vector<u8>,
    timestamp_ms: u64,
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
    };
    let cap = OwnerCap { id: object::new(ctx), policy: object::id(&policy) };
    transfer::share_object(policy);
    transfer::public_transfer(cap, ctx.sender());
}

/// Grant (`allowed = true`) or revoke (`false`) an agent's access to a namespace.
public fun set_access(
    cap: &OwnerCap,
    policy: &mut AccessPolicy,
    agent: String,
    namespace: String,
    allowed: bool,
) {
    assert!(cap.policy == object::id(policy), ENotOwner);
    let k = gkey(&agent, &namespace);
    if (policy.grants.contains(k)) {
        *policy.grants.borrow_mut(k) = allowed;
    } else {
        policy.grants.add(k, allowed);
    };
    event::emit(AccessChanged { policy: object::id(policy), agent, namespace, allowed });
}

/// True unless the namespace was explicitly revoked for this agent.
public fun is_allowed(policy: &AccessPolicy, agent: String, namespace: String): bool {
    let k = gkey(&agent, &namespace);
    if (policy.grants.contains(k)) { *policy.grants.borrow(k) } else { true }
}

/// Anchor an Answer Receipt: recompute the verdict, extend the hash chain, and
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
    clock: &Clock,
    ctx: &mut TxContext,
) {
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
        timestamp_ms: clock.timestamp_ms(),
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
        timestamp_ms: r.timestamp_ms,
    });

    transfer::public_transfer(r, ctx.sender());
}

// ── read accessors (for off-chain verification) ────────────────────────────

public fun receipt_all_authorized(r: &Receipt): bool { r.all_authorized }
public fun receipt_seq(r: &Receipt): u64 { r.seq }
public fun receipt_digest(r: &Receipt): vector<u8> { r.digest }
public fun receipt_prev_digest(r: &Receipt): vector<u8> { r.prev_digest }
public fun receipt_chain_digest(r: &Receipt): vector<u8> { r.chain_digest }
public fun policy_receipt_count(p: &AccessPolicy): u64 { p.receipt_count }
public fun policy_chain_head(p: &AccessPolicy): vector<u8> { p.chain_head }
