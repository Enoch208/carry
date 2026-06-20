import { Badge } from "@/components/ui/Badge";
import {
  Icon,
  ReceiptIcon,
  VerifiedIcon,
  CheckIcon,
  BlockedIcon,
} from "@/components/icons";
import { cn } from "@/lib/cn";
import { AGENT_LABELS } from "@/lib/agents";
import type { AnswerReceipt } from "@/lib/types";

type ReceiptPanelProps = {
  receipt: AnswerReceipt;
};

export function ReceiptPanel({ receipt }: ReceiptPanelProps) {
  const allVerified =
    receipt.usedMemories.length > 0 &&
    receipt.usedMemories.every((m) => m.authorized && m.verified);

  return (
    <div className="rounded-card border border-border-strong bg-elevated/90 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-accent/10 text-accent">
            <Icon icon={ReceiptIcon} size={18} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-fg">
              Answer Receipt
            </p>
            <p className="font-mono text-[11px] text-faint">
              {AGENT_LABELS[receipt.agentId] ?? receipt.agentId}
            </p>
          </div>
        </div>
        {allVerified && (
          <Badge variant="success">
            <Icon icon={VerifiedIcon} size={13} aria-hidden />
            Verified
          </Badge>
        )}
      </div>

      <div className="px-5 py-4">
        {receipt.usedMemories.length > 0 && (
          <>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
              Memory used
            </p>
            <ul className="mt-3 space-y-2.5">
              {receipt.usedMemories.map((memory) => (
                <li
                  key={memory.memoryId}
                  className="rounded-lg border border-border bg-surface px-3.5 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-accent">
                      {memory.namespace}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-3 text-[11px]",
                        memory.authorized && memory.verified
                          ? "text-success"
                          : "text-faint"
                      )}
                    >
                      {memory.authorized && (
                        <span className="flex items-center gap-1">
                          <Icon icon={CheckIcon} size={13} aria-hidden />
                          authorized
                        </span>
                      )}
                      {memory.verified && (
                        <span className="flex items-center gap-1">
                          <Icon icon={CheckIcon} size={13} aria-hidden />
                          verified
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-fg">{memory.snippet}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-faint">
                    <span>
                      {AGENT_LABELS[memory.sourceAgent] ?? memory.sourceAgent}
                    </span>
                    <span className="font-mono">walrus:{memory.walrusRef}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {receipt.blockedNamespaces.length > 0 && (
          <div
            className={cn(
              receipt.usedMemories.length > 0 ? "mt-4" : "mt-0"
            )}
          >
            <ul className="space-y-2">
              {receipt.blockedNamespaces.map((ns) => (
                <li
                  key={ns}
                  className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/[0.07] px-3.5 py-3"
                >
                  <Icon
                    icon={BlockedIcon}
                    size={16}
                    className="text-danger"
                    aria-hidden
                  />
                  <p className="text-sm text-fg">
                    <span className="font-mono text-danger">{ns}</span> blocked
                    by policy
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {receipt.usedMemories.length === 0 &&
          receipt.blockedNamespaces.length === 0 && (
            <p className="text-sm text-faint">No memory used for this answer.</p>
          )}
      </div>
    </div>
  );
}
