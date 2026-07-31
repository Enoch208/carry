import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { consoleView, type ConsoleReceipt } from "@/lib/console";
import { netCfg, resolveNetwork } from "@/lib/networks";
import { Icon, CheckIcon, BlockedIcon, ArrowUpRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Carry — Trust & audit console",
  description: "Who has access, what each answer used, and what was refused — read from chain.",
};

export const dynamic = "force-dynamic";

const short = (r: string) => (r && r.length > 18 ? `${r.slice(0, 8)}…${r.slice(-6)}` : r);
const when = (ms: number) => (ms ? new Date(ms).toISOString().replace("T", " ").slice(0, 16) : "—");

function Question({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="mb-3 flex items-baseline gap-3">
      <span className="font-mono text-[11px] text-faint">{n}</span>
      <span className="text-sm font-semibold text-fg">{children}</span>
    </p>
  );
}

function ReceiptRow({ r, suiscan }: { r: ConsoleReceipt; suiscan: string }) {
  return (
    <div className="flex items-start gap-3 border-t border-border px-4 py-3">
      <Icon
        icon={r.allAuthorized ? CheckIcon : BlockedIcon}
        size={15}
        className={`mt-0.5 shrink-0 ${r.allAuthorized ? "text-success" : "text-danger"}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-fg">
          <span className="font-mono text-[12px] text-muted">{r.agent}</span>
          {r.used.length ? <span className="text-muted"> used </span> : <span className="text-muted"> used nothing</span>}
          {r.used.map((n) => (
            <span key={n} className="ml-1 rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-fg">
              {n}
            </span>
          ))}
          {r.blocked.length ? (
            <>
              <span className="text-muted"> · refused </span>
              {r.blocked.map((n) => (
                <span key={n} className="ml-1 rounded-full border border-danger/40 px-2 py-0.5 font-mono text-[11px] text-danger">
                  {n}
                </span>
              ))}
            </>
          ) : null}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-faint">
          #{r.seq} · {when(r.timestampMs)}
          {r.policyVersion !== null ? ` · policy v${r.policyVersion}` : ""}
        </p>
      </div>
      <a
        href={`${suiscan}/object/${r.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 font-mono text-[11px] text-accent underline decoration-dotted"
      >
        {short(r.id)}
      </a>
    </div>
  );
}

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ network?: string }>;
}) {
  const sp = await searchParams;
  const network = resolveNetwork(sp.network);
  const cfg = netCfg(network);
  const v = await consoleView(network);

  return (
    <div className="px-8 py-9">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-[15px] font-semibold text-fg">Trust &amp; audit console</h1>
            <p className="text-[12px] text-faint">
              {network} · policy v{v.policyVersion ?? "—"} · every figure read from chain
            </p>
          </div>
          <a
            href={`/v1/audit?network=${network}`}
            className="text-[12px] text-faint transition-colors hover:text-accent"
          >
            API ↗
          </a>
        </header>

        {v.error ? (
          <div className="rounded-card border border-border bg-surface p-6 text-center text-sm text-muted">{v.error}</div>
        ) : (
          <>
            <section className="mb-8">
              <Question n="01">Which agents have access, and to what?</Question>
              <div className="overflow-x-auto rounded-card border border-border bg-surface">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-faint">agent</th>
                      {v.namespaces.map((ns) => (
                        <th key={ns} className="px-2 py-3 text-center font-mono text-[11px] font-normal text-faint">
                          {ns}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {v.agents.map((a) => (
                      <tr key={a} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 font-mono text-[12px] text-fg">{a}</td>
                        {v.namespaces.map((ns) => (
                          <td key={ns} className="px-2 py-2.5 text-center">
                            <Icon
                              icon={v.matrix[a]?.[ns] ? CheckIcon : BlockedIcon}
                              size={14}
                              className={v.matrix[a]?.[ns] ? "text-success" : "text-faint/35"}
                              aria-label={v.matrix[a]?.[ns] ? "allowed" : "denied"}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] text-faint">
                Read as live{" "}
                <span className="font-mono">is_allowed</span> calls against{" "}
                <a
                  href={`${cfg.suiscan}/object/${v.policyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline decoration-dotted"
                >
                  the policy object ↗
                </a>
                . Changing a cell is a transaction, not a setting.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-baseline justify-between">
                <Question n="02">What did each answer actually use?</Question>
                <a
                  href={`/v1/audit/export?network=${network}`}
                  className="text-[12px] text-accent underline decoration-dotted"
                >
                  export CSV ↓
                </a>
              </div>
              <div className="rounded-card border border-border bg-surface">
                {v.receipts.length ? (
                  v.receipts.map((r) => <ReceiptRow key={r.id} r={r} suiscan={cfg.suiscan} />)
                ) : (
                  <p className="px-4 py-6 text-center text-[13px] text-faint">No receipts anchored yet.</p>
                )}
              </div>
            </section>

            <section>
              <Question n="03">What was refused?</Question>
              <div className="rounded-card border border-border bg-surface">
                {v.refusals.length ? (
                  v.refusals.map((r) => <ReceiptRow key={r.id} r={r} suiscan={cfg.suiscan} />)
                ) : (
                  <p className="px-4 py-6 text-center text-[13px] text-faint">Nothing refused on this policy.</p>
                )}
              </div>
              <p className="mt-2 text-[11px] text-faint">
                A refusal is not a log line the app chose to write — consensus recomputed the verdict and recorded
                it, so an application cannot quietly omit one.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
