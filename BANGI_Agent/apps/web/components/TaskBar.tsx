"use client";
import { useState } from "react";
import { apiTask, connectWS } from "@/lib/api";

export default function TaskBar({ onLog }: { onLog: (m: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    const p = prompt.trim();
    if (!p) return;
    setBusy(true);
    onLog(`> ${p}`);
    onLog("→ gateway /api/task → hybrid router (Hermes direct → SOM fallback)…");
    try {
      // Try WS streaming first, fallback to REST
      const ws = connectWS((msg) => {
        if (msg.type === "progress") onLog(`… ${msg.step}: ${msg.detail}`);
        if (msg.type === "result") onLog(`✓ ${msg.mode || "done"}: ${JSON.stringify(msg).slice(0, 600)}`);
      });
      await new Promise<void>((res, rej) => {
        const to = setTimeout(() => { try { ws.close(); } catch {}; res(); }, 800);
        ws.onopen = () => { ws.send(JSON.stringify({ prompt: p })); };
        ws.onmessage = (e) => {
          try {
            const m = JSON.parse(e.data);
            if (m.type === "result") { clearTimeout(to); ws.close(); res(); }
          } catch {}
        };
        ws.onerror = () => { clearTimeout(to); res(); };
      });
      // If WS didn't return, use REST
      const r = await apiTask(p);
      onLog(`✓ ${r.mode || r.via}: ${JSON.stringify(r).slice(0, 600)}`);
    } catch (e: any) {
      onLog(`✗ ${e.message}`);
      // fallback: still try REST
      try {
        const r = await apiTask(p);
        onLog(`↻ REST fallback: ${r.mode}: ${JSON.stringify(r).slice(0, 600)}`);
      } catch {}
    } finally { setBusy(false); }
  }

  return (
    <section id="tasks" className="max-w-[1480px] mx-auto px-6 pb-10">
      <div className="rounded-[20px] bg-white/5 backdrop-blur border border-white/10 p-4 flex flex-col lg:flex-row gap-3">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Tell Bangi: 'Apply 10 jobs, check CRM, coach Yagna, any task' — via Gateway"
          className="flex-1 bg-white text-ink rounded-full px-5 py-3 placeholder:text-black/40 focus:outline-none"
        />
        <button onClick={run} disabled={busy} className="px-6 py-3 rounded-full font-semibold shrink-0 bg-gold text-ink disabled:opacity-50">
          {busy ? "Working…" : "Ask Bangi →"}
        </button>
      </div>
      <div className="mt-3 mono text-[11px] text-white/45">Gateway <code className="px-1.5 py-0.5 rounded bg-white/10">POST /api/task {`{prompt}`}</code> → Backend hybrid • WebSocket <code className="px-1.5 py-0.5 rounded bg-white/10">/ws</code> streams progress.</div>
    </section>
  );
}
