import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { listPlans } from '@/lib/payments/razorpay';
export const GET = route(async () => listPlans(await requireCtx()));
