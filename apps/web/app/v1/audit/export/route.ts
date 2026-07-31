import { consoleView, toCsv } from "@/lib/console";
import { resolveNetwork } from "@/lib/networks";

export const maxDuration = 60;

/**
 * A compliance officer wants a file, not a screenshot. Deliberately unauthenticated
 * and read-only: everything in it is already public on chain, and an audit trail
 * nobody can pull is not an audit trail.
 */
export async function GET(req: Request) {
  const network = resolveNetwork(new URL(req.url).searchParams.get("network") ?? undefined);
  const v = await consoleView(network);
  const csv = toCsv(v.receipts);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="carry-receipts-${network}.csv"`,
      "cache-control": "no-store",
    },
  });
}
