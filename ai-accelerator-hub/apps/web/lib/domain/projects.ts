/**
 * Showcase projects on GitHub (docs/SHOWCASE_GITHUB_SPEC.md): define a project, link the learner's GitHub,
 * map an existing repo or create one (institution org first, else the learner's own account) with a README and
 * docs structure, invite institution admins as maintainers, and let members ask to contribute. Learner-first:
 * the learner is always admin of their repo.
 */
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { audit, notify } from '@/lib/server/audit';
import { badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { assertChildAllowed } from './childSafety';
import { canModerate } from './showcase';
import { normaliseShareUrl } from './linkHealthCore';
import { probeLink, proofLinkProblem } from './proofRelevance';
import { authorEmailFor, githubUsernameProblem, projectSchema, repoName, repoTarget, uniqueRepoName, type ProjectInput } from '@/lib/github/githubCore';
import { repoFiles } from '@/lib/github/repoTemplate';
import { decryptToken, encryptToken, tokenKeyConfigured } from '@/lib/github/tokens';
import * as gh from '@/lib/github/client';

type Link = { url: string; label: string; status: string; checkedAt: string };
const parse = <T>(j: string | null | undefined, d: T): T => { try { return j ? JSON.parse(j) as T : d; } catch { return d; } };

async function isMinor(tenantId: string, userId: string) {
  const s = await prisma.userSetting.findUnique({ where: { tenantId_userId: { tenantId, userId } }, select: { ageBand: true } });
  return s?.ageBand === 'minor';
}

/* ---------- define ---------- */

async function checkedLinks(links: ProjectInput['links']): Promise<Link[]> {
  const out: Link[] = [];
  for (const l of links) {
    const url = normaliseShareUrl(l.url);
    const why = proofLinkProblem(url);
    if (why) throw badRequest(`Link “${l.label || url}”: ${why}`, { links: why });
    const status = await probeLink(url);
    if (status === 'private') throw badRequest(`Link “${l.label || url}” asks other people for access. Share it as “Anyone with the link can view”, then paste it again.`, { links: 'Make this link viewable by anyone.' });
    out.push({ url, label: l.label || '', status, checkedAt: new Date().toISOString() });
  }
  return out;
}

export async function defineProject(ctx: Ctx, raw: unknown) {
  const input = projectSchema.parse(raw);
  await assertChildAllowed(ctx.tenantId, ctx.userId, 'showcase_publish');
  const links = await checkedLinks(input.links);
  const p = await prisma.$transaction(async tx => {
    const p = await tx.project.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, title: input.title, slug: `p-${crypto.randomUUID().slice(0, 12)}`, description: input.solution.slice(0, 600), problem: input.problem, solution: input.solution, tech: JSON.stringify(input.tech), links: JSON.stringify(links), stage: 'defined', isPublic: true } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'showcase.defined', resourceType: 'Project', resourceId: p.id, after: { title: input.title } });
    return p;
  });
  return { id: p.id };
}

export async function updateProject(ctx: Ctx, id: string, raw: unknown) {
  const p = await ownProject(ctx, id);
  const input = projectSchema.parse(raw);
  const links = await checkedLinks(input.links);
  await prisma.project.update({ where: { id: p.id }, data: { title: input.title, description: input.solution.slice(0, 600), problem: input.problem, solution: input.solution, tech: JSON.stringify(input.tech), links: JSON.stringify(links) } });
  return { ok: true as const };
}

async function ownProject(ctx: Ctx, id: string) {
  const p = await prisma.project.findFirst({ where: { id, tenantId: ctx.tenantId }, include: { repos: true, user: { select: { id: true, name: true, email: true, githubUsername: true } } } });
  if (!p) throw notFound('Project not found.');
  if (p.userId !== ctx.userId && !ctx.superAdmin) throw forbidden('Only the project’s author can do this.');
  return p;
}

/* ---------- read ---------- */

export async function projectDetail(ctx: Ctx, id: string) {
  const p = await prisma.project.findFirst({ where: { id, tenantId: ctx.tenantId }, include: { repos: true, contributors: { include: { user: { select: { name: true } } } }, user: { select: { id: true, name: true, email: true, githubUsername: true } } } });
  if (!p || (p.status === 'hidden' && p.userId !== ctx.userId && !canModerate(ctx))) throw notFound('Project not found.');
  const minor = await isMinor(ctx.tenantId, p.userId);
  const me = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { githubUsername: true, githubAccount: { select: { username: true } } } });
  const mine = p.userId === ctx.userId;
  const target = repoTarget({ org: process.env.GITHUB_ORG, orgToken: !!process.env.GITHUB_ORG_TOKEN, learnerConnected: !!me.githubAccount });
  return {
    id: p.id, title: p.title, problem: p.problem ?? p.description ?? '', solution: p.solution ?? '', tech: parse<string[]>(p.tech, []), links: parse<Link[]>(p.links, []),
    stage: p.stage, mine, canEdit: mine || ctx.superAdmin, hidden: p.status === 'hidden', at: p.createdAt.toISOString(),
    author: { name: (minor && !mine ? null : p.user.name) || 'Learner', email: authorEmailFor({ email: p.user.email, minor }), github: p.user.githubUsername },
    repos: p.repos.map(r => ({ id: r.id, url: r.repoUrl, fullName: r.fullName, provider: r.provider, createdByApp: r.createdByApp, linkStatus: r.linkStatus })),
    contributors: p.contributors.map(c => ({ name: c.user.name || c.githubUsername, github: c.githubUsername, permission: c.permission })),
    viewer: { github: me.githubUsername, connected: !!me.githubAccount, contributing: p.contributors.some(c => c.userId === ctx.userId) },
    createTarget: target.kind, orgName: target.kind === 'org' ? target.owner : null,
    connectAvailable: !!(process.env.GITHUB_CONNECT_CLIENT_ID && process.env.GITHUB_CONNECT_CLIENT_SECRET && tokenKeyConfigured()),
  };
}

/* ---------- GitHub identity ---------- */

export async function setGithubUsername(ctx: Ctx, username: string) {
  const u = username.trim().replace(/^@/, '');
  const why = githubUsernameProblem(u);
  if (why) throw badRequest(why, { username: why });
  let login: string;
  try { login = (await gh.getUser(u)).login; }
  catch (e) { if (e instanceof gh.GithubError && e.status === 404) throw badRequest(`There is no GitHub account called “${u}”. Check the spelling, or create one first (see the GitHub guide).`, { username: 'Not found on GitHub.' }); throw e; }
  const taken = await prisma.user.findFirst({ where: { githubUsername: login, id: { not: ctx.userId } }, select: { id: true } });
  if (taken) throw conflict('Another member already linked this GitHub account.');
  await prisma.user.update({ where: { id: ctx.userId }, data: { githubUsername: login } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'github.username_set', resourceType: 'User', resourceId: ctx.userId, after: { login } });
  return { username: login };
}

async function learnerToken(userId: string): Promise<string | null> {
  const a = await prisma.githubAccount.findUnique({ where: { userId } });
  if (!a) return null;
  try { return decryptToken(a.tokenEnc); } catch { return null; }
}

export async function myGithubRepos(ctx: Ctx) {
  const me = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { githubUsername: true } });
  const token = await learnerToken(ctx.userId);
  if (!me.githubUsername && !token) return { username: null, repos: [] };
  const repos = token ? await gh.listMyRepos(token) : await gh.listPublicRepos(me.githubUsername!);
  return { username: me.githubUsername, repos: repos.filter(r => !r.fork).map(r => ({ fullName: r.full_name, url: r.html_url, private: r.private, description: r.description, updatedAt: r.updated_at })) };
}

/* ---------- map an existing repo ---------- */

export async function attachRepo(ctx: Ctx, projectId: string, fullNameRaw: string) {
  const p = await ownProject(ctx, projectId);
  const fullName = fullNameRaw.trim().replace(/^https:\/\/github\.com\//i, '').replace(/\.git$|\/+$/g, '');
  if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(fullName)) throw badRequest('Use owner/repository, for example asha-rao/sales-dashboard.', { fullName: 'owner/repository' });
  const token = await learnerToken(p.userId);
  let repo: gh.GhRepo;
  try { repo = await gh.getRepo(token, fullName); }
  catch (e) { if (e instanceof gh.GithubError && e.status === 404) throw badRequest('That repository was not found. If it is private, make it public (Settings → Danger Zone → Change visibility) or connect GitHub.', { fullName: 'Not found.' }); throw e; }
  const owner = repo.owner.login.toLowerCase();
  const allowed = owner === (p.user.githubUsername ?? '').toLowerCase() || owner === (process.env.GITHUB_ORG ?? '').toLowerCase() || ctx.superAdmin;
  if (!allowed) throw forbidden('Map a repository you own (on your GitHub account) or one in the institution organisation.');
  if (repo.private) throw badRequest('This repository is private, so others cannot open it. Make it public to show it here.', { fullName: 'Private repository.' });
  if (p.repos.some(r => r.fullName?.toLowerCase() === repo.full_name.toLowerCase())) throw conflict('This repository is already on the project.');
  await prisma.$transaction(async tx => {
    await tx.projectRepo.create({ data: { projectId: p.id, repoUrl: repo.html_url, fullName: repo.full_name, provider: 'github', linkStatus: 'open', linkCheckedAt: new Date() } });
    if (p.stage === 'defined') await tx.project.update({ where: { id: p.id }, data: { stage: 'building' } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'github.repo_mapped', resourceType: 'Project', resourceId: p.id, after: { repo: repo.full_name } });
  });
  return { ok: true as const, url: repo.html_url };
}

/* ---------- create a repo with README + docs ---------- */

export async function createRepoForProject(ctx: Ctx, projectId: string) {
  const p = await ownProject(ctx, projectId);
  if (p.repos.some(r => r.createdByApp)) throw conflict('A repository was already created for this project.');
  const learner = await prisma.user.findUniqueOrThrow({ where: { id: p.userId }, select: { name: true, email: true, githubUsername: true, githubAccount: true } });
  const target = repoTarget({ org: process.env.GITHUB_ORG, orgToken: !!process.env.GITHUB_ORG_TOKEN, learnerConnected: !!learner.githubAccount });
  if (target.kind === 'none') throw conflict('To create a repository, connect your GitHub account, or ask your admin to set up the institution’s GitHub organisation. Meanwhile you can map a repo you created yourself: see the GitHub guide (/showcase/github-guide).');
  if (target.kind === 'org' && !learner.githubUsername) throw badRequest('Add your GitHub username first, so you can be made admin of the new repository.', { username: 'Add your GitHub username.' });

  const token = target.kind === 'org' ? process.env.GITHUB_ORG_TOKEN! : await learnerToken(p.userId);
  if (!token) throw conflict('Your GitHub connection has expired. Connect GitHub again.');
  const owner = target.kind === 'org' ? target.owner : (await gh.getViewer(token)).login;

  // A free name: the title's slug, then -2, -3 … (checked against GitHub, a few tries).
  const base = repoName(p.title); const taken = new Set<string>(); let name = base;
  for (let i = 0; i < 6 && await gh.repoExists(token, owner, name); i++) { taken.add(name); name = uniqueRepoName(base, taken); }

  const repo = target.kind === 'org' ? await gh.createOrgRepo(token, owner, name, p.title) : await gh.createUserRepo(token, name, p.title);
  const minor = await isMinor(ctx.tenantId, p.userId);
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: p.tenantId }, select: { name: true } });
  const files = repoFiles({ title: p.title, problem: p.problem ?? p.description ?? '', solution: p.solution ?? '', tech: parse<string[]>(p.tech, []), authorName: learner.name || 'Learner', authorEmail: minor ? null : learner.email, owner, repo: repo.name, links: parse<Link[]>(p.links, []), institution: tenant.name });
  for (const f of files) await gh.putFile(token, repo.full_name, f.path, f.content, f.path === 'README.md' ? 'Add README from AI Accelerator Hub' : `Add ${f.path}`);
  await gh.setTopics(token, repo.full_name, ['ai-accelerator-hub', ...parse<string[]>(p.tech, []).map(t => repoName(t)).filter(t => t !== 'project')]).catch(() => {});

  const invited: string[] = []; const failed: string[] = [];
  const invite = async (u: string, perm: 'admin' | 'maintain') => { try { await gh.addCollaborator(token, repo.full_name, u, perm); invited.push(`${u} (${perm})`); } catch (e) { failed.push(u); console.warn('[github] invite failed', u, (e as Error).message); } };
  if (target.kind === 'org' && learner.githubUsername) await invite(learner.githubUsername, 'admin'); // learner-first
  const admins = await prisma.membership.findMany({ where: { tenantId: p.tenantId, status: 'active', role: { code: 'tenant_admin' }, user: { githubUsername: { not: null } } }, select: { user: { select: { githubUsername: true } } } });
  for (const a of admins) if (a.user.githubUsername && a.user.githubUsername.toLowerCase() !== owner.toLowerCase() && a.user.githubUsername !== learner.githubUsername) await invite(a.user.githubUsername, 'maintain');

  await prisma.$transaction(async tx => {
    await tx.projectRepo.create({ data: { projectId: p.id, repoUrl: repo.html_url, fullName: repo.full_name, provider: 'github', createdByApp: true, linkStatus: 'open', linkCheckedAt: new Date() } });
    await tx.project.update({ where: { id: p.id }, data: { stage: p.stage === 'reviewed' ? 'reviewed' : 'building' } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'github.repo_created', resourceType: 'Project', resourceId: p.id, after: { repo: repo.full_name, where: target.kind, invited, failed } });
    await notify(tx, p.tenantId, p.userId, 'github_repo_created', { title: 'Your project repository is ready', body: target.kind === 'org' ? `${repo.full_name}: accept the GitHub invitation in your email, then clone it in VS Code.` : `${repo.full_name}: clone it in VS Code and start filling the docs.`, href: `/showcase/${p.id}`, tone: 'ok' });
  });
  return { url: repo.html_url, fullName: repo.full_name, where: target.kind, invited, failed };
}

/* ---------- contribute ---------- */

export async function requestContribute(ctx: Ctx, projectId: string) {
  const p = await prisma.project.findFirst({ where: { id: projectId, tenantId: ctx.tenantId, status: 'visible' }, include: { repos: true } });
  if (!p) throw notFound('Project not found.');
  if (p.userId === ctx.userId) throw badRequest('You own this project already.');
  const repo = p.repos.find(r => r.createdByApp && r.fullName) ?? p.repos.find(r => r.fullName);
  if (!repo?.fullName) throw badRequest('This project has no GitHub repository yet.');
  const me = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { githubUsername: true, name: true } });
  if (!me.githubUsername) throw badRequest('Add your GitHub username first (on this page).', { username: 'Add your GitHub username.' });
  if (await prisma.projectContributor.findUnique({ where: { projectId_userId: { projectId, userId: ctx.userId } } })) throw conflict('You already asked to contribute. Check your email for the GitHub invitation.');
  const inOrg = !!process.env.GITHUB_ORG && repo.fullName.toLowerCase().startsWith(`${process.env.GITHUB_ORG.toLowerCase()}/`);
  const token = inOrg ? process.env.GITHUB_ORG_TOKEN ?? null : await learnerToken(p.userId);
  if (!token) return { invited: false, fork: `${repo.repoUrl}/fork`, message: 'The owner has not connected GitHub, so you cannot be added automatically. Fork the repository and open a pull request.' };
  await gh.addCollaborator(token, repo.fullName, me.githubUsername, 'push');
  await prisma.$transaction(async tx => {
    await tx.projectContributor.create({ data: { projectId, userId: ctx.userId, githubUsername: me.githubUsername!, permission: 'push' } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'github.contributor_added', resourceType: 'Project', resourceId: projectId, after: { github: me.githubUsername } });
    await notify(tx, ctx.tenantId, p.userId, 'project_contributor', { title: `${me.name || me.githubUsername} is contributing to your project`, body: `“${p.title}”: they can push to ${repo.fullName}. Review their pull requests.`, href: `/showcase/${p.id}`, tone: 'info' });
  });
  return { invited: true, message: 'Invitation sent. Accept it in your GitHub email, then clone the repo.' };
}

/* ---------- connect / disconnect GitHub (OAuth) ---------- */

const secret = () => process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-only-insecure-secret-not-for-production-use';
const sign = (v: string) => crypto.createHmac('sha256', secret()).update(v).digest('base64url');

/** state = userId.expiry.hmac, so the callback only links the account to the person who started it. */
export function connectState(userId: string) { const v = `${userId}.${Date.now() + 10 * 60_000}`; return `${v}.${sign(v)}`; }
export function checkState(state: string, userId: string) {
  const [u, exp, mac] = state.split('.');
  if (!u || !exp || !mac || u !== userId || Number(exp) < Date.now()) return false;
  const expect = sign(`${u}.${exp}`);
  return mac.length === expect.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect));
}

export async function saveConnection(ctx: Ctx, token: string, scope: string) {
  const login = (await gh.getViewer(token)).login;
  const taken = await prisma.user.findFirst({ where: { githubUsername: login, id: { not: ctx.userId } }, select: { id: true } });
  if (taken) throw conflict('Another member already linked this GitHub account.');
  await prisma.$transaction(async tx => {
    await tx.githubAccount.upsert({ where: { userId: ctx.userId }, update: { username: login, tokenEnc: encryptToken(token), scope, connectedAt: new Date() }, create: { userId: ctx.userId, username: login, tokenEnc: encryptToken(token), scope } });
    await tx.user.update({ where: { id: ctx.userId }, data: { githubUsername: login } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'github.connected', resourceType: 'User', resourceId: ctx.userId, after: { login, scope } });
  });
  return { login };
}

export async function disconnectGithub(ctx: Ctx) {
  await prisma.githubAccount.deleteMany({ where: { userId: ctx.userId } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'github.disconnected', resourceType: 'User', resourceId: ctx.userId });
  return { ok: true as const };
}
