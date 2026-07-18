#[test_only]
module carry::access_tests;

use carry::access::{Self, AccessPolicy, OwnerCap, Receipt};
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

    // honest anchor: used = [health] (allowed) -> all_authorized true, seq 0
    let used1 = vector[string::utf8(b"health")];
    let blocked = vector[];
    access::anchor_receipt(
        &mut policy, string::utf8(b"ans-1"), agent, used1, blocked,
        x"0102", string::utf8(b"blob1"), &clock, sc.ctx(),
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
        x"0304", string::utf8(b"blob2"), &clock, sc.ctx(),
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
