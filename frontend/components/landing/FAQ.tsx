"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { OutlineButton } from "@/components/ui/Buttons";
import { Icon, PlusIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

const faqs = [
  {
    q: "Is the revoke cryptographic?",
    a: "Today revoke is enforced before retrieval in Carry’s access layer — the gate never fetches a revoked namespace. Seal-based per-agent cryptographic enforcement, so even a leaked delegate key cannot read a revoked namespace, is on the roadmap.",
  },
  {
    q: "What gets anchored on Walrus?",
    a: "Memories are stored encrypted on Walrus via MemWal. You can also anchor an Answer Receipt as a Walrus blob, so its provenance is verifiable and tamper-evident.",
  },
  {
    q: "Does it work across different models?",
    a: "Yes. Agent A and Agent B can run on different model providers and still share the same gated memory — the proof travels with the answer, not the vendor.",
  },
  {
    q: "What does gate-before-generation mean?",
    a: "Access is checked at retrieval, before the model sees anything. The model only ever receives memory it is allowed to use, so the receipt is honest by construction.",
  },
  {
    q: "How is this different from plain AI memory?",
    a: "Most memory tools just store and recall. Carry adds a gate before generation and a verifiable receipt for every answer — control what each agent can use, and prove it.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="group border-b border-dashed border-white/20">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-8 p-8 text-left transition-colors hover:bg-white/[0.02] md:p-10"
      >
        <span className="text-lg font-light uppercase tracking-tight text-white">
          {q}
        </span>
        <span
          className={cn(
            "shrink-0 text-gray-500 transition-transform duration-300 group-hover:text-white",
            open && "rotate-45 text-accent"
          )}
        >
          <Icon icon={PlusIcon} size={24} aria-hidden />
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-xl px-8 pb-8 text-sm leading-relaxed text-gray-400 md:px-10 md:pb-10">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  return (
    <section
      id="faq"
      className="relative mx-auto flex w-full max-w-7xl flex-col border-x border-t border-dashed border-white/20 bg-[#050505]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-between border-b border-dashed border-white/20 p-8 md:p-12 lg:border-b-0 lg:border-r lg:p-16">
          <div>
            <Eyebrow number="07" className="mb-10">
              FAQs
            </Eyebrow>
            <h2 className="mb-6 text-4xl font-light uppercase leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
              Frequently
              <br />
              Asked Questions
            </h2>
            <p className="max-w-sm text-base font-light leading-relaxed text-gray-400 md:text-lg">
              Still unsure? We use precise language about what is enforced today
              versus what is on the roadmap — the honesty is the point.
            </p>
          </div>
          <div className="mt-12 lg:mt-0">
            <p className="mb-6 text-base text-white">
              Want specific guidance? Reach out.
            </p>
            <OutlineButton
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 tracking-widest text-accent"
            >
              Contact us
            </OutlineButton>
          </div>
        </div>
        <div className="flex flex-col">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
