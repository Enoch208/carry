"use client";

import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getPolicy, setAccess } from "@/lib/api";
import { NAMESPACES } from "@carry/core";
import { cn } from "@/lib/cn";
import { AGENT_LABELS } from "@/lib/agents";
import type { AgentId, NamespaceId, Policy } from "@carry/core";

const AGENTS: { id: AgentId; label: string }[] = (["agent-a", "agent-b"] as AgentId[]).map((id) => ({ id, label: AGENT_LABELS[id] }));

type PillSwitchProps = {
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
  disabled?: boolean;
};

function PillSwitch({ checked, onToggle, ariaLabel, disabled }: PillSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/10 p-0.5 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-accent" : "bg-white/10"
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function AccessMatrix() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    getPolicy().then(({ policy: p }) => setPolicy(p));
  }, []);

  async function handleToggle(agentId: AgentId, ns: NamespaceId) {
    if (!policy) return;
    const key = `${agentId}:${ns}`;
    const current = policy[agentId]?.[ns] === true;
    setPending((prev) => new Set(prev).add(key));
    try {
      const { policy: updated } = await setAccess(agentId, ns, !current);
      setPolicy(updated);
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  return (
    <div className="flex flex-1 flex-col border-x border-t border-dashed border-white/20 bg-[#050505]">
      <div className="border-b border-dashed border-white/20 px-8 py-6 md:px-12">
        <Eyebrow number="04" className="mb-6">
          Access control
        </Eyebrow>
        <h1 className="text-3xl font-light uppercase tracking-tight text-white">
          Agent × namespace policy
        </h1>
        <p className="mt-2 text-sm font-light text-gray-400">
          Flip a cell to grant or revoke retrieval access. The gate reads this
          policy before every memory lookup.
        </p>
      </div>

      <div className="overflow-x-auto p-8 md:p-12">
        {policy === null ? (
          <p className="text-sm text-gray-500">Loading policy…</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-48 pb-4 text-left" />
                {NAMESPACES.map((ns) => (
                  <th
                    key={ns}
                    className="pb-4 pr-6 text-left font-mono text-xs uppercase tracking-widest text-gray-400"
                  >
                    {ns}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AGENTS.map(({ id, label }, rowIdx) => (
                <tr
                  key={id}
                  className={cn(
                    "border-t border-dashed border-white/20",
                    rowIdx === AGENTS.length - 1 ? "border-b" : ""
                  )}
                >
                  <td className="py-5 pr-6">
                    <span className="text-sm font-medium text-white">
                      {label}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-widest text-gray-600">
                      {id}
                    </span>
                  </td>
                  {NAMESPACES.map((ns) => {
                    const allowed = policy[id]?.[ns] === true;
                    const key = `${id}:${ns}`;
                    return (
                      <td key={ns} className="py-5 pr-6">
                        <div className="flex flex-col gap-1.5">
                          <PillSwitch
                            checked={allowed}
                            onToggle={() => handleToggle(id, ns)}
                            ariaLabel={`${allowed ? "Revoke" : "Grant"} ${id} access to ${ns}`}
                            disabled={pending.has(key)}
                          />
                          <span
                            className={cn(
                              "font-mono text-[10px] uppercase tracking-wider",
                              allowed ? "text-accent" : "text-gray-600"
                            )}
                          >
                            {allowed ? "allow" : "deny"}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
