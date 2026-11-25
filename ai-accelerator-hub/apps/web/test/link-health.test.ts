import { describe, it, expect } from 'vitest';
import { normaliseShareUrl, classifyResponse, personalDriveView } from '@/lib/domain/linkHealthCore';
import { proofLinkProblem } from '@/lib/domain/proofRelevance';

// docs/SHOWCASE_LINK_HEALTH_SPEC.md
describe('normaliseShareUrl', () => {
  it('AC-1: removes the account index and authuser, keeps resourcekey', () => {
    expect(normaliseShareUrl('https://drive.google.com/drive/u/1/folders/ABC?usp=sharing')).toBe('https://drive.google.com/drive/folders/ABC?usp=sharing');
    expect(normaliseShareUrl('https://docs.google.com/document/d/X/edit?authuser=2')).toBe('https://docs.google.com/document/d/X/edit');
    expect(normaliseShareUrl('https://docs.google.com/spreadsheets/u/0/d/Y/edit?resourcekey=0-abc&authuser=1#gid=0')).toBe('https://docs.google.com/spreadsheets/d/Y/edit?resourcekey=0-abc#gid=0');
    expect(normaliseShareUrl('https://github.com/a/b')).toBe('https://github.com/a/b');
    expect(normaliseShareUrl('not a url')).toBe('not a url');
  });
});

describe('personal Drive views', () => {
  it('AC-2: my-drive, recent, home, shared-with-me and search are refused', () => {
    for (const p of ['my-drive', 'recent', 'home', 'shared-with-me', 'starred', 'search?q=report', 'u/1/my-drive'])
      expect(personalDriveView(`https://drive.google.com/drive/${p}`), p).toBe(true);
    expect(personalDriveView('https://drive.google.com/drive/folders/ABC')).toBe(false);
    expect(proofLinkProblem('https://drive.google.com/drive/my-drive')).toMatch(/Share/);
    expect(proofLinkProblem('https://drive.google.com/drive/folders/1AbCdEf')).toBeNull();
  });
});

describe('classifyResponse', () => {
  it('AC-3: unknown is not open; private and broken are told apart', () => {
    expect(classifyResponse(200, null, '<html>My notebook</html>')).toBe('open');
    expect(classifyResponse(200, null, 'You need access. Request access')).toBe('private');
    expect(classifyResponse(302, 'https://accounts.google.com/ServiceLogin?continue=x', '')).toBe('private');
    expect(classifyResponse(403, null, '')).toBe('private');
    expect(classifyResponse(404, null, '')).toBe('broken');
    expect(classifyResponse(410, null, '')).toBe('broken');
    expect(classifyResponse(429, null, '')).toBe('unknown');
    expect(classifyResponse(503, null, '')).toBe('unknown');
    expect(classifyResponse(200, null, 'Our systems have detected unusual traffic from your computer network')).toBe('unknown');
    expect(classifyResponse(200, null, '<form action="https://consent.google.com/save">')).toBe('unknown');
  });
});
