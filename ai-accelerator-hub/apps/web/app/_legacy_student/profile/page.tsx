import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function ProfilePage(){
  const student = await prisma.user.findUnique({where:{email:"student@aihub.in"}});
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  if(!tenant) return <div className="p-6 text-sm">Seed required</div>;
  if(!student || !tenant) return <div className="p-6 text-sm">Seed required</div>;
  const membership = await prisma.membership.findFirst({where:{tenantId: tenant.id, userId: student.id}, include:{role:true}});
  const entitlements = await prisma.entitlement.findMany({where:{tenantId: tenant.id, userId: student.id}});
  const prefs = await prisma.notificationPreference.findMany({where:{userId: student.id}});
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Profile & Settings</h1>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-full bg-[#3878F6] flex items-center justify-center font-bold">{student.name?.[0]}</div><div><div className="font-bold">{student.name}</div><div className="text-xs text-[#A0A8C0]">{student.email} · {membership?.role.code || "learner"} · tenant {tenant.slug}</div><div className="text-xs text-[#8890B0]">Lang: {student.preferredLanguage} (switch without progress loss — EN/HI/TE/TA/KN/ML)</div></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 text-xs">
          <div className="rounded-xl bg-[#101426] p-3"><div className="font-semibold">Entitlements</div>{entitlements.map(e=> <div key={e.id} className="mt-1 flex justify-between"><span>{e.feature}</span><span className="font-bold">{e.remaining}</span></div>)}{entitlements.length===0 && <span className="text-[#8890B0]">None</span>}</div>
          <div className="rounded-xl bg-[#101426] p-3"><div className="font-semibold">Privacy</div><div className="mt-1 leading-4 text-[#8890B0]">Profile private by default, granular settings, DSR export/delete, audit logs, no sensitive-data ads. DPDP ap-south-1. See PENDING_LEGAL.md.</div></div>
        </div>
      </div>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Notifications</div>
        <div className="mt-2 text-xs text-[#A0A8C0]">Preferences: {prefs.length} channels · In-app, email (SES), push (FCM), SMS (MSG91 India) via Novu — digest, quiet hours IST.</div>
        <div className="mt-2 flex gap-2 text-xs"><span className="rounded-full border border-[#2A3250] bg-[#101426] px-2 py-1">In-app: ON</span><span className="rounded-full border border-[#2A3250] bg-[#101426] px-2 py-1">Email: ON</span><span className="rounded-full border border-[#2A3250] bg-[#101426] px-2 py-1">Push: OFF</span></div>
      </div>
      <div className="rounded-2xl border border-[#2A3250] bg-[#1E2438] p-4">
        <div className="text-sm font-bold">Billing</div>
        <div className="text-xs text-[#A0A8C0]">Plans: free (20 AI credits, L1), cohort-pro ₹4999/mo (200 credits, 15 levels), annual ₹49990. Razorpay Orders/Subscriptions/HMAC, GST invoices, no card storage (hosted). <a href="/api/billing" className="text-[#3878F6] underline">View /api/billing</a></div>
        <div className="mt-2 text-xs text-[#8890B0]">Referral: code <code className="rounded bg-[#101426] px-1">REF-{student.id.slice(0,6)}</code> → +30 XP, deduped, no self-referral.</div>
      </div>
    </div>
  );
}
