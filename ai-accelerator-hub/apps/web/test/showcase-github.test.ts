import { describe, it, expect } from 'vitest';
import { repoName, uniqueRepoName, repoTarget, githubUsernameProblem, authorEmailFor, projectSchema, GUIDE_STEPS } from '@/lib/github/githubCore';
import { repoFiles } from '@/lib/github/repoTemplate';
import { encryptToken, decryptToken } from '@/lib/github/tokens';

// docs/SHOWCASE_GITHUB_SPEC.md
describe('repo names', () => {
  it('AC-1: slug of the title, at most 60 characters, a clash gets -2', () => {
    expect(repoName('My Sales Dashboard!!')).toBe('my-sales-dashboard');
    expect(repoName('  Café  — Insights 2026  ')).toBe('cafe-insights-2026');
    expect(repoName('x'.repeat(80))).toHaveLength(60);
    expect(repoName('!!!')).toBe('project');
    expect(uniqueRepoName('my-app', new Set(['my-app']))).toBe('my-app-2');
    expect(uniqueRepoName('my-app', new Set(['my-app', 'my-app-2']))).toBe('my-app-3');
    expect(uniqueRepoName('my-app', new Set())).toBe('my-app');
  });
});

describe('where the repo is created', () => {
  it('AC-2: institution org first, then the learner’s own account, else nothing', () => {
    expect(repoTarget({ org: 'nachiketha-labs', orgToken: true, learnerConnected: true })).toEqual({ kind: 'org', owner: 'nachiketha-labs' });
    expect(repoTarget({ org: 'nachiketha-labs', orgToken: false, learnerConnected: true })).toEqual({ kind: 'own' });
    expect(repoTarget({ org: '', orgToken: true, learnerConnected: false })).toEqual({ kind: 'none' });
    expect(repoTarget({ org: undefined, orgToken: false, learnerConnected: true })).toEqual({ kind: 'own' });
  });
});

describe('GitHub usernames', () => {
  it('AC-3: follows GitHub’s rules', () => {
    for (const ok of ['octocat', 'a', 'asha-rao', 'A1-b2-C3', 'x'.repeat(39)]) expect(githubUsernameProblem(ok), ok).toBeNull();
    for (const bad of ['', '-asha', 'asha-', 'as--ha', 'asha_rao', 'asha.rao', 'x'.repeat(40), 'https://github.com/asha']) expect(githubUsernameProblem(bad), bad).not.toBeNull();
  });
});

describe('README and docs structure', () => {
  const files = repoFiles({ title: 'Sales Dashboard', problem: 'Shop owners cannot see which products sell best each week and waste stock.', solution: 'A weekly dashboard built from the sales sheet with a short insight summary.', tech: ['Python', 'Power BI'], authorName: 'Asha Rao', authorEmail: 'asha@example.com', owner: 'nachiketha-labs', repo: 'sales-dashboard', links: [{ url: 'https://drive.google.com/file/d/1/view', label: 'Slides' }], institution: 'Demo Institute' });
  const byPath = new Map(files.map(f => [f.path, f.content]));
  it('AC-4: README has title, problem, author email and clone command; all docs files exist and none is empty', () => {
    const readme = byPath.get('README.md')!;
    expect(readme).toMatch(/^# Sales Dashboard/);
    expect(readme).toContain('Shop owners cannot see');
    expect(readme).toContain('asha@example.com');
    expect(readme).toContain('git clone https://github.com/nachiketha-labs/sales-dashboard.git');
    expect(readme).toContain('https://drive.google.com/file/d/1/view');
    for (const p of ['CONTRIBUTING.md', '.gitignore', 'docs/01-problem.md', 'docs/02-solution-design.md', 'docs/03-data.md', 'docs/04-setup-and-run.md', 'docs/05-results.md', 'docs/06-demo-and-links.md', 'src/README.md', 'data/README.md', 'notebooks/README.md'])
      expect(byPath.get(p)?.trim().length, p).toBeGreaterThan(20);
  });
  it('the README never includes the email for a minor (no email passed)', () => {
    const f = repoFiles({ title: 'T', problem: 'p'.repeat(40), solution: 's'.repeat(40), tech: [], authorName: 'Kid', authorEmail: null, owner: 'o', repo: 'r', links: [], institution: 'X' });
    expect(f.find(x => x.path === 'README.md')!.content).not.toMatch(/@/);
  });
});

describe('token safety', () => {
  const key = Buffer.alloc(32, 7).toString('base64');
  it('AC-5: encrypts and decrypts; tampering fails; the plain token never appears', () => {
    const enc = encryptToken('gho_secretTOKEN123', key);
    expect(enc).not.toContain('gho_secretTOKEN123');
    expect(decryptToken(enc, key)).toBe('gho_secretTOKEN123');
    const bad = enc.slice(0, -4) + (enc.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    expect(() => decryptToken(bad, key)).toThrow();
    expect(encryptToken('same', key)).not.toBe(encryptToken('same', key));
  });
});

describe('author email on the showcase', () => {
  it('AC-6: shown to members, hidden for under-18 authors', () => {
    expect(authorEmailFor({ email: 'a@x.com', minor: false })).toBe('a@x.com');
    expect(authorEmailFor({ email: 'kid@x.com', minor: true })).toBeNull();
  });
});

describe('project definition and guide', () => {
  it('validates the definition', () => {
    expect(projectSchema.safeParse({ title: 'Sales Dashboard', problem: 'p'.repeat(30), solution: 's'.repeat(30), tech: ['Python'], links: [] }).success).toBe(true);
    expect(projectSchema.safeParse({ title: 'ab', problem: 'short', solution: 's'.repeat(30) }).success).toBe(false);
    expect(projectSchema.safeParse({ title: 'Valid title', problem: 'p'.repeat(30), solution: 's'.repeat(30), tech: Array(13).fill('x') }).success).toBe(false);
  });
  it('the guide covers account, 2FA, token, VS Code, clone, docs, organising', () => {
    const ids = GUIDE_STEPS.map(s => s.id);
    expect(ids).toEqual(['account', 'twofa', 'token', 'install', 'vscode', 'clone', 'docs', 'organise']);
    for (const s of GUIDE_STEPS) expect(s.steps.length, s.id).toBeGreaterThanOrEqual(3);
  });
});
