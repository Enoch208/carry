"use client";

import { useState } from "react";
import { capture } from "@/lib/api";
import { NAMESPACES } from "@carry/core";
import type { AgentId, NamespaceId } from "@carry/core";

type CaptureFormProps = {
  agentId: AgentId;
};

export function CaptureForm({ agentId }: CaptureFormProps) {
  const [namespace, setNamespace] = useState<NamespaceId>(NAMESPACES[0]);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [savedRef, setSavedRef] = useState<string | null>(null);

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setStatus("pending");
    try {
      const { memory } = await capture({ namespace, content: content.trim(), sourceAgent: agentId });
      if (!memory) throw new Error("store failed");
      setSavedRef(memory.walrusRef);
      setContent("");
      setStatus("done");
      setTimeout(() => { setStatus("idle"); setSavedRef(null); }, 5000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
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
          <p className="flex items-center gap-2 text-xs text-success">
            Stored on Walrus
            {savedRef && (
              <span className="font-mono text-faint">
                blob:{savedRef.length > 14 ? `${savedRef.slice(0, 8)}…${savedRef.slice(-4)}` : savedRef}
              </span>
            )}
          </p>
        )}
        {status === "error" && (
          <p className="text-xs text-danger">Walrus store failed — check the connection and try again.</p>
        )}
      </form>
    </div>
  );
}
