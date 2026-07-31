import { Sidebar } from "@/components/app/Sidebar";

/**
 * The shell owns the viewport and only the content pane scrolls, so the sidebar
 * stays put on long pages like the console and the attack lab.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
