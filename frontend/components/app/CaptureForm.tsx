"use client";

import { useState } from "react";
import { capture } from "@/lib/api";
import { NAMESPACES } from "@/lib/policy";
import type { AgentId, NamespaceId } from "@/lib/types";

type CaptureFormProps = {
  agentId: AgentId;
};

export function CaptureForm({ agentId }: CaptureFormProps) {
  const [namespace, setNamespace] = useState<NamespaceId>(NAMESPACES[0]);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle");

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setStatus("pending");
    try {
      await capture({ namespace, content: content.trim(), sourceAgent: agentId });
      setContent("");
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <div className="border-t border-dashed border-white/20 px-6 py-4">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-faint">
        Capture a fact
      </p>
      <form onSubmit={handleCapture} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <select
            value={namespace}
            onChange={(e) => setNamespace(e.target.value as NamespaceId)}
            className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-fg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {NAMESPACES.map((ns) => (
              <option key={ns} value={ns}>
                {ns}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter a fact to remember…"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-faint focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <button
            type="submit"
            disabled={status === "pending" || !content.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "pending" ? "Saving…" : "Save"}
          </button>
        </div>
        {status === "done" && (
          <p className="text-xs text-success">Fact captured successfully.</p>
        )}
      </form>
    </div>
  );
}
