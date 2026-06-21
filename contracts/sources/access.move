/// Carry — on-chain access policy + Answer Receipt anchoring.
///
/// The agent × namespace retrieval gate lives on-chain: granting/revoking a
/// namespace is a Sui transaction, and anchoring an Answer Receipt makes the
/// chain recompute the authorization verdict — so a receipt can't claim
/// "authorized" for a namespace the policy doesn't actually allow.
module carry::access;

use std::string::{Self, String};
use sui::table::{Self, Table};
use sui::event;
use sui::clock::Clock;

const ENotOwner: u64 = 0;

/// Capability proving ownership of a specific AccessPolicy.
public struct OwnerCap has key, store {
    id: UID,
    policy: ID,
}

/// Shared object: the agent × namespace access policy.
public struct AccessPolicy has key {
    id: UID,
    owner: address,
    /// key = `agent::namespace`, value = allowed. Absent key = allowed (default-allow).
    grants: Table<String, bool>,
}

public struct AccessChanged has copy, drop {
    policy: ID,
    agent: String,
    namespace: String,
    allowed: bool,
}

public struct ReceiptAnchored has copy, drop {
    policy: ID,
    answer_id: String,
    agent: String,
    used_namespaces: vector<String>,
    blocked_namespaces: vector<String>,
    all_authorized: bool,
    digest: vector<u8>,
    timestamp_ms: u64,
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

/// Anchor an Answer Receipt. The chain recomputes the verdict: every used
/// namespace must be allowed for the agent, else `all_authorized` is false.
public fun anchor_receipt(
    policy: &AccessPolicy,
    answer_id: String,
    agent: String,
    used_namespaces: vector<String>,
    blocked_namespaces: vector<String>,
    digest: vector<u8>,
    clock: &Clock,
) {
    let mut all_authorized = true;
    let mut i = 0;
    let n = used_namespaces.length();
    while (i < n) {
        if (!is_allowed(policy, agent, used_namespaces[i])) {
            all_authorized = false;
        };
        i = i + 1;
    };
    event::emit(ReceiptAnchored {
        policy: object::id(policy),
        answer_id,
        agent,
        used_namespaces,
        blocked_namespaces,
        all_authorized,
        digest,
        timestamp_ms: clock.timestamp_ms(),
    });
}
