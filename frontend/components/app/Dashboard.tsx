"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon, MemoryIcon, ReceiptIcon } from "@/components/icons";
import { getMemories } from "@/lib/api";
import { MemoryCard } from "@/components/app/MemoryCard";
import { AnchorButton } from "@/components/app/AnchorButton";
import { ReceiptPanel } from "@/components/app/ReceiptPanel";
import type { AnswerReceipt, Memory } from "@/lib/types";

function readReceiptsFromStorage(): AnswerReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("carry:receipts");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AnswerReceipt[];
    return [...parsed].reverse();
  } catch {
    return [];
  }
}

const emptyReceipts: AnswerReceipt[] = [];

export function Dashboard() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const receipts = useSyncExternalStore(
    () => () => {},
    readReceiptsFromStorage,
    () => emptyReceipts,
  );

  useEffect(() => {
    void getMemories().then(({ memories: m }) => setMemories(m));
  }, []);

  const latestReceipt = receipts[0] ?? null;

  return (
    <div className="flex flex-1 flex-col border-x border-t border-dashed border-white/20 bg-[#050505]">
      <div className="border-b border-dashed border-white/20 px-8 py-6">
        <Eyebrow className="mb-2">Dashboard</Eyebrow>
        <h1 className="text-2xl font-light uppercase tracking-tight text-white">
          Memory &amp; Receipts
        </h1>
      </div>

      <div className="flex flex-1 flex-col gap-10 overflow-y-auto px-8 py-8">
        <section>
          <div className="mb-5 flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-accent/10 text-accent">
              <Icon icon={MemoryIcon} size={15} aria-hidden />
            </span>
            <h2 className="text-sm font-semibold text-fg">Memories</h2>
          </div>

          {memories.length === 0 ? (
            <p className="text-sm text-faint">
              No memories yet — capture something in Chat.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {memories.map((memory) => (
                <MemoryCard key={memory.memoryId} memory={memory} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-accent/10 text-accent">
                <Icon icon={ReceiptIcon} size={15} aria-hidden />
              </span>
              <h2 className="text-sm font-semibold text-fg">Receipt History</h2>
            </div>

            {latestReceipt && (
              <AnchorButton receipt={latestReceipt} />
            )}
          </div>

          {receipts.length === 0 ? (
            <p className="text-sm text-faint">
              No receipts yet — ask an agent something in Chat.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {receipts.map((receipt) => (
                <ReceiptPanel key={receipt.answerId} receipt={receipt} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
