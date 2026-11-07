import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#101426] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#2A3250] bg-[#101426]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3878F6] text-sm font-extrabold">AH</div>
            <div>
              <div className="text-sm font-bold leading-none tracking-wide">
                AI ACCELERATOR <span className="text-[#8658E8]">HUB</span>
              </div>
              <div className="text-[11px] tracking-widest text-[#A0A8C0]">LEARN · BUILD · PROVE</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-[#A0A8C0] md:flex">
            <Link href="#journey" className="hover:text-white">
              Journey
            </Link>
            <Link href="#levels" className="hover:text-white">
              Levels
            </Link>
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-[#2A3250] px-5 py-2 text-sm font-medium hover:border-[#3878F6]/40 hover:bg-[#1E2438]"
            >
              Sign in
            </Link>
            <Link href="/register" className="rounded-full bg-[#3878F6] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#2f66d6]">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — dark, no purple-blue gradient, no aurora */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2A3250] bg-[#1E2438] px-3 py-1 text-xs font-medium text-[#A0A8C0]">
              <span className="h-2 w-2 rounded-full bg-[#E8B94F]" /> 15 levels · 8 tracks · Weekly hackathons
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Learn AI by shipping.
              <br />
              <span className="text-[#A0A8C0]">Prove it with projects.</span>
            </h1>
            <p className="mt-4 max-w-[60ch] text-[15px] leading-6 text-[#A0A8C0]">
              A Cohort-based GenAI platform where every level ends in a GitHub repo, every submission gets rubric feedback, and your
              portfolio — not a certificate — gets you discovered. India-first, enterprise-ready.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className="rounded-full bg-[#3878F6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2f66d6]">
                Join Level 1 — Free
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-[#2A3250] bg-[#1E2438] px-6 py-3 text-sm font-semibold hover:border-[#3878F6]/30"
              >
                View demo dashboard
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-[#8890B0]">
              <span>✓ No card stored for free tier</span>
              <span>✓ Mentor + AI review</span>
              <span>✓ GitHub portfolio</span>
            </div>
          </div>

          {/* Proof card — not a bento, not a 3-card grid */}
          <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Level 1 — AI Awakening</div>
              <span className="rounded-full bg-[#E8B94F] px-2.5 py-1 text-xs font-bold text-[#101426]">120 XP</span>
            </div>
            <p className="mt-1 text-sm leading-5 text-[#A0A8C0]">The Mould &amp; the Cookie — classes, objects, git, first proof.</p>
            <div className="mt-4 space-y-2">
              {[
                { label: "Mission Briefing", xp: 5, done: true },
                { label: "Learn — Classes & Objects", xp: 18, done: true },
                { label: "Explore GitHub — Cookie Demo", xp: 10, done: false },
                { label: "Build — Your Cookie Class", xp: 35, done: false },
                { label: "Submit Proof", xp: 5, done: false },
                { label: "Boss — The Mould Trial", xp: 47, done: false },
              ].map((a) => (
                <div key={a.label} className="flex items-center justify-between rounded-xl border border-[#2A3250] bg-[#101426] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${a.done ? "bg-[#E8B94F]" : "bg-[#2A3250]"}`} />
                    <span className={`text-sm ${a.done ? "text-white" : "text-[#A0A8C0]"}`}>{a.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#E8B94F]">+{a.xp} XP</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#101426] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8890B0]">Progress</span>
                <span className="font-semibold text-white">23 / 120 XP</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#2A3250]">
                <div className="h-2 rounded-full bg-[#3878F6]" style={{ width: "19%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey strip */}
      <section id="journey" className="border-y border-[#2A3250] bg-[#0e1324]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold">15-level career journey</h2>
            <span className="text-xs text-[#8890B0]">Progressive unlock — competence-gated, not time-gated</span>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {[
              { stage: "Ignition", levels: "1–3", desc: "Foundations, prompts, memory" },
              { stage: "Craft", levels: "4–6", desc: "Tools, RAG, hybrid retrieval" },
              { stage: "Ship", levels: "7–10", desc: "Agents, eval, workflows, capstone" },
              { stage: "Specialize", levels: "11–13", desc: "Pick 1 of 8 tracks" },
              { stage: "Launch", levels: "14–15", desc: "Team hackathon, career" },
            ].map((s) => (
              <div key={s.stage} className="rounded-xl border border-[#2A3250] bg-[#1E2438] p-4">
                <div className="text-xs font-semibold tracking-widest text-[#E8B94F]">{s.stage.toUpperCase()}</div>
                <div className="mt-1 text-sm font-semibold">{s.levels}</div>
                <div className="mt-1 text-xs leading-4 text-[#A0A8C0]">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value — single column list, not 3-card grid */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-lg font-bold">Why teams choose this hub</h2>
        <div className="mt-6 divide-y divide-[#2A3250] rounded-2xl border border-[#2A3250] bg-[#1E2438]">
          {[
            { title: "Real submissions, real reviews", desc: "GitHub URL + deployed link + reflection — scored on a 5-dimension rubric by mentor + AI, with appeals." },
            { title: "XP that means something", desc: "Server-authoritative ledger with idempotency, hash chain, anti-fraud. Streaks are non-punitive with freeze & recovery." },
            { title: "Multi-tenant by design", desc: "Shared schema + Postgres RLS, tenant-isolated S3 prefixes, Socket rooms, and DPDP-ready residency ap-south-1." },
            { title: "Payments India-first", desc: "Razorpay Orders/Subscriptions/HMAC, GST invoices, no card storage, audited entitlements." },
          ].map((f) => (
            <div key={f.title} className="flex gap-4 p-5">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#3878F6]" />
              <div>
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="mt-1 text-sm leading-5 text-[#A0A8C0]">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#2A3250] py-8 text-center text-xs text-[#8890B0]">
        © 2026 AI Accelerator Hub · DPDP · SOC2-aligned · ap-south-1 ·{" "}
        <Link href="/privacy" className="underline">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
