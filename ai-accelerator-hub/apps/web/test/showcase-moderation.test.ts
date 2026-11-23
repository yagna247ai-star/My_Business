import { describe, it, expect } from 'vitest';
import { linkPrivateProblem, shareHelp } from '@/lib/domain/proofRelevance';

const res = (status: number, body = '', location?: string) => new Response(body, { status, headers: location ? { location } : {} });
const fake = (...replies: Response[]) => { let i = 0; return (async () => replies[Math.min(i++, replies.length - 1)]) as unknown as typeof fetch; };

describe('proof links must open for everyone', () => {
  it('a private Google Drive file (redirects to sign-in) is refused with sharing instructions', async () => {
    const why = await linkPrivateProblem('https://drive.google.com/file/d/abc/view', fake(res(302, '', 'https://accounts.google.com/ServiceLogin?continue=x')));
    expect(why).toMatch(/Request access/);
    expect(why).toMatch(/Anyone with the link/);
  });
  it('a page that says “You need access” is refused', async () => {
    expect(await linkPrivateProblem('https://docs.google.com/document/d/x/edit', fake(res(200, '<h1>You need access</h1>')))).toMatch(/Only you can open/);
  });
  it('a private GitHub repository (404) is refused', async () => {
    expect(await linkPrivateProblem('https://github.com/asha/private-repo', fake(res(404)))).toMatch(/public repository|page not found/);
  });
  it('a public link passes, after following a redirect', async () => {
    expect(await linkPrivateProblem('https://youtu.be/abc123', fake(res(301, '', 'https://www.youtube.com/watch?v=abc123'), res(200, '<title>My walkthrough</title>')))).toBeNull();
  });
  it('never blocks on a network error or a server error, and never follows a link off the allowed sites', async () => {
    const boom = (async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    expect(await linkPrivateProblem('https://github.com/asha/x', boom)).toBeNull();
    expect(await linkPrivateProblem('https://github.com/asha/x', fake(res(503)))).toBeNull();
    let called = 0; const spy = (async () => { called++; return res(302, '', 'https://evil.example.com/'); }) as unknown as typeof fetch;
    expect(await linkPrivateProblem('https://github.com/asha/x', spy)).toBeNull();
    expect(called).toBe(1);
  });
  it('gives site-specific help', () => {
    expect(shareHelp('https://1drv.ms/x/abc')).toMatch(/OneDrive/);
    expect(shareHelp('https://app.powerbi.com/groups/me/reports/1')).toMatch(/PDF|walkthrough/);
  });
});
