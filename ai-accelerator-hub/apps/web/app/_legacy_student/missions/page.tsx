import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function MissionsPage(){
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  if(!tenant) return <div className="p-6 text-sm">Seed required</div>;
  const quests = await prisma.quest.findMany({orderBy:{xpReward:"desc"}});
  const today = new Date().toLocaleDateString("en-CA", {timeZone:"Asia/Kolkata"});
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Learning Missions</h1>
      <p className="text-sm text-[#A0A8C0]">Weekly missions · daily streak (non-punitive) · mystery rewards · boss battles. Mon-Fri prep, Sat workshop, Sun 4h hackathon.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {quests.map(q=>(
          <div key={q.id} className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
            <div className="flex items-center justify-between"><span className="text-sm font-bold">{q.title}</span><span className="rounded-full bg-[#E8B94F] px-2 py-1 text-xs font-bold text-[#101426]">+{q.xpReward} XP</span></div>
            <div className="text-xs text-[#A0A8C0]">{q.code}</div>
            <div className="mt-2 text-xs text-[#8890B0]">Condition: {q.condition || "—"}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#2A3250] bg-[#101426] p-3 text-xs leading-4 text-[#8890B0]">
        <strong className="text-white">Daily streak:</strong> {today} · freeze tokens, 48h grace, 7-day recovery quest — never shame (see Streak model).<br/>
        <strong className="text-white">Weekly:</strong> New level release Sat, 4h hackathon Sun, submission window following week. Attendance ≠ pass.
      </div>
    </div>
  );
}
