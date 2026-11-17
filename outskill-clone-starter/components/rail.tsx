"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/path", label: "My Path" },
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Practice" },
  { href: "/explore", label: "Explore" },
  { href: "/work", label: "My Work" },
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    "My Path": "M4 18c4-2 4-10 8-12s5 2 8 0",
    Learn: "M4 5h6a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H4zM20 5h-6a3 3 0 0 0-3 3v11a3 3 0 0 1 3-3h6z",
    Practice: "M4 6h16M4 12h10M4 18h13",
    Explore: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3 6-2 5-5 2 2-5z",
    "My Work": "M4 7h16v13H4zM9 7V4h6v3",
  };

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function Rail() {
  const pathname = usePathname();

  return (
    <aside className="rail" aria-label="Learning navigation">
      <div className="brand">
        <Link className="wordmark" href="/path">
          Outskill<span>AI</span>
        </Link>
      </div>

      <p className="rail-label">YOUR LEARNING SPACE</p>

      <nav>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
              <Icon name={item.label} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="rail-bottom">
        <div className="note" aria-hidden="true">
          <span>Small steps.</span>
          <span>Useful skills.</span>
          <span>Real confidence.</span>
        </div>
        <div className="account">
          <span className="avatar">YO</span>
          <span>
            Your learning profile
            <small>Progress saved on this device</small>
          </span>
        </div>
      </div>
    </aside>
  );
}
