import { Sidebar, MobileNav } from "@/components/shell/Sidebar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#101426] text-white">
      <Sidebar />
      <div className="flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#2A3250] bg-[#101426]/90 px-4 backdrop-blur md:px-6">
          <div className="text-sm font-semibold">AI Accelerator Hub</div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#E8B94F] px-2.5 py-1 text-xs font-bold text-[#101426]">Demo tenant</span>
            <span className="hidden text-xs text-[#8890B0] md:inline">student@aihub.in · learner</span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 pb-20 md:p-6 md:pb-6">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
