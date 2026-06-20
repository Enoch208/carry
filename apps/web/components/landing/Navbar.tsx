"use client";

import { useState } from "react";
import Image from "next/image";
import { GradientButton, OutlineButton } from "@/components/ui/Buttons";
import { Icon, MenuIcon, CloseIcon } from "@/components/icons";

const links = [
  { label: "How it works", href: "#how" },
  { label: "The receipt", href: "#proof" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

function Wordmark() {
  return (
    <a href="#top" className="group flex items-center gap-1.5" aria-label="Carry home">
      <Image
        src="/carry_mark.png"
        alt=""
        width={594}
        height={662}
        priority
        className="h-5 w-auto"
      />
      <span className="text-2xl font-light tracking-[0.14em] text-white">
        ARRY
      </span>
    </a>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative z-50 w-full">
      <div className="mx-auto max-w-7xl border-x border-dashed border-white/20">
        <div className="pt-6">
          <div className="flex h-14 items-center justify-between px-6">
            <Wordmark />

            <div className="hidden items-center gap-8 md:flex">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <OutlineButton
                href="https://github.com/Enoch208/carry"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex"
              >
                GitHub
              </OutlineButton>
              <GradientButton href="/chat-a" size="sm" className="hidden sm:inline-flex">
                Launch demo
              </GradientButton>
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                className="flex size-10 items-center justify-center text-white transition-colors hover:bg-white/5 md:hidden"
              >
                <Icon icon={open ? CloseIcon : MenuIcon} size={24} />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 w-full border-t border-dashed border-white/20" />
      </div>

      {open && (
        <div className="border-b border-dashed border-white/20 bg-[#050505]/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-2 py-3 text-base font-medium text-gray-400 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <GradientButton href="/chat-a" size="sm" className="mt-3 w-full">
              Launch demo
            </GradientButton>
          </div>
        </div>
      )}
    </nav>
  );
}
