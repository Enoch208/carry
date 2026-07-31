#[test_only]
module carry::access_tests;

use carry::access::{Self, AccessPolicy, OwnerCap, Receipt, CarryVault};
use sui::test_scenario as ts;
use sui::clock;
use sui::hash;
use std::string::{Self, String};

#[test]
fun gate_defaults_allow_then_revokes() {
    let owner = @0xA;
    let mut sc = ts::begin(owner);

    access::create(sc.ctx());
    sc.next_tx(owner);

    let mut policy = sc.take_shared<AccessPolicy>();
    let cap = sc.take_from_sender<OwnerCap>();

    let agent = string::utf8(b"agent-b");
    let health = string::utf8(b"health");
    let diet = string::utf8(b"diet");

    // default-allow
    assert!(access::is_allowed(&policy, agent, health), 0);

    // revoke health
    access::set_access(&cap, &mut policy, agent, health, false);
    assert!(!access::is_allowed(&policy, agent, health), 1);

    // a different namespace stays allowed
    assert!(access::is_allowed(&policy, agent, diet), 2);

    // re-grant
    access::set_access(&cap, &mut policy, agent, health, true);
    assert!(access::is_allowed(&policy, agent, health), 3);

    sc.return_to_sender(cap);
    ts::return_shared(policy);
    sc.end();
}

#[test]
/// Pins blake2b256 so the Move chain digest matches the TypeScript verifier byte-for-byte.
fun blake2b256_abc_golden() {
    let msg = b"abc";
    let got = hash::blake2b256(&msg);
    let want = x"bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319";
    assert!(got == want, 0);
}

#[test]
fun anchor_mints_receipt_recomputes_and_chains() {
    let owner = @0xA;
    let mut sc = ts::begin(owner);

    access::create(sc.ctx());
    sc.next_tx(owner);

    let mut policy = sc.take_shared<AccessPolicy>();
    let cap = sc.take_from_sender<OwnerCap>();
    let clock = clock::create_for_testing(sc.ctx());

    let agent = string::utf8(b"aria");
    // aria is denied `billing` on-chain
    access::set_access(&cap, &mut policy, agent, string::utf8(b"billing"), false);

    let v = access::policy_version(&policy);

    // honest anchor: used = [health] (allowed) -> all_authorized true, seq 0
    let used1 = vector[string::utf8(b"health")];
    let blocked = vector[];
    access::anchor_receipt(
        &mut policy, string::utf8(b"ans-1"), agent, used1, blocked,
        x"0102", string::utf8(b"blob1"), v, string::utf8(b"n1"), 0, &clock, sc.ctx(),
    );
    sc.next_tx(owner);

    let r1 = sc.take_from_sender<Receipt>();
    assert!(access::receipt_all_authorized(&r1), 0);
    assert!(access::receipt_seq(&r1) == 0, 1);
    assert!(access::policy_receipt_count(&policy) == 1, 2);

    // tampered anchor: used = [billing] (revoked) -> all_authorized false, seq 1
    let used2 = vector[string::utf8(b"billing")];
    access::anchor_receipt(
        &mut policy, string::utf8(b"ans-2"), agent, used2, vector[],
        x"0304", string::utf8(b"blob2"), v, string::utf8(b"n2"), 0, &clock, sc.ctx(),
    );
    sc.next_tx(owner);

    let r2 = sc.take_from_sender<Receipt>();
    assert!(!access::receipt_all_authorized(&r2), 3);       // the chain caught the lie
    assert!(access::receipt_seq(&r2) == 1, 4);
    // chain link: r2.prev_digest == r1.chain_digest
    assert!(access::receipt_prev_digest(&r2) == access::receipt_chain_digest(&r1), 5);

    sc.return_to_sender(r1);
    sc.return_to_sender(r2);
    sc.return_to_sender(cap);
    ts::return_shared(policy);
    clock::destroy_for_testing(clock);
    sc.end();
}

#[test]
/// A revoke must move the policy version; re-asserting an existing value must not,
/// or every no-op write would invalidate receipts that are legitimately in flight.
fun revocation_bumps_version_but_noops_do_not() {
    let owner = @0xA;
    let mut sc = ts::begin(owner);
    access::create(sc.ctx());
    sc.next_tx(owner);

    let mut policy = sc.take_shared<AccessPolicy>();
    let cap = sc.take_from_sender<OwnerCap>();
    let agent = string::utf8(b"aria");
    let billing = string::utf8(b"billing");

    let v0 = access::policy_version(&policy);

    // granting what is already allowed by default changes nothing
    access::set_access(&cap, &mut policy, agent, billing, true);
    assert!(access::policy_version(&policy) == v0, 0);

    // revoking is a real change
    access::set_access(&cap, &mut policy, agent, billing, false);
    assert!(access::policy_version(&policy) == v0 + 1, 1);

    // repeating the revoke is not
    access::set_access(&cap, &mut policy, agent, billing, false);
    assert!(access::policy_version(&policy) == v0 + 1, 2);

    sc.return_to_sender(cap);
    ts::return_shared(policy);
    sc.end();
}

#[test]
#[expected_failure(abort_code = access::EStalePolicyVersion)]
/// The time-of-check/time-of-use window: retrieval read the policy, a revoke
/// landed, and the receipt must no longer anchor.
fun revoke_during_generation_rejects_the_receipt() {
    let owner = @0xA;
    let mut sc = ts::begin(owner);
    access::create(sc.ctx());
    sc.next_tx(owner);

    let mut policy = sc.take_shared<AccessPolicy>();
    let cap = sc.take_from_sender<OwnerCap>();
    let clock = clock::create_for_testing(sc.ctx());
    let agent = string::utf8(b"aria");

    // the version retrieval saw
    let stale = access::policy_version(&policy);
    // ... then access is revoked mid-generation
    access::set_access(&cap, &mut policy, agent, string::utf8(b"billing"), false);

    access::anchor_receipt(
        &mut policy, string::utf8(b"ans"), agent,
        vector[string::utf8(b"health")], vector[],
        x"0102", string::utf8(b"blob"), stale, string::utf8(b"n"), 0, &clock, sc.ctx(),
    );

    abort 42
}

#[test]
#[expected_failure(abort_code = access::ENonceAlreadyUsed)]
/// An authorized receipt must not be anchorable twice.
fun replaying_a_nonce_is_rejected() {
    let owner = @0xA;
    let mut sc = ts::begin(owner);
    access::create(sc.ctx());
    sc.next_tx(owner);

    let mut policy = sc.take_shared<AccessPolicy>();
    let clock = clock::create_for_testing(sc.ctx());
    let agent = string::utf8(b"aria");
    let v = access::policy_version(&policy);
    let nonce = string::utf8(b"same-nonce");

    access::anchor_receipt(
        &mut policy, string::utf8(b"ans-1"), agent, vector[string::utf8(b"health")], vector[],
        x"0102", string::utf8(b"blob"), v, nonce, 0, &clock, sc.ctx(),
    );
    sc.next_tx(owner);
    assert!(access::nonce_used(&policy, nonce), 0);

    access::anchor_receipt(
        &mut policy, string::utf8(b"ans-2"), agent, vector[string::utf8(b"health")], vector[],
        x"0102", string::utf8(b"blob"), v, nonce, 0, &clock, sc.ctx(),
    );

    abort 42
}

#[test]
#[expected_failure(abort_code = access::EReceiptExpired)]
fun an_expired_receipt_cannot_anchor() {
    let owner = @0xA;
    let mut sc = ts::begin(owner);
    access::create(sc.ctx());
    sc.next_tx(owner);

    let mut policy = sc.take_shared<AccessPolicy>();
    let mut clock = clock::create_for_testing(sc.ctx());
    clock::set_for_testing(&mut clock, 10_000);
    let v = access::policy_version(&policy);

    access::anchor_receipt(
        &mut policy, string::utf8(b"ans"), string::utf8(b"aria"),
        vector[string::utf8(b"health")], vector[],
        x"0102", string::utf8(b"blob"), v, string::utf8(b"n"), 9_999, &clock, sc.ctx(),
    );

    abort 42
}

#[test]
#[expected_failure(abort_code = access::ENotOwner)]
/// A capability for a different policy must not be able to change this one.
fun a_foreign_cap_cannot_change_the_policy() {
    let owner = @0xA;
    let mut sc = ts::begin(owner);
    access::create(sc.ctx());
    sc.next_tx(owner);
    let cap_a = sc.take_from_sender<OwnerCap>();

    access::create(sc.ctx());
    sc.next_tx(owner);
    let mut policy_b = sc.take_shared<AccessPolicy>();

    access::set_access(&cap_a, &mut policy_b, string::utf8(b"aria"), string::utf8(b"billing"), false);

    abort 42
}

#[test]
/// The vault manifest may only move forward, so two devices cannot clobber each other.
fun vault_manifest_advances_under_optimistic_concurrency() {
    let owner = @0xA;
    let mut sc = ts::begin(owner);
    access::create(sc.ctx());
    sc.next_tx(owner);

    let policy = sc.take_shared<AccessPolicy>();
    let clock = clock::create_for_testing(sc.ctx());

    access::create_vault(&policy, string::utf8(b"m1"), x"0101", &clock, sc.ctx());
    sc.next_tx(owner);

    let mut vault = sc.take_from_sender<CarryVault>();
    assert!(access::vault_manifest_version(&vault) == 1, 0);
    assert!(access::vault_owner(&vault) == owner, 1);

    access::update_manifest(&mut vault, string::utf8(b"m2"), x"0202", 1, &clock, sc.ctx());
    assert!(access::vault_manifest_version(&vault) == 2, 2);
    assert!(access::vault_manifest_blob(&vault) == string::utf8(b"m2"), 3);

    sc.return_to_sender(vault);
    ts::return_shared(policy);
    clock::destroy_for_testing(clock);
    sc.end();
}

#[test]
#[expected_failure(abort_code = access::EStaleManifestVersion)]
/// A second device writing from a stale read must lose rather than overwrite.
fun a_stale_manifest_write_is_rejected() {
    let owner = @0xA;
    let mut sc = ts::begin(owner);
    access::create(sc.ctx());
    sc.next_tx(owner);

    let policy = sc.take_shared<AccessPolicy>();
    let clock = clock::create_for_testing(sc.ctx());
    access::create_vault(&policy, string::utf8(b"m1"), x"0101", &clock, sc.ctx());
    sc.next_tx(owner);

    let mut vault = sc.take_from_sender<CarryVault>();
    access::update_manifest(&mut vault, string::utf8(b"m2"), x"0202", 1, &clock, sc.ctx());
    // device two still believes it is on version 1
    access::update_manifest(&mut vault, string::utf8(b"m3"), x"0303", 1, &clock, sc.ctx());

    abort 42
}
