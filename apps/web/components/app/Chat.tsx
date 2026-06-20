"use client";

import { useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon, ArrowRightIcon, MemoryIcon } from "@/components/icons";
import { sendChat } from "@/lib/api";
import { AGENT_LABELS } from "@/lib/agents";
import { ReceiptPanel } from "@/components/app/ReceiptPanel";
import { CaptureForm } from "@/components/app/CaptureForm";
import { cn } from "@/lib/cn";
import type { AgentId, AnswerReceipt } from "@carry/core";

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
    try { localStorage.removeItem("carry:receipts"); } catch {}
  }
}

type ChatProps = {
  agentId: AgentId;
};

export function Chat({ agentId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function submit() {
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submit();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
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
          {messages.length === 0 && !pending ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-5 grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-accent">
                <Icon icon={MemoryIcon} size={22} aria-hidden />
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted">
                {agentId === "agent-a"
                  ? "Capture a fact below — then ask me to recall it. Every answer comes with a verifiable receipt."
                  : "Ask about anything in your allowed memory. Every answer comes with a verifiable receipt."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {["Am I allergic to anything?", "What do I like to eat?"].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setQuery(ex)}
                    className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-accent/40 hover:text-white"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {messages.map((msg) => {
                if (msg.role === "user") {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent/15 px-4 py-3 text-sm text-white">
                        {msg.text}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className="flex w-full flex-col gap-3 self-start">
                    <div className="max-w-[85%] self-start rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-gray-300">
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
          )}
        </div>

        {agentId === "agent-a" && <CaptureForm agentId={agentId} />}

        <div className="border-t border-dashed border-white/20 px-6 py-4">
          <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl items-end gap-3">
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
