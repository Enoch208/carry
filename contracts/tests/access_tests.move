#[test_only]
module carry::access_tests;

use carry::access::{Self, AccessPolicy, OwnerCap};
use sui::test_scenario as ts;
use std::string;

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
