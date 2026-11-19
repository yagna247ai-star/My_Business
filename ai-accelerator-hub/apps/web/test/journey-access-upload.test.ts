import { describe, it, expect } from 'vitest';
import { pickDefaultJourney, parseSettings, FALLBACK_DEFAULT_SLUG } from '@/lib/domain/journeyAccess';
import { scanPlan, servable, storageDriver } from '@/lib/domain/uploadPolicy';

const j = (slug: string, isPublished: boolean, day: number) => ({ id: slug, slug, isPublished, createdAt: new Date(2026, 10, day) });

describe('default journey for new learners', () => {
  const ai = j('genai-career-accelerator', true, 17), da = j(FALLBACK_DEFAULT_SLUG, true, 18), draft = j('draft-journey', false, 1);
  it('uses the Super Admin choice when it is published', () => expect(pickDefaultJourney([ai, da], 'genai-career-accelerator')?.slug).toBe('genai-career-accelerator'));
  it('falls back to data analytics when nothing is chosen', () => expect(pickDefaultJourney([ai, da], null)?.slug).toBe(FALLBACK_DEFAULT_SLUG));
  it('ignores a chosen journey that is unpublished', () => expect(pickDefaultJourney([ai, da, draft], 'draft-journey')?.slug).toBe(FALLBACK_DEFAULT_SLUG));
  it('falls back to the oldest published journey', () => expect(pickDefaultJourney([j('b', true, 20), ai], 'missing')?.slug).toBe('genai-career-accelerator'));
  it('returns null when nothing is published', () => expect(pickDefaultJourney([draft], null)).toBeNull());
  it('parses tenant settings defensively', () => {
    expect(parseSettings('{"defaultJourneySlug":"x"}').defaultJourneySlug).toBe('x');
    expect(parseSettings('not json')).toEqual({});
    expect(parseSettings('[1]')).toEqual({});
    expect(parseSettings(null)).toEqual({});
  });
});

describe('upload scanning rules', () => {
  it('scans everything when a scanner exists', () => expect(scanPlan({ hasScanner: true, production: true, mime: 'application/pdf' })).toBe('scan'));
  it('accepts images in production without a scanner', () => {
    for (const mime of ['image/png', 'image/jpeg', 'image/webp', 'image/gif']) expect(scanPlan({ hasScanner: false, production: true, mime })).toBe('validated');
  });
  it('refuses PDF, video and anything else in production without a scanner', () => {
    for (const mime of ['application/pdf', 'video/mp4', 'video/webm', 'image/svg+xml']) expect(scanPlan({ hasScanner: false, production: true, mime })).toBe('refuse');
  });
  it('skips scanning in development', () => expect(scanPlan({ hasScanner: false, production: false, mime: 'application/pdf' })).toBe('skipped'));
});

describe('which stored files may be served', () => {
  it('serves validated images', () => expect(servable({ avStatus: 'validated', mime: 'image/png', production: true }).ok).toBe(true));
  it('never serves a validated non-image', () => expect(servable({ avStatus: 'validated', mime: 'application/pdf', production: true }).ok).toBe(false));
  it('never serves infected or pending files', () => {
    expect(servable({ avStatus: 'infected', mime: 'image/png', production: false }).ok).toBe(false);
    expect(servable({ avStatus: 'pending', mime: 'image/png', production: false }).ok).toBe(false);
  });
  it('refuses unscanned files only in production', () => {
    expect(servable({ avStatus: 'skipped', mime: 'image/png', production: true }).ok).toBe(false);
    expect(servable({ avStatus: 'skipped', mime: 'image/png', production: false }).ok).toBe(true);
  });
  it('serves clean files', () => expect(servable({ avStatus: 'clean', mime: 'application/pdf', production: true }).ok).toBe(true));
});

describe('storage driver', () => {
  it('uses Vercel Blob when a store is connected', () => {
    expect(storageDriver({ BLOB_STORE_ID: 'store_x' })).toBe('blob');
    expect(storageDriver({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_x' })).toBe('blob');
  });
  it('defaults to local disk', () => expect(storageDriver({})).toBe('local'));
  it('honours an explicit driver and flags unknown ones', () => {
    expect(storageDriver({ STORAGE_DRIVER: 'local', BLOB_STORE_ID: 'x' })).toBe('local');
    expect(storageDriver({ STORAGE_DRIVER: 's3' })).toBe('unsupported');
  });
});
