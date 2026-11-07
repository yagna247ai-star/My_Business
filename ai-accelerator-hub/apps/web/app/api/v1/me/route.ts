import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { learnerSummary } from '@/lib/domain/insights';
import { ROLE_LABEL } from '@/lib/server/rbac';
export const GET = route(async () => { const ctx = await requireCtx(); return { user: { id: ctx.userId, name: ctx.name, email: ctx.email, role: ctx.role, roleLabel: ROLE_LABEL[ctx.role], tenant: ctx.tenantName }, summary: ctx.role === 'learner' ? await learnerSummary(ctx) : null }; });
