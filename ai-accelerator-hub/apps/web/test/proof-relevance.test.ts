import { describe, it, expect } from 'vitest';
import { proofLinkProblem } from '@/lib/domain/proofRelevance';

describe('irrelevant proof links are rejected straight away', () => {
  it('accepts links to the learner’s own work', () => {
    for (const u of [
      'https://github.com/asha/sunita-sales', 'https://github.com/asha/sunita-sales/blob/main/q1.sql',
      'https://drive.google.com/file/d/1AbC/view', 'https://docs.google.com/spreadsheets/d/1xyz/edit',
      'https://onedrive.live.com/?id=ABC', 'https://contoso.sharepoint.com/:x:/g/personal/asha/EAbc',
      'https://community.cloud.databricks.com/?o=123#notebook/456', 'https://adb-1.2.azuredatabricks.net/editor/notebooks/9',
      'https://app.powerbi.com/view?r=eyJrIjo', 'https://colab.research.google.com/drive/1abc', 'https://www.kaggle.com/code/asha/eda',
      'https://www.loom.com/share/abc123', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ',
      'https://asha.notion.site/Capstone-1a2b', 'https://sunita-dash.streamlit.app/',
    ]) expect(proofLinkProblem(u), u).toBeNull();
  });
  it('rejects social media, search, short links and other people’s pages', () => {
    for (const u of ['https://www.instagram.com/p/abc', 'https://x.com/asha/status/1', 'https://www.google.com/search?q=sql', 'https://bit.ly/3abc', 'https://chatgpt.com/share/abc', 'https://en.wikipedia.org/wiki/SQL', 'https://www.linkedin.com/in/asha'])
      expect(proofLinkProblem(u), u).toMatch(/not your work/);
  });
  it('rejects unknown sites, home pages, GitHub profiles and YouTube channels', () => {
    expect(proofLinkProblem('https://example.com/my-work')).toMatch(/where your work is saved/);
    expect(proofLinkProblem('https://drive.google.com/')).toMatch(/home page/);
    expect(proofLinkProblem('https://github.com/asha')).toMatch(/repository/);
    expect(proofLinkProblem('https://www.youtube.com/@asha')).toMatch(/video itself/);
    expect(proofLinkProblem('not a link')).toMatch(/full link/);
  });
});
