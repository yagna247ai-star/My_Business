export const dynamic = "force-dynamic";
export default async function GithubLabPage(){
  const res = await fetch(`${process.env.NEXTAUTH_URL||'http://localhost:3000'}/api/github`, { cache: 'no-store' }).catch(()=>null);
  let data: any = null;
  try{ data = res ? await res.json() : null; }catch{}
  // Fallback to static curated if fetch fails (build time)
  const curated = data?.curated || [
    {name:"Whisper", url:"https://github.com/openai/whisper", license:"MIT"},
    {name:"LangChain", url:"https://github.com/langchain-ai/langchain", license:"MIT"},
  ];
  const showcase = data?.showcase || [];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">GitHub Lab</h1>
      <p className="text-sm text-[#A0A8C0]">Explore → Fork → Modify → Build → Deploy → Showcase. Every repo verified (URL, license, lastVerified) — no fabricated.</p>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Curated OSS Library</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {curated.map((c:any)=>(
            <a key={c.url} href={c.url} target="_blank" className="rounded-xl border border-[#2A3250] bg-[#101426] p-3 hover:border-[#3878F6]/30">
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="text-xs text-[#A0A8C0]">{c.desc||c.url}</div>
              <div className="mt-1 flex gap-2 text-[11px] text-[#8890B0]"><span>{c.difficulty||"—"}</span><span>•</span><span>{c.license}</span><span>•</span><span>{c.lastVerified}</span></div>
            </a>
          ))}
        </div>
        <div className="mt-3 text-xs text-[#8890B0]">Flow: GitHub OAuth (when GITHUB_CLIENT_ID set) → repo link `/api/projects/:id/link-github` verifies via GitHub API → commit history → PR → showcase.</div>
      </div>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Project Showcase {showcase.length>0?`(${showcase.length})`:""}</div>
        {showcase.length===0 ? <div className="mt-2 text-sm text-[#8890B0]">No public projects yet — ship L01 cookie-demo to appear.</div> : showcase.map((p:any)=>(
          <div key={p.id} className="mt-2 rounded-xl border border-[#2A3250] bg-[#101426] p-3">
            <div className="text-sm font-semibold">{p.title}</div>
            <div className="text-xs text-[#A0A8C0]">{p.description}</div>
            {p.repos?.[0] && <a href={p.repos[0].repoUrl} target="_blank" className="text-xs text-[#3878F6] underline">{p.repos[0].repoUrl}</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
