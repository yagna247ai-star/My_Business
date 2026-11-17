"use client";
import { useState } from "react";

export default function DesktopPreview({ status, onCapture }: { status: string; onCapture: () => void }) {
  const [live] = useState(true);
  return (
    <div id="desktop" className="rounded-[20px] overflow-hidden border border-white/15 bg-black shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
      <div className="h-9 bg-panel border-b border-white/10 flex items-center gap-2 px-3 mono text-[10px] tracking-[0.10em] text-white/50">
        <span className="w-3 h-3 rounded-full bg-red-500" /><span className="w-3 h-3 rounded-full bg-yellow-500" /><span className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 hidden sm:inline">BANGI DESKTOP — SOM overlay [numbered] • AX tree • pid-scoped</span>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-gold text-ink font-bold">{live ? "LIVE" : "IDLE"}</span>
      </div>
      <div className="aspect-[16/10] relative overflow-hidden bg-[#020617]">
        <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop" alt="Desktop" className="w-full h-full object-cover opacity-55" />
        <span className="absolute w-7 h-7 rounded-full grid place-items-center mono text-[12px] font-bold bg-gold text-ink" style={{ top: "32%", left: "28%" }}>1</span>
        <span className="absolute w-7 h-7 rounded-full grid place-items-center mono text-[12px] font-bold bg-white text-ink" style={{ top: "48%", left: "54%" }}>2</span>
        <span className="absolute w-7 h-7 rounded-full grid place-items-center mono text-[12px] font-bold bg-white text-ink" style={{ top: "62%", left: "38%" }}>3</span>
        <div className="absolute bottom-3 inset-x-3 rounded-2xl p-3 flex items-center justify-between bg-[rgba(7,10,18,0.78)] border border-white/10 backdrop-blur">
          <div className="mono text-[11px] text-white/70"><span className="text-gold">●</span> Bangi views your screen — click by <b>element_index</b>, not pixels</div>
          <button onClick={onCapture} className="px-4 py-1.5 rounded-full bg-white text-ink mono text-[11px] font-semibold">Capture</button>
        </div>
      </div>
      <div className="px-3 py-2 flex justify-between mono text-[10px] tracking-[0.10em] text-white/40 bg-panel border-t border-white/10">
        <span>GATEWAY /api/task → BACKEND hybrid → CUA-DRIVER MCP</span><span className="text-gold font-bold">{status}</span>
      </div>
    </div>
  );
}
