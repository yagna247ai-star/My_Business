"use client";
export default function Header({ onStart }: { onStart: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(7,10,18,0.82)] backdrop-blur">
      <div className="mx-auto max-w-[1480px] px-6 h-[64px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl grid place-items-center font-black bg-gold text-ink">B</div>
          <div>
            <div className="font-display tracking-[0.08em] text-[18px] leading-none">BANGI</div>
            <div className="mono text-[10px] tracking-[0.14em] text-white/45 -mt-1">NEXT.JS • HERMES-POWERED</div>
          </div>
          <span className="hidden md:inline-flex ml-3 items-center gap-2 mono text-[10px] tracking-[0.12em] px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">● GATEWAY :8001 • BACKEND :8000</span>
        </div>
        <nav className="hidden lg:flex gap-5 mono text-[11px] tracking-[0.10em] text-white/55">
          <a href="#desktop" className="text-white">DESKTOP</a><a href="#jobs">JOBS</a><a href="#crm">CRM</a><a href="#tasks">TASKS</a>
        </nav>
        <button onClick={onStart} className="px-5 py-2 rounded-full text-[13px] font-semibold bg-gold text-ink hover:bg-gold-soft transition">Start Bangi →</button>
      </div>
    </header>
  );
}
