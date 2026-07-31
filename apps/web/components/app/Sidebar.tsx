"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Icon,
  TeachIcon,
  CrossModelIcon,
  MemoryIcon,
  MatrixIcon,
  GateIcon,
  OwnedIcon,
  VerifiedIcon,
  AnchorIcon,
  NamespaceIcon,
} from "@/components/icons";
import { resetDemo } from "@/lib/api";
import { cn } from "@/lib/cn";

// Two jobs, kept apart: driving an agent, and auditing what it did.
const navSections = [
  {
    label: "Agents",
    items: [
      { label: "Chat A", href: "/chat-a", icon: TeachIcon },
      { label: "Chat B", href: "/chat-b", icon: CrossModelIcon },
      { label: "Dashboard", href: "/dashboard", icon: MemoryIcon },
      { label: "Access", href: "/access", icon: MatrixIcon },
    ],
  },
  {
    label: "Trust & audit",
    items: [
      { label: "Console", href: "/console", icon: VerifiedIcon },
      { label: "Attack lab", href: "/lab", icon: GateIcon },
      { label: "Vault", href: "/vault", icon: OwnedIcon },
      { label: "Metrics", href: "/metrics", icon: AnchorIcon },
      { label: "Support desk", href: "/enterprise", icon: NamespaceIcon },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-56 shrink-0 flex-col border-r border-dashed border-white/20 bg-[#050505]">
      <div aria-label="Carry" className="flex items-center gap-1.5 border-b border-dashed border-white/20 px-5 py-5">
        <Image
          src="/carry_mark.png"
          alt=""
          width={594}
          height={662}
          className="h-5 w-auto"
        />
        <span aria-hidden className="text-xl font-light tracking-[0.14em] text-white">
          ARRY
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.16em] text-gray-600">{section.label}</p>
            {section.items.map(({ label, href, icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-white/8 text-accent" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon icon={icon} size={18} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-dashed border-white/20 px-3 py-4">
        <button
          type="button"
          onClick={() => resetDemo()}
          className="w-full px-3 py-2.5 text-left text-xs font-medium uppercase tracking-widest text-gray-500 transition-colors hover:text-white"
        >
          Reset demo
        </button>
      </div>
    </aside>
  );
}
