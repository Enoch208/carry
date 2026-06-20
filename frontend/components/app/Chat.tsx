"use client";

import { useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon, ArrowRightIcon } from "@/components/icons";
import { capture, sendChat } from "@/lib/api";
import { NAMESPACES } from "@/lib/policy";
import { ReceiptPanel } from "@/components/app/ReceiptPanel";
import { cn } from "@/lib/cn";
import type { AgentId, AnswerReceipt, NamespaceId } from "@/lib/types";

const AGENT_LABELS: Record<AgentId, string> = {
  "agent-a": "Agent A · GPT-4o",
  "agent-b": "Agent B · Claude",
};

const AGENT_ROLES: Record<AgentId, string> = {
  "agent-a": "writer",
  "agent-b": "reader",
};

type UserMessage = {
  role: "user";
  id: string;
  text: string;
};

type AssistantMessage = {
  role: "assistant";
  id: string;
  text: string;
  receipt: AnswerReceipt;
};

type Message = UserMessage | AssistantMessage;

function appendReceiptToStorage(receipt: AnswerReceipt) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("carry:receipts");
    const existing: AnswerReceipt[] = raw ? (JSON.parse(raw) as AnswerReceipt[]) : [];
    existing.push(receipt);
    const trimmed = existing.slice(-20);
    localStorage.setItem("carry:receipts", JSON.stringify(trimmed));
  } catch {
  }
}

type CaptureFormProps = {
  agentId: AgentId;
};

function CaptureForm({ agentId }: CaptureFormProps) {
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

type ChatProps = {
  agentId: AgentId;
};

export function Chat({ agentId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = query.trim();
    if (!text || pending) return;

    const userId = crypto.randomUUID();
    setMessages((prev) => [...prev, { role: "user", id: userId, text }]);
    setQuery("");
    setPending(true);

    try {
      const { answer, receipt } = await sendChat(agentId, text);
      const assistantMsg: AssistantMessage = {
        role: "assistant",
        id: crypto.randomUUID(),
        text: answer,
        receipt,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      appendReceiptToStorage(receipt);
    } finally {
      setPending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="flex flex-1 flex-col border-x border-t border-dashed border-white/20 bg-[#050505]">
      <div className="border-b border-dashed border-white/20 px-8 py-6">
        <Eyebrow className="mb-2">
          {AGENT_LABELS[agentId]} · {AGENT_ROLES[agentId]}
        </Eyebrow>
        <h1 className="text-2xl font-light uppercase tracking-tight text-white">
          {AGENT_LABELS[agentId]}
        </h1>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 && (
            <p className="text-center text-sm text-faint">
              Ask {AGENT_LABELS[agentId]} anything…
            </p>
          )}
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-accent/15 px-4 py-3 text-sm text-white">
                      {msg.text}
                    </div>
                  </div>
                );
              }
              return (
                <div key={msg.id} className="flex flex-col gap-3 self-start w-full max-w-[90%]">
                  <div className="self-start rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-gray-300">
                    {msg.text}
                  </div>
                  <ReceiptPanel receipt={msg.receipt} />
                </div>
              );
            })}
            {pending && (
              <div className="self-start rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-500">
                <span className="animate-pulse">Thinking…</span>
              </div>
            )}
          </div>
        </div>

        {agentId === "agent-a" && <CaptureForm agentId={agentId} />}

        <div className="border-t border-dashed border-white/20 px-6 py-4">
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={`Ask ${AGENT_LABELS[agentId]} something…`}
              className={cn(
                "flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-fg placeholder:text-faint",
                "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              )}
            />
            <button
              type="submit"
              disabled={pending || !query.trim()}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon icon={ArrowRightIcon} size={18} aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
