import { Badge } from "@/components/ui/Badge";
import {
  Icon,
  ReceiptIcon,
  VerifiedIcon,
  CheckIcon,
  BlockedIcon,
  AnchorIcon,
} from "@/components/icons";

const usedMemories = [
  {
    namespace: "diet",
    snippet: "Prefers vegan meals",
    sourceAgent: "Agent A · GPT-4o",
    walrusRef: "0x9f2c…a7e1",
  },
  {
    namespace: "project",
    snippet: "Is building “Carry”",
    sourceAgent: "Agent A · GPT-4o",
    walrusRef: "0x41b8…0c3d",
  },
];

export function ReceiptCard() {
  return (
    <div className="rounded-card border border-border-strong bg-elevated/90 shadow-[0_28px_90px_-36px_rgba(0,0,0,0.95)] backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-accent/10 text-accent">
            <Icon icon={ReceiptIcon} size={18} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-fg">
              Answer Receipt
            </p>
            <p className="font-mono text-[11px] text-faint">agent-b · claude</p>
          </div>
        </div>
        <Badge variant="success">
          <Icon icon={VerifiedIcon} size={13} aria-hidden />
          Verified
        </Badge>
      </div>

      <div className="px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
          Memory used
        </p>
        <ul className="mt-3 space-y-2.5">
          {usedMemories.map((memory) => (
            <li
              key={memory.walrusRef}
              className="rounded-lg border border-border bg-surface px-3.5 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-accent">
                  {memory.namespace}
                </span>
                <span className="flex items-center gap-3 text-[11px] text-success">
                  <span className="flex items-center gap-1">
                    <Icon icon={CheckIcon} size={13} aria-hidden />
                    authorized
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon={CheckIcon} size={13} aria-hidden />
                    verified
                  </span>
                </span>
              </div>
              <p className="mt-2 text-sm text-fg">{memory.snippet}</p>
              <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-faint">
                <span>{memory.sourceAgent}</span>
                <span className="font-mono">walrus:{memory.walrusRef}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/[0.07] px-3.5 py-3">
          <Icon icon={BlockedIcon} size={16} className="text-danger" aria-hidden />
          <p className="text-sm text-fg">
            Blocked by policy: <span className="font-mono text-danger">health</span>
          </p>
          <span className="ml-auto text-[11px] text-faint">never retrieved</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] text-faint">Anchored on Walrus</p>
          <p className="truncate font-mono text-xs text-muted">blob:0x7d3e…ff90</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-fg">
          <Icon icon={AnchorIcon} size={15} aria-hidden />
          Anchor on Walrus
        </span>
      </div>
    </div>
  );
}
