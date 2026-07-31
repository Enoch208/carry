import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { readIsAllowed } from "@/lib/sui";
import { netCfg, resolveNetwork } from "@/lib/networks";
import { Icon, CheckIcon, BlockedIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Carry — Support agents",
  description: "A support desk where each agent's reach is enforced on-chain, not by a prompt.",
};

export const dynamic = "force-dynamic";

const AGENTS = [
  { id: "faq-agent", role: "Answers public questions" },
  { id: "billing-agent", role: "Handles invoices and charges" },
  { id: "refund-agent", role: "Processes refunds" },
  { id: "manager-agent", role: "Escalations and disputes" },
];

const NAMESPACES = ["public-support", "internal-process", "billing", "customer-pii", "legal", "admin"];

// Each row states what must be true, so a granted case and a denied case are
// both "correct" — the tick reflects reality matching the claim, not the value.
const STORIES = [
  ["The FAQ agent cannot reach billing", "faq-agent", "billing", false],
  ["Nor can it reach customer records", "faq-agent", "customer-pii", false],
  ["The refund agent works invoices but never customer records", "refund-agent", "customer-pii", false],
  ["Only the manager sees legal", "manager-agent", "legal", true],
  ["…and the refund agent does not", "refund-agent", "legal", false],
  ["admin was never granted to anyone", "manager-agent", "admin", false],
] as const;

export default async function EnterprisePage({
  searchParams,
}: {
  searchParams: Promise<{ network?: string }>;
}) {
  const sp = await searchParams;
  const network = resolveNetwork(sp.network);
  const cfg = netCfg(network);

  const matrix = await Promise.all(
    AGENTS.map(async (a) => ({
      ...a,
      grants: Object.fromEntries(
        await Promise.all(
          NAMESPACES.map(async (ns) => [ns, await readIsAllowed(a.id, ns, cfg.accessPolicy, network)] as const)
        )
      ) as Record<string, boolean>,
    }))
  );

  const stories = await Promise.all(
    STORIES.map(async ([label, agent, ns, expected]) => {
      const allowed = await readIsAllowed(agent, ns, cfg.accessPolicy, network);
      return { label, agent, ns, allowed, holds: allowed === expected };
    })
  );

  return (
    <div className="px-8 py-9">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-[15px] font-semibold text-fg">Support desk</h1>
            <p className="text-[12px] text-faint">
              four agents, six namespaces, read live from the {network} policy
            </p>
          </div>
        </header>

        <p className="mb-6 text-[13px] text-muted">
          A support desk is where this stops being abstract: a refund agent needs invoices but has no business
          reading medical notes or legal correspondence, and &ldquo;please do not look at that&rdquo; in a system
          prompt is not a control. Every cell below is a real{" "}
          <span className="font-mono text-[12px]">is_allowed</span> call against the policy object{" "}
          <a
            href={`${cfg.suiscan}/object/${cfg.accessPolicy}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-dotted"
          >
            on chain ↗
          </a>
          .
        </p>

        <div className="mb-8 overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-faint">agent</th>
                {NAMESPACES.map((ns) => (
                  <th key={ns} className="px-2 py-3 text-center font-mono text-[11px] font-normal text-faint">
                    {ns}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-mono text-[12px] text-fg">{a.id}</p>
                    <p className="text-[11px] text-faint">{a.role}</p>
                  </td>
                  {NAMESPACES.map((ns) => (
                    <td key={ns} className="px-2 py-3 text-center">
                      <Icon
                        icon={a.grants[ns] ? CheckIcon : BlockedIcon}
                        size={15}
                        className={a.grants[ns] ? "text-success" : "text-faint/40"}
                        aria-label={a.grants[ns] ? "allowed" : "denied"}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
          What that buys a compliance officer
        </p>
        <div className="space-y-2">
          {stories.map((s) => (
            <div key={s.label} className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              <Icon
                icon={s.holds ? CheckIcon : BlockedIcon}
                size={16}
                className={`mt-0.5 shrink-0 ${s.holds ? "text-success" : "text-danger"}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-fg">{s.label}</p>
                <p className="mt-0.5 font-mono text-[11px] text-faint">
                  is_allowed({s.agent}, {s.ns}) = {String(s.allowed)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-faint">
          Nothing here is configured in the app. Widening an agent&apos;s reach is a transaction on the policy
          object, and every answer it then gives carries a receipt that{" "}
          <Link href="/lab?network=mainnet" className="text-accent underline decoration-dotted">
            consensus recomputes
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
