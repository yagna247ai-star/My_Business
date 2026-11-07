"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// 17 items grouped into 5 as per spec
const groups = [
  {
    label: "LEARN",
    items: [
      { href: "/dashboard", label: "Home" },
      { href: "/levels", label: "My Levels" },
      { href: "/missions", label: "Learning Missions" },
      { href: "/playground", label: "AI Playground" },
    ],
  },
  {
    label: "BUILD",
    items: [
      { href: "/projects", label: "My Projects" },
      { href: "/github", label: "GitHub Lab" },
      { href: "/hackathons", label: "Hackathons" },
    ],
  },
  {
    label: "COMMUNITY",
    items: [
      { href: "/squads", label: "Squads" },
      { href: "/feed", label: "Community Feed" },
      { href: "/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    label: "GROW",
    items: [
      { href: "/resources", label: "Resources" },
      { href: "/career", label: "AI Career Paths" },
      { href: "/portfolio", label: "My Portfolio" },
      { href: "/certificates", label: "Certificates" },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      { href: "/coach", label: "Unstuck / AI Coach" },
      { href: "/feedback", label: "Feedback" },
      { href: "/profile", label: "Profile & Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-[#2A3250] bg-[#101426] p-4 md:flex md:flex-col">
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3878F6] text-xs font-extrabold">AH</div>
        <div>
          <div className="text-xs font-bold tracking-wide">
            AI ACCELERATOR <span className="text-[#8658E8]">HUB</span>
          </div>
          <div className="text-[10px] tracking-widest text-[#8890B0]">DARK TECH · GAMIFIED</div>
        </div>
      </div>
      <div className="mt-4 flex-1 space-y-5 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-2 text-[11px] font-semibold tracking-widest text-[#8890B0]">{g.label}</div>
            <div className="mt-2 space-y-1">
              {g.items.map((it) => {
                const active = pathname === it.href || pathname?.startsWith(it.href + "/");
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={cn(
                      "flex items-center rounded-xl px-3 py-2 text-sm font-medium",
                      active ? "bg-[#1E2438] text-white border border-[#2A3250]" : "text-[#A0A8C0] hover:bg-[#1E2438] hover:text-white"
                    )}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[#2A3250] pt-4">
        <div className="rounded-xl bg-[#1E2438] p-3">
          <div className="text-xs font-semibold">Weekly hackathon</div>
          <div className="mt-1 text-xs leading-4 text-[#A0A8C0]">Sun 10am IST — 4h live build</div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/dashboard", label: "Home" },
    { href: "/levels", label: "Levels" },
    { href: "/missions", label: "Missions" },
    { href: "/feed", label: "Community" },
    { href: "/profile", label: "Profile" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[#2A3250] bg-[#101426] px-2 py-2 md:hidden">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn("rounded-full px-3 py-1.5 text-xs font-medium", pathname === t.href ? "bg-[#1E2438] text-white" : "text-[#8890B0]")}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
