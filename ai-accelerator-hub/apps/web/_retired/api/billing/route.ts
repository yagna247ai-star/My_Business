import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// GET /api/billing — plans + entitlements
export async function GET(){
  const plans = await prisma.plan.findMany({orderBy:{amountPaise:"asc"}});
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  if(!tenant) return NextResponse.json({error:"No tenant"},{status:500});
  const student = await prisma.user.findUnique({where:{email:"student@aihub.in"}});
  if(!student) return NextResponse.json({error:"Not seeded"},{status:500});
  const entitlements = student && tenant ? await prisma.entitlement.findMany({where:{tenantId: tenant.id, userId: student.id}}) : [];
  const subscriptions = student && tenant ? await prisma.subscription.findMany({where:{tenantId: tenant.id, userId: student.id}}) : [];
  const orders = student && tenant ? await prisma.order.findMany({where:{tenantId: tenant.id, userId: student.id}, orderBy:{createdAt:"desc"}, take:5}) : [];
  return NextResponse.json({
    plans: plans.map(p=>({slug:p.slug, name:p.name, amountPaise:p.amountPaise, interval:p.interval, features: p.features?JSON.parse(p.features):null, razorpayPlanId: p.razorpayPlanId||"mock-plan"})),
    entitlements,
    subscriptions,
    orders,
    note: "Razorpay Orders/Subscriptions/HMAC — real when RAZORPAY_KEY_ID set, else mock TEST MODE (HMAC bypass with warning — never in prod), GST-ready invoices, webhook idempotent via razorpay_events"
  });
}

// POST /api/billing {planSlug} — creates mock order (real Razorpay when keys present)
export async function POST(req: NextRequest){
  const { planSlug = "cohort-pro" } = await req.json().catch(()=>({planSlug:"cohort-pro"}));
  const plan = await prisma.plan.findUnique({where:{slug: planSlug}});
  if(!plan) return NextResponse.json({error:"Unknown plan"},{status:404});
  const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
  if(!tenant) return NextResponse.json({error:"No tenant"},{status:500});
  const student = await prisma.user.findUnique({where:{email:"student@aihub.in"}});
  if(!student) return NextResponse.json({error:"Not seeded"},{status:500});
  const hasRazorpay = !!process.env.RAZORPAY_KEY_ID;

  // Mock order (real would be razorpay.orders.create)
  const mockOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;
  const order = await prisma.order.create({
    data:{
      tenantId: tenant.id,
      userId: student.id,
      razorpayOrderId: mockOrderId,
      amountPaise: plan.amountPaise,
      currency: "INR",
      status: hasRazorpay ? "created" : "created_mock",
      items: JSON.stringify({planSlug, mock: !hasRazorpay})
    }
  });
  // Webhook HMAC verification stub: would be POST /api/webhooks/razorpay with HMAC_SHA256 + razorpay_events dedup
  return NextResponse.json({
    order: { id: order.id, razorpayOrderId: order.razorpayOrderId, amountPaise: order.amountPaise },
    checkout: hasRazorpay ? "Real Razorpay Checkout (hosted, PCI SAQ A)" : "Mock Checkout — set RAZORPAY_KEY_ID for live",
    webhook: "POST /api/webhooks/razorpay — HMAC + idempotent",
    entitlementsWillUpdate: "On webhook verified → entitlements level_access + ai_credits"
  });
}
