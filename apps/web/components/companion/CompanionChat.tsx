"use client";

import type { RefObject } from "react";
import { Icon, HeartIcon, ArrowRightIcon } from "@/components/icons";
import { ProofStrip } from "@/components/companion/ProofStrip";
import { cn } from "@/lib/cn";
import type { AnswerReceipt } from "@carry/core";

export type Message =
  | { role: "user"; id: string; text: string }
  | { role: "assistant"; id: string; text: string; receipt: AnswerReceipt }
  | { role: "system"; id: string; text: string };

const EXAMPLES = ["Am I allergic to anything?", "What helps with my migraines?", "What vegan meals do I prefer?"];

export function CompanionChat({
  messages,
  pending,
  query,
  onQueryChange,
  onSubmit,
  scrollRef,
}: {
  messages: Message[];
  pending: boolean;
  query: string;
  onQueryChange: (v: string) => void;
  onSubmit: (text: string) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col border-x border-dashed border-white/20">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {messages.length === 0 && !pending ? (
            <div className="flex flex-col items-center gap-5 py-20 text-center">
              <span className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-accent">
                <Icon icon={HeartIcon} size={26} aria-hidden />
              </span>
              <p className="max-w-sm text-sm leading-relaxed text-muted">
                I only remember what you allow — and every answer proves exactly what I used. What’s on your mind?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => onSubmit(ex)}
                    className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-accent/40 hover:text-white"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent/15 px-4 py-3 text-sm text-white">{msg.text}</div>
                  </div>
                );
              }
              if (msg.role === "system") {
                return (
                  <p key={msg.id} className="text-center text-[12px] italic text-faint">
                    {msg.text}
                  </p>
                );
              }
              return (
                <div key={msg.id} className="flex flex-col gap-2.5 self-start">
                  <div className="max-w-[88%] self-start rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-gray-200">
                    {msg.text}
                  </div>
                  <ProofStrip receipt={msg.receipt} />
                </div>
              );
            })
          )}
          {pending && (
            <div className="self-start rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-500">
              <span className="animate-pulse">Aria is thinking…</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-dashed border-white/20 px-6 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(query);
          }}
          className="mx-auto flex w-full max-w-2xl items-end gap-3"
        >
          <textarea
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(query);
              }
            }}
            rows={1}
            placeholder="Tell Aria what’s going on…"
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
  );
}
