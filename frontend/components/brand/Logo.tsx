import Image from "next/image";
import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  size?: number;
  showWordmark?: boolean;
};

export function Logo({ className, size = 30, showWordmark = true }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/carry_logo.png"
        alt="Carry"
        width={size}
        height={size}
        priority
        className="rounded-md ring-1 ring-border"
      />
      {showWordmark && (
        <span className="text-lg font-bold tracking-tight text-fg">Carry</span>
      )}
    </span>
  );
}
