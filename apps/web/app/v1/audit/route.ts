import { allMetrics } from "@/lib/metrics";
import { runLab } from "@/lib/lab";
import { resolveNetwork } from "@/lib/networks";
import { authorize, ok } from "@/lib/gateway";

export const maxDuration = 60;

/** Everything here is derived from chain state, so an auditor can re-derive it. */
export async function GET(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) return auth.res;
  const network = resolveNetwork(new URL(req.url).searchParams.get("network") ?? undefined);
  const [networks, gate] = await Promise.all([allMetrics(), runLab(network)]);
  return ok({
    networks,
    gate: {
      network: gate.network,
      policyId: gate.policyId,
      probesPassed: `${gate.passed}/${gate.total}`,
      unauthorisedExposures: gate.unauthorisedExposures,
      exposureRate: gate.exposureRate,
    },
    source: "Sui and Walrus, read at request time",
  });
}
