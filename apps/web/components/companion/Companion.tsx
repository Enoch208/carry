"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon, ArrowUpRightIcon } from "@/components/icons";
import { sendCompanion, getMemories, getPolicy, setAccess } from "@/lib/api";
import { CompanionChat, type Message } from "@/components/companion/CompanionChat";
import { VaultRail } from "@/components/companion/VaultRail";
import { AccessGate } from "@/components/companion/AccessGate";
import type { LogLine, LogTone } from "@/components/companion/GateLog";
import { ARIA_AGENT, HEALTH_NAMESPACE } from "@/lib/companion";
import type { Memory } from "@carry/core";

const shortRef = (r: string) => (r.length > 16 ? `${r.slice(0, 8)}…${r.slice(-6)}` : r);
const uid = () => crypto.randomUUID();

export function Companion() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [healthGranted, setHealthGranted] = useState(true);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMemories().then((r) => setMemories(r.memories)).catch(() => {});
    getPolicy().then(({ policy }) => setHealthGranted(policy[ARIA_AGENT]?.[HEALTH_NAMESPACE] ?? true)).catch(() => {});
  }, []);

  const pushLog = (text: string, tone: LogTone) =>
    setLog((prev) => [...prev, { id: uid(), text, tone }].slice(-18));

  function streamReceiptLog(used: { namespace: string; walrusRef: string }[], blocked: string[]) {
    const lines: [string, LogTone][] = [];
    used.forEach((m) => {
      lines.push([`gate    aria × ${m.namespace} → allow`, "ok"]);
      lines.push([`walrus  GET ${shortRef(m.walrusRef)} → 200 ✓`, "ok"]);
    });
    blocked.forEach((ns) => lines.push([`gate    aria × ${ns} → BLOCK`, "blocked"]));
    lines.push([`receipt ${used.length} used · ${blocked.length} blocked`, "muted"]);
    lines.forEach(([t, tone], i) => setTimeout(() => pushLog(t, tone), 130 * (i + 1)));
  }

  async function submit(text: string) {
    const q = text.trim();
    if (!q || pending) return;
    setMessages((prev) => [...prev, { role: "user", id: uid(), text: q }]);
    setQuery("");
    setPending(true);
    pushLog(`→ recall "${q.length > 32 ? q.slice(0, 32) + "…" : q}"`, "req");
    try {
      const { answer, receipt } = await sendCompanion(q);
      setMessages((prev) => [...prev, { role: "assistant", id: uid(), text: answer, receipt }]);
      streamReceiptLog(receipt.usedMemories, receipt.blockedNamespaces);
    } finally {
      setPending(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
    }
  }

  async function toggle() {
    if (busy) return;
    const next = !healthGranted;
    setBusy(true);
    setHealthGranted(next);
    pushLog(`policy  aria × health → ${next ? "allow" : "revoke"}`, next ? "ok" : "blocked");
    setMessages((prev) => [
      ...prev,
      {
        role: "system",
        id: uid(),
        text: next
          ? "Health vault re-enabled — Aria can read it again."
          : "Health vault revoked. Ask Aria the same question — she’ll prove she can no longer see it.",
      },
    ]);
    try {
      await setAccess(ARIA_AGENT, HEALTH_NAMESPACE, next);
    } catch {
      setHealthGranted(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#050505]">
      <header className="border-b border-dashed border-white/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <Image src="/carry_mark.png" alt="" width={594} height={662} className="h-5 w-auto" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-semibold leading-tight text-fg">
              Aria <span className="font-normal text-muted">— health companion</span>
            </h1>
            <p className="text-[12px] text-faint">Powered by Carry · every answer carries its proof</p>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-border bg-white/[0.02] px-3 py-1 text-[11px] text-muted sm:inline-flex">
            <span className="size-1.5 rounded-full bg-success" />
            testnet · Walrus
          </span>
          <Link
            href="/dashboard"
            className="hidden items-center gap-1 text-[12px] text-faint transition-colors hover:text-accent md:inline-flex"
          >
            Carry app
            <Icon icon={ArrowUpRightIcon} size={13} aria-hidden />
          </Link>
        </div>
      </header>

      <div className="border-b border-dashed border-white/20 px-6 py-3 lg:hidden">
        <AccessGate granted={healthGranted} busy={busy} onToggle={toggle} />
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1">
        <CompanionChat
          messages={messages}
          pending={pending}
          query={query}
          onQueryChange={setQuery}
          onSubmit={submit}
          scrollRef={scrollRef}
        />
        <VaultRail memories={memories} healthGranted={healthGranted} busy={busy} onToggle={toggle} logLines={log} />
      </div>
    </div>
  );
}
