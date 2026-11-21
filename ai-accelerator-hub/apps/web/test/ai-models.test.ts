import { describe, it, expect } from 'vitest';
import { pickGeminiModel } from '../lib/ai/providers/langchain';

describe('Gemini model choice', () => {
  it('takes the newest stable Flash model that can generate text, ignoring previews, lite and other kinds', () => {
    const m = (name: string, gen = true) => ({ name: `models/${name}`, supportedGenerationMethods: gen ? ['generateContent'] : ['embedContent'] });
    expect(pickGeminiModel([m('gemini-2.0-flash'), m('gemini-3.0-flash'), m('gemini-3.5-flash-preview'), m('gemini-3.0-flash-lite'), m('gemini-3.5-pro'), m('text-embedding-004', false)])).toBe('gemini-3.0-flash');
    expect(pickGeminiModel([m('gemini-3-flash'), m('gemini-2.5-flash')])).toBe('gemini-3-flash');
    expect(pickGeminiModel([m('gemini-3.5-pro')])).toBeNull();
  });
});
