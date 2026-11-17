"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import DesktopPreview from "@/components/DesktopPreview";
import TaskBar from "@/components/TaskBar";
import { apiHealth, apiReport } from "@/lib/api";

export default function Page() {
  const [status, setStatus] = useState("IDLE");
  const [log, setLog] = useState("Bangi Next.js (port 3000) → Gateway :8001 → Backend :8000\nReady. Try: 'Apply 10 jobs, check CRM, coach Yagna' — any task via hybrid router.");
  const [health, setHealth] = useState<any>(null);
  const [report, setReport] = useState<string>("");

  useEffect(() => {
    apiHealth().then(setHealth).catch(() => setHealth({ gateway: "offline (run uv run gateway)" }));
    apiReport().then((r) => setReport(r.report || JSON.stringify(r).slice(0, 600))).catch(() => {});
  }, []);

  function append(m: string) { setLog((p) => p + "\n" + m); }

  async function task(prompt: string) {
    setStatus("WORKING…");
    append(`> ${prompt}`);
    append("→ POST /api/task {prompt} → Gateway → BangiAgent.do_task() → hybrid (direct API → SOM)");
    try {
      const r = await fetch("/api/task", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) }).then((x) => x.json());
      append(`✓ ${r.mode || r.via || "done"}: ${JSON.stringify(r).slice(0, 800)}`);
    } catch (e: any) {
      append(`✗ ${e.message} — is Gateway :8001 running? (uv run gateway)`);
    } finally { setStatus("IDLE"); }
  }

  function onCapture() { append("Screenshot + SOM [1][2][3] captured via cua-driver MCP (via Gateway /api/task)"); setStatus("CAPTURED"); setTimeout(() => setStatus("IDLE"), 1200); }

  return (
    <main className="overflow-x-hidden">
      <Header onStart={() => task("do all daily tasks: apply jobs, check CRM lead status, summarize")} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(900px 520px at 18% 10%, rgba(201,168,106,0.10), transparent 60%), radial-gradient(700px 460px at 92% 28%, rgba(16,185,129,0.07), transparent 60%)" }} />
        <div className="relative mx-auto max-w-[1480px] px-6 py-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-6">
          <div>
            <p className="inline-flex items-center gap-2 mono text-[11px] tracking-[0.12em] px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold"><span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Gateway :8001 • Next.js :3000 • Flutter → Bangi Hybrid</p>
            <h1 className="mt-4 font-display leading-[0.86] text-[52px] lg:text-[74px]">Hi, I&apos;m <span className="text-gold">Bangi.</span><br />I do all tasks.</h1>
            <p className="mt-4 text-white/65 max-w-[520px] leading-relaxed">Next.js web + Flutter mobile + Tauri desktop — one <b className="text-white">Gateway :8001</b> → Bangi Backend :8000 (Hermes hybrid). Direct skill API first (70% fewer tokens), SOM fallback only when no API.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => task("apply jobs")} className="px-6 py-3 rounded-full font-semibold bg-white text-ink">Apply jobs daily →</button>
              <button onClick={() => task("check CRM lead status")} className="px-6 py-3 rounded-full font-semibold bg-white/5 border border-white/15 hover:bg-white/10">Check CRM lead status</button>
              <button onClick={() => task("coach Yagna: how is my 4-pillar flow?")} className="px-6 py-3 rounded-full mono text-[12px] tracking-[0.10em] border border-white/10">Coach Yagna…</button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-[520px]">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><div className="mono text-[10px] tracking-[0.12em] text-gold">JOBS TODAY</div><div className="text-[22px] font-bold">24</div><div className="mono text-[10px] text-white/50">Naukri + LinkedIn</div></div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><div className="mono text-[10px] tracking-[0.12em] text-gold">CRM LEADS</div><div className="text-[22px] font-bold">147</div><div className="mono text-[10px] text-white/50">Hermes synced</div></div>
              <div className="rounded-2xl bg-gold text-ink p-4"><div className="mono text-[10px] tracking-[0.10em] opacity-60">GATEWAY</div><div className="text-[22px] font-bold">:8001</div><div className="mono text-[10px] opacity-60">/api + /ws</div></div>
            </div>
            {/* Health mini */}
            <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-3 mono text-[11px] text-white/60">
              <div className="flex gap-2 flex-wrap"><span className="px-2 py-1 rounded-full bg-white text-ink font-bold">Health</span><span className="px-2 py-1 rounded-full bg-white/10">{health ? JSON.stringify(health).slice(0, 120) : "loading…"}</span></div>
              {report && <div className="mt-2 p-2 rounded-lg bg-black/30 border border-white/5 whitespace-pre-wrap line-clamp-3">{report.slice(0, 280)}</div>}
            </div>
          </div>
          <DesktopPreview status={status} onCapture={onCapture} />
        </div>
      </section>

      {/* Jobs + CRM */}
      <section id="jobs" className="mx-auto max-w-[1480px] px-6 py-6 grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white text-ink p-6">
          <h2 className="font-display text-[28px]">Daily Jobs — Auto-Apply</h2>
          <p className="text-[13px] text-black/60 -mt-1">Via Gateway → Backend SOM: Naukri/LinkedIn click [1][2][3] — config <code className="px-1 py-0.5 rounded bg-black/5">jobs.selectors.yaml</code></p>
          <div className="mt-4 space-y-2 mono text-[12px]">
            <div className="flex justify-between border border-black/10 rounded-xl px-3 py-2"><span>LinkedIn — Applied</span><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">18 today</span></div>
            <div className="flex justify-between border border-black/10 rounded-xl px-3 py-2"><span>Naukri — Applied</span><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">6 today</span></div>
            <div className="flex justify-between border border-black/10 rounded-xl px-3 py-2"><span>Pending human review</span><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">2</span></div>
          </div>
          <button onClick={() => task("apply jobs now: Naukri LinkedIn with my resume")} className="mt-4 w-full bg-ink text-white py-3 rounded-full font-semibold">Run job applier via Gateway →</button>
        </div>
        <div id="crm" className="rounded-2xl bg-ink border border-white/10 p-6 text-white">
          <h2 className="font-display text-[28px]">CRM — Lead Status</h2>
          <p className="text-[13px] text-white/60 -mt-1">Direct API (no SOM): <code>GET /api/hermes/report</code> → Hermes tracker_sync</p>
          <div className="mt-4 grid grid-cols-3 gap-2 mono text-[11px] text-center">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3"><div className="text-[18px] font-bold">22</div>New leads</div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3"><div className="text-[18px] font-bold">8</div>Site visits</div>
            <div className="bg-gold text-ink rounded-xl p-3"><div className="text-[18px] font-bold">₹3.5L</div>Tokens</div>
          </div>
          <button onClick={() => task("check CRM lead status and update tracker")} className="mt-4 w-full bg-white text-ink py-3 rounded-full font-semibold">Check CRM via Gateway →</button>
          <p className="mono text-[10px] text-white/40 mt-2">Gateway direct: <code>/api/hermes/report</code> + <code>/api/hermes/lead</code> — 70% fewer tokens than SOM.</p>
        </div>
      </section>

      <TaskBar onLog={append} />
      <div className="mx-auto max-w-[1480px] px-6 pb-6">
        <div className="rounded-2xl bg-black border border-white/10 p-4 mono text-[12px] text-white/70 h-[160px] overflow-auto whitespace-pre-wrap">{log}</div>
        <div className="mt-3 flex flex-wrap gap-2 mono text-[11px] text-white/40">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Gateway: <code>uv run gateway</code> :8001</span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Backend: <code>uv run bangi</code> :8000</span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Web: <code>npm run dev</code> :3000</span>
          <span className="px-3 py-1 rounded-full bg-gold text-ink">Flutter: <code>flutter run</code></span>
        </div>
      </div>
    </main>
  );
}
