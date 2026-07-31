import { readIsAllowed } from "@/lib/sui";
import { netCfg, type Network } from "@/lib/networks";

export type Probe = {
  id: string;
  attack: string;
  agent: string;
  namespace: string;
  /** What the gate must answer for Carry's claim to hold. */
  expected: boolean;
  why: string;
};

export type ProbeResult = Probe & { actual: boolean; passed: boolean };

export type LabReport = {
  network: Network;
  policyId: string;
  probes: ProbeResult[];
  total: number;
  passed: number;
  unauthorisedExposures: number;
  exposureRate: number;
};

/**
 * Every probe is a real `is_allowed` call against the live policy on chain —
 * simulated, so it costs nothing and cannot be faked server-side. The one
 * granted pair is a control: if it ever fails, the gate is broken shut and the
 * zeros below would be meaningless.
 */
export const PROBES: Probe[] = [
  {
    id: "control-granted",
    attack: "Control — a namespace the agent was explicitly granted",
    agent: "aria",
    namespace: "health",
    expected: true,
    why: "proves the gate is not simply denying everything",
  },
  {
    id: "never-granted",
    attack: "Read a namespace that was never granted",
    agent: "aria",
    namespace: "billing",
    expected: false,
    why: "the namespace the demo's agent must never reach",
  },
  {
    id: "unknown-agent",
    attack: "Unconfigured agent reads a granted namespace",
    agent: "attacker",
    namespace: "health",
    expected: false,
    why: "an agent nobody set up must inherit nothing",
  },
  {
    id: "unknown-namespace",
    attack: "Known agent reads a namespace nobody defined",
    agent: "aria",
    namespace: "payroll",
    expected: false,
    why: "a new namespace must not be readable before anyone grants it",
  },
  {
    id: "namespace-typo",
    attack: "Namespace guessing — one character off",
    agent: "aria",
    namespace: "healt",
    expected: false,
    why: "near-misses must not resolve to the real namespace",
  },
  {
    id: "namespace-case",
    attack: "Case variation on a granted namespace",
    agent: "aria",
    namespace: "Health",
    expected: false,
    why: "grants are exact; casing must not widen them",
  },
  {
    id: "namespace-prefix",
    attack: "Prefix extension of a granted namespace",
    agent: "aria",
    namespace: "health-admin",
    expected: false,
    why: "a grant on `health` must not imply `health-admin`",
  },
  {
    id: "agent-case",
    attack: "Case variation on the agent name",
    agent: "Aria",
    namespace: "health",
    expected: false,
    why: "agent identity is exact, not fuzzy",
  },
  {
    id: "separator-injection",
    attack: "Inject the key separator to forge a grant",
    agent: "aria",
    namespace: "health::aria",
    expected: false,
    why: "the `agent::namespace` key must not be forgeable from a namespace",
  },
  {
    id: "empty-namespace",
    attack: "Empty namespace",
    agent: "aria",
    namespace: "",
    expected: false,
    why: "an empty key must not match anything",
  },
];

/**
 * The superseded package is still on chain and still default-allow, so the same
 * probes can be run against both. That is the honest way to show the fix landed:
 * not a claim that the gate improved, but two live objects anyone can query.
 */
export const SUPERSEDED = {
  label: "v3 — default-allow",
  packageId: "0x010719e5141bc53bc32c1e75acf39872d1ee535d2f2b8bcdb059e4ece13ad0a4",
  accessPolicy: "0xf84eca67c85149ba18f581907dc5d95b9e3aa3b0e0cb3490c946e41de428a673",
};

export async function exposureOf(
  packageId: string,
  policyId: string,
  network: Network
): Promise<{ exposed: number; of: number }> {
  const attacks = PROBES.filter((p) => !p.expected);
  const results = await Promise.all(
    attacks.map((p) => readIsAllowed(p.agent, p.namespace, policyId, network, packageId))
  );
  return { exposed: results.filter(Boolean).length, of: attacks.length };
}

export async function runLab(network: Network): Promise<LabReport> {
  const cfg = netCfg(network);
  const probes: ProbeResult[] = await Promise.all(
    PROBES.map(async (p) => {
      const actual = await readIsAllowed(p.agent, p.namespace, cfg.accessPolicy, network);
      return { ...p, actual, passed: actual === p.expected };
    })
  );
  const shouldDeny = probes.filter((p) => !p.expected);
  const unauthorisedExposures = shouldDeny.filter((p) => p.actual).length;
  return {
    network,
    policyId: cfg.accessPolicy,
    probes,
    total: probes.length,
    passed: probes.filter((p) => p.passed).length,
    unauthorisedExposures,
    exposureRate: shouldDeny.length ? unauthorisedExposures / shouldDeny.length : 0,
  };
}

/** Write-path attacks cannot be simulated for free — these were run for real. */
export const ONCHAIN_REJECTIONS = [
  {
    attack: "Anchor a receipt citing a stale policy version",
    result: "aborted, code 1 — EStalePolicyVersion",
    why: "closes the window where a revoke lands mid-generation",
    tx: "DT3cCP6ubZiwKUFnCXCK85BG7rXJeX2PxbQ21kdwrRXo",
  },
  {
    attack: "Replay an already-anchored receipt's nonce",
    result: "aborted, code 2 — ENonceAlreadyUsed",
    why: "an authorized proof cannot be minted twice",
    tx: "",
  },
  {
    attack: "Overwrite a vault manifest from a stale read",
    result: "aborted, code 5 — EStaleManifestVersion",
    why: "two devices cannot silently clobber each other",
    tx: "",
  },
  {
    attack: "Claim a namespace the gate denies",
    result: "anchored with all_authorized: false",
    why: "consensus records the refusal instead of trusting the caller",
    tx: "GfGVhssu6SH5mDwmZd9RCupjuH5dZpeCFu3u19jqvZEX",
  },
];
