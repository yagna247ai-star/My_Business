export default function FeedbackPage(){
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Feedback</h1>
      <p className="text-sm text-[#A0A8C0]">Help us improve — every level has a feedback activity, plus app-wide.</p>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <form className="space-y-3">
          <select className="w-full rounded-lg border border-[#2A3250] bg-[#101426] px-3 py-2 text-sm"><option>Level 1 — AI Awakening</option><option>Level 2 — Prompt Craft</option><option>App overall</option></select>
          <div className="flex gap-1 text-xl">{"★★★★★".split("").map((s,i)=> <button key={i} type="button" className="text-[#E8B94F]">{s}</button>)}</div>
          <textarea placeholder="What worked? What was confusing? (be specific — we read every one)" rows={4} className="w-full rounded-lg border border-[#2A3250] bg-[#101426] px-3 py-2 text-sm" />
          <button type="submit" className="rounded-full bg-[#3878F6] px-4 py-2 text-sm font-semibold text-white">Submit feedback</button>
        </form>
        <div className="mt-3 text-xs text-[#8890B0]">Stored in `feedback` + audit log. Moderated, no auto-publish. Used for `level.content` improvements.</div>
      </div>
    </div>
  );
}
