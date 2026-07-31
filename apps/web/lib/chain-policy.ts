import type { Policy } from "@carry/core";
import { readIsAllowed } from "@/lib/sui";
import { DEFAULT_NETWORK, isDeployed, netCfg, type Network } from "@/lib/networks";

/**
 * The gate has to read the policy that actually governs it.
 *
 * Each route is its own serverless function with its own memory, so a policy
 * held in process is not shared with the route that answers a recall: a revoke
 * could look applied and still serve the data. The chain is the one copy every
 * route sees, and it is the same object the verifier recomputes against, so
 * reading it here is what makes the receipt and the answer agree.
 */

const TTL_MS = 5_000;
type Entry = { at: number; allowed: boolean };
const cache = new Map<string, Entry>();

export function policyNetwork(): Network {
  const requested = process.env.CARRY_ANCHOR_NETWORK;
  if (requested === "testnet" || requested === "mainnet") return requested;
  return isDeployed("mainnet") ? "mainnet" : DEFAULT_NETWORK;
}

async function allowed(agent: string, namespace: string, network: Network): Promise<boolean> {
  const key = `${network}:${agent}::${namespace}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.allowed;
  const value = await readIsAllowed(agent, namespace, netCfg(network).accessPolicy, network);
  cache.set(key, { at: Date.now(), allowed: value });
  return value;
}

/**
 * Build the policy slice this answer needs, straight from chain. A read that
 * fails resolves to denied — the gate must never open because a node was slow.
 */
export async function chainPolicyFor(
  agent: string,
  namespaces: string[],
  network: Network = policyNetwork()
): Promise<Policy> {
  const unique = [...new Set(namespaces)];
  const verdicts = await Promise.all(
    unique.map(async (ns) => {
      try {
        return [ns, await allowed(agent, ns, network)] as const;
      } catch {
        return [ns, false] as const;
      }
    })
  );
  return { [agent]: Object.fromEntries(verdicts) } as Policy;
}
