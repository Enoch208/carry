import type { Metadata } from "next";
import { Companion } from "@/components/companion/Companion";

export const metadata: Metadata = {
  title: "Aria — a health companion, powered by Carry",
  description: "A health companion that only remembers what you allow — and proves it. Built on Carry: gated memory, verified on Walrus.",
};

export default function CompanionPage() {
  return <Companion />;
}
