import { cn } from "@/lib/cn";

type EyebrowProps = {
  number?: string;
  children: React.ReactNode;
  className?: string;
};

export function Eyebrow({ number, children, className }: EyebrowProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {number && (
        <>
          <span className="font-mono text-sm tracking-tighter text-white/40">
            {number}
          </span>
          <span className="h-4 w-px bg-white/20" />
        </>
      )}
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
        {children}
      </span>
    </div>
  );
}
