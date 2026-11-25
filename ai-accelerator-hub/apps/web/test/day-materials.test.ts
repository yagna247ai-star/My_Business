import { describe, it, expect } from 'vitest';
import { detectKind, copyUrl, materialSchema, MAX_PER_DAY, materialProblem } from '@/lib/domain/dayMaterialsCore';

// docs/DAY_MATERIALS_SPEC.md
describe('kinds and copies', () => {
  it('AC-1: detects the kind and offers a practise copy for Google files', () => {
    expect(detectKind('https://docs.google.com/presentation/d/AbC/edit')).toBe('slides');
    expect(detectKind('https://docs.google.com/document/d/AbC/view')).toBe('doc');
    expect(detectKind('https://docs.google.com/spreadsheets/d/AbC/edit#gid=0')).toBe('sheet');
    expect(detectKind('https://drive.google.com/drive/folders/XyZ')).toBe('folder');
    expect(detectKind('https://colab.research.google.com/drive/1abc')).toBe('notebook');
    expect(detectKind('https://www.youtube.com/watch?v=abc123xyz')).toBe('video');
    expect(detectKind('https://www.loom.com/share/abc')).toBe('video');
    expect(detectKind('https://drive.google.com/file/d/1/view')).toBe('other');
    expect(copyUrl('https://docs.google.com/spreadsheets/d/AbC_1-x/edit?usp=sharing')).toBe('https://docs.google.com/spreadsheets/d/AbC_1-x/copy');
    expect(copyUrl('https://docs.google.com/document/d/Q/view')).toBe('https://docs.google.com/document/d/Q/copy');
    expect(copyUrl('https://drive.google.com/drive/folders/XyZ')).toBeNull();
  });
});

describe('validation', () => {
  it('AC-2: refuses non-https, personal Drive views, short titles and too many items', () => {
    expect(materialSchema.safeParse({ title: 'SQL slides', url: 'https://docs.google.com/presentation/d/A/edit' }).success).toBe(true);
    expect(materialSchema.safeParse({ title: 'ab', url: 'https://docs.google.com/presentation/d/A/edit' }).success).toBe(false);
    expect(materialProblem('http://example.com/x', 0)).toMatch(/https/);
    expect(materialProblem('https://drive.google.com/drive/my-drive', 0)).toMatch(/Share/);
    expect(materialProblem('https://docs.google.com/document/d/A/edit', MAX_PER_DAY)).toMatch(/12/);
    expect(materialProblem('https://docs.google.com/document/d/A/edit', 3)).toBeNull();
  });
});
