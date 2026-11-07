/**
 * Mentor help requests from Agent Lab steps (docs/AGENT_LAB_GET_UNSTUCK_SPEC.md §5, rules H1–H8).
 * Supervised support: requests go to the institution's staff queue (review:read), never to a peer.
 * All text is redacted before storage; secrets are rejected; minors cannot share contact details.
 */
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { badRequest, conflict, forbidden, notFound, tooMany } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';
import { redact } from '@/lib/ai/coach';
import { hasSecret } from './agentLab';
import { childStatus } from './childSafety';
import { AGENTS, buildGuide, type OS } from './setupGuide';
import { diagnose } from './troubleshoot';
import type { AgentCode } from './personalise';

export const MAX_OPEN = 3;
const CONTACT = /[\w.+-]+@[\w-]+\.[\w.]+|(?:\+?\d[\s-]?){10,}/;
const STAFF = ['mentor', 'instructor', 'reviewer'];

export const createSchema = z.object({ runId: z.string().max(40), stepId: z.string().max(20), text: z.string().trim().min(10, 'Paste the error or describe what happened (at least 10 characters).').max(4000) });
export const messageSchema = z.object({ body: z.string().trim().min(2).max(2000) });

async function cleanText(ctx: Ctx, raw: string, field: string) {
  if (hasSecret(raw)) throw badRequest('That looks like a secret key. Delete it, then revoke the key with the provider and create a new one.', { [field]: 'Remove the secret key.' });
  if ((await childStatus(ctx.tenantId, ctx.userId)).minor && CONTACT.test(raw)) throw badRequest('For your safety, do not share emails or phone numbers.', { [field]: 'Remove contact details.' });
  return redact(raw).text;
}

const view = (r: Awaited<ReturnType<typeof prisma.helpRequest.findFirst>> & {}, msgs: { id: string; authorRole: string; body: string; createdAt: Date; authorId: string }[], names: Map<string, string>) => ({
  id: r.id, runId: r.runId, agent: r.agent, os: r.os, method: r.method, stepId: r.stepId, stepTitle: r.stepTitle, errorText: r.errorText,
  matchedIds: JSON.parse(r.matchedIds || '[]') as string[], state: r.state, createdAt: r.createdAt, resolvedAt: r.resolvedAt,
  messages: msgs.map(m => ({ id: m.id, role: m.authorRole, body: m.body, at: m.createdAt, author: m.authorRole === 'staff' ? names.get(m.authorId) || 'Mentor' : 'You' })),
});
async function namesOf(ids: string[]) { const us = await prisma.user.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, name: true } }); return new Map(us.map(u => [u.id, u.name || 'Mentor'])); }

/** H1–H3: create a request for a step of the learner's own Agent Lab run. */
export async function createHelpRequest(ctx: Ctx, raw: unknown) {
  if (!hasPerm(ctx, 'learn:self')) throw forbidden('Only learners can ask for help here.');
  const d = createSchema.parse(raw);
  const run = await prisma.agentLabRun.findFirst({ where: { id: d.runId, tenantId: ctx.tenantId, userId: ctx.userId } });
  if (!run) throw notFound('Lab run not found.');
  const method = (JSON.parse(run.steps || '{}').install?.data?.method as string | undefined) || null;
  const steps = AGENTS[run.agent as AgentCode].install[run.os as OS].map(m => m.id)
    .flatMap(m => buildGuide(run.agent as AgentCode, run.os as OS, m)).filter((s, i, a) => a.findIndex(x => x.id === s.id) === i);
  const step = steps.find(s => s.id === d.stepId);
  if (!step) throw badRequest('Choose a step from your guide.', { stepId: 'Unknown step.' });
  const text = await cleanText(ctx, d.text, 'text');
  const open = await prisma.helpRequest.count({ where: { tenantId: ctx.tenantId, learnerId: ctx.userId, state: { not: 'resolved' } } });
  if (open >= MAX_OPEN) throw tooMany(`You already have ${MAX_OPEN} open help requests. Mark one resolved, or add to it instead.`);
  const matched = diagnose(text, { kind: step.kind, os: run.os as OS, agent: run.agent as AgentCode, method: method || undefined }).map(e => e.id);
  const r = await prisma.$transaction(async tx => {
    const r = await tx.helpRequest.create({ data: { tenantId: ctx.tenantId, learnerId: ctx.userId, runId: run.id, agent: run.agent, os: run.os, method, stepId: step.id, stepTitle: step.title, errorText: text, matchedIds: JSON.stringify(matched) } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'help.requested', resourceType: 'HelpRequest', resourceId: r.id, after: { agent: run.agent, os: run.os, step: step.id, matched } });
    const staff = await tx.membership.findMany({ where: { tenantId: ctx.tenantId, status: 'active', role: { code: { in: STAFF } } } });
    for (const m of staff) await notify(tx, ctx.tenantId, m.userId, 'help_requested', { title: `Help needed: ${step.title}`, body: `${ctx.name} · ${run.agent.replace('_', ' ')} on ${run.os}`, href: '/review/help', tone: 'gold' });
    return r;
  });
  return view(r, [], new Map());
}

/** H4: learners see only their own requests (optionally for one run). */
export async function myHelpRequests(ctx: Ctx, runId?: string) {
  const rs = await prisma.helpRequest.findMany({ where: { tenantId: ctx.tenantId, learnerId: ctx.userId, ...(runId ? { runId } : {}) }, orderBy: { createdAt: 'desc' }, take: 30, include: { messages: { orderBy: { createdAt: 'asc' } } } });
  const names = await namesOf(rs.flatMap(r => r.messages.map(m => m.authorId)));
  return rs.map(r => view(r, r.messages, names));
}

/** H4: staff queue, same institution, oldest first; open and answered before resolved. */
export async function helpQueue(ctx: Ctx, state: 'active' | 'resolved' = 'active') {
  if (!hasPerm(ctx, 'review:read')) throw forbidden();
  const rs = await prisma.helpRequest.findMany({ where: { tenantId: ctx.tenantId, state: state === 'active' ? { in: ['open', 'answered'] } : 'resolved' }, orderBy: { createdAt: state === 'active' ? 'asc' : 'desc' }, take: 100, include: { messages: { orderBy: { createdAt: 'asc' } } } });
  const names = await namesOf([...rs.map(r => r.learnerId), ...rs.flatMap(r => r.messages.map(m => m.authorId))]);
  return rs.map(r => ({ ...view(r, r.messages, names), learner: names.get(r.learnerId) || 'Learner' }));
}

export async function openHelpCount(ctx: Ctx) {
  if (!hasPerm(ctx, 'review:read')) return 0;
  return prisma.helpRequest.count({ where: { tenantId: ctx.tenantId, state: 'open' } });
}

async function requestFor(ctx: Ctx, id: string) {
  const r = await prisma.helpRequest.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!r) throw notFound('Help request not found.');
  const mine = r.learnerId === ctx.userId;
  if (!mine && !hasPerm(ctx, 'review:read')) throw notFound('Help request not found.');
  return { r, mine };
}

/** H5–H6: reply. Staff reply → answered (learner notified); learner reply → open (staff who replied notified). */
export async function replyHelp(ctx: Ctx, id: string, raw: unknown) {
  const { r, mine } = await requestFor(ctx, id);
  if (!mine && !hasPerm(ctx, 'review:decide')) throw forbidden('Only mentors, reviewers and instructors can reply.');
  if (r.state === 'resolved') throw conflict('This request is resolved. Open a new one if you are stuck again.');
  const body = await cleanText(ctx, messageSchema.parse(raw).body, 'body');
  const role = mine ? 'learner' : 'staff';
  await prisma.$transaction(async tx => {
    await tx.helpMessage.create({ data: { requestId: r.id, authorId: ctx.userId, authorRole: role, body } });
    await tx.helpRequest.update({ where: { id: r.id }, data: { state: role === 'staff' ? 'answered' : 'open' } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'help.replied', resourceType: 'HelpRequest', resourceId: r.id, after: { role } });
    if (role === 'staff') await notify(tx, ctx.tenantId, r.learnerId, 'help_answered', { title: `A mentor replied: ${r.stepTitle}`, body: body.slice(0, 140), href: '/agent-lab', tone: 'ok' });
    else {
      const staff = await tx.helpMessage.findMany({ where: { requestId: r.id, authorRole: 'staff' }, select: { authorId: true }, distinct: ['authorId'] });
      for (const s of staff) await notify(tx, ctx.tenantId, s.authorId, 'help_learner_replied', { title: `Learner replied: ${r.stepTitle}`, body: body.slice(0, 140), href: '/review/help', tone: 'info' });
    }
  });
  return { ok: true as const };
}

/** H6: the learner or staff marks the request resolved. */
export async function resolveHelp(ctx: Ctx, id: string) {
  const { r, mine } = await requestFor(ctx, id);
  if (!mine && !hasPerm(ctx, 'review:decide')) throw forbidden();
  if (r.state === 'resolved') return { ok: true as const };
  await prisma.$transaction(async tx => {
    await tx.helpRequest.update({ where: { id: r.id }, data: { state: 'resolved', resolvedAt: new Date() } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'help.resolved', resourceType: 'HelpRequest', resourceId: r.id, after: { by: mine ? 'learner' : 'staff' } });
    if (!mine) await notify(tx, ctx.tenantId, r.learnerId, 'help_resolved', { title: `Help request closed: ${r.stepTitle}`, href: '/agent-lab', tone: 'info' });
  });
  return { ok: true as const };
}
