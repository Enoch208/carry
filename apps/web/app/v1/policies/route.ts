import { store } from "@/lib/store";
import { authorize, ok, problem } from "@/lib/gateway";
import { chainPolicyFor, policyNetwork } from "@/lib/chain-policy";
import { netCfg } from "@/lib/networks";

export async function GET(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) return auth.res;
  const network = policyNetwork();
  const local = store.getPolicy();
  // Report what the gate will actually enforce, which is the chain.
  const onchain = Object.fromEntries(
    await Promise.all(
      Object.entries(local).map(async ([agent, ns]) => {
        const slice = await chainPolicyFor(agent, Object.keys(ns), network);
        return [agent, slice[agent as keyof typeof slice]] as const;
      })
    )
  );
  return ok({ policy: onchain, policyObject: netCfg(network).accessPolicy, network, source: "sui" });
}

export async function POST(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) return auth.res;
  const { agentId, namespace, allowed } = await req.json().catch(() => ({}));
  if (!agentId || !namespace || typeof allowed !== "boolean")
    return problem(400, "invalid_body", "`agentId`, `namespace` and boolean `allowed` are required.");
  // Changing the gate is an on-chain operation requiring the OwnerCap, which
  // this server deliberately does not hold — so it cannot silently widen access.
  return problem(
    501,
    "policy_is_onchain",
    `Grant or revoke with set_access on ${netCfg(policyNetwork()).accessPolicy}; the gateway reads the policy but cannot change it.`
  );
}
