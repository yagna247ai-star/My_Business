/**
 * The files the app commits to a new showcase repo (docs/SHOWCASE_GITHUB_SPEC.md §2). Pure: returns {path, content}[].
 */
export type TemplateInput = {
  title: string; problem: string; solution: string; tech: string[];
  authorName: string; authorEmail: string | null; owner: string; repo: string;
  links: { url: string; label?: string }[]; institution: string;
};

const md = (s: string) => s.replace(/\r/g, '').trim();

export function repoFiles(p: TemplateInput): { path: string; content: string }[] {
  const clone = `git clone https://github.com/${p.owner}/${p.repo}.git`;
  const tech = p.tech.length ? p.tech.map(t => `- ${t}`).join('\n') : '- _Add the tools and languages you use._';
  const links = p.links.length ? p.links.map(l => `- [${l.label || l.url}](${l.url})`).join('\n') : '- _Add your demo video, slides or Drive folder here._';
  const author = p.authorEmail ? `${p.authorName} (${p.authorEmail})` : p.authorName;
  const readme = `# ${p.title}

> A project from the AI Accelerator Hub showcase · ${p.institution}

## The problem
${md(p.problem)}

## Our solution
${md(p.solution)}

## Built with
${tech}

## Get started
\`\`\`bash
${clone}
cd ${p.repo}
\`\`\`
Then follow [docs/04-setup-and-run.md](docs/04-setup-and-run.md).

## Project structure
\`\`\`
docs/        problem, design, data, setup, results, demo links
src/         source code
notebooks/   Jupyter / Colab notebooks
data/        small sample data only (no personal data)
\`\`\`

## Documents
1. [Problem](docs/01-problem.md)
2. [Solution design](docs/02-solution-design.md)
3. [Data](docs/03-data.md)
4. [Setup and run](docs/04-setup-and-run.md)
5. [Results](docs/05-results.md)
6. [Demo and links](docs/06-demo-and-links.md)

## Links
${links}

## Author
${author}

Contributions are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md).
`;
  const doc = (title: string, hints: string[]) => `# ${title}\n\n${hints.map(h => `_${h}_\n`).join('\n')}\n`;
  return [
    { path: 'README.md', content: readme },
    { path: 'CONTRIBUTING.md', content: `# Contributing to ${p.title}\n\nThanks for helping! ${p.authorName} owns this project and reviews every change.\n\n1. Ask for access on the project's showcase page (Contribute), or fork the repo.\n2. Create a branch: \`git checkout -b short-description\`.\n3. Make small, focused commits with clear messages.\n4. Open a pull request that says what you changed and why.\n5. Never commit passwords, API keys, tokens or personal data.\n` },
    { path: '.gitignore', content: `# Secrets\n.env\n.env.*\n*.pem\n\n# Python\n__pycache__/\n*.pyc\n.venv/\nvenv/\n.ipynb_checkpoints/\n\n# Node\nnode_modules/\ndist/\n\n# OS / editors\n.DS_Store\nThumbs.db\n.vscode/*\n!.vscode/extensions.json\n\n# Large or private data\ndata/raw/\n*.zip\n` },
    { path: 'docs/01-problem.md', content: `# 1. The problem\n\n${md(p.problem)}\n\n## Who has this problem?\n_Describe the people affected and how often it happens._\n\n## How will we know it is solved?\n_One or two measurable signs of success._\n` },
    { path: 'docs/02-solution-design.md', content: `# 2. Solution design\n\n${md(p.solution)}\n\n${doc('Approach', ['Explain the steps your solution takes, from input to output.', 'Add a simple diagram (a photo of a sketch is fine) as docs/diagram.png.', 'List the key decisions you made and why.']).replace(/^# /, '## ')}` },
    { path: 'docs/03-data.md', content: doc('3. Data', ['Where does the data come from? Add the link and its licence.', 'What did you clean or change, and why?', 'What can this data NOT tell you (its limits)?', 'Privacy: confirm no personal data is stored in this repo.']) },
    { path: 'docs/04-setup-and-run.md', content: `# 4. Setup and run\n\n## Get the code\n\`\`\`bash\n${clone}\ncd ${p.repo}\n\`\`\`\n\n_List the prerequisites (Python version, packages, accounts)._\n\n_Write the exact commands to install, run and test the project._\n` },
    { path: 'docs/05-results.md', content: doc('5. Results', ['What worked? Add numbers where you can (accuracy, time saved, rows processed).', 'Add screenshots of the output.', 'What would you improve next?']) },
    { path: 'docs/06-demo-and-links.md', content: `# 6. Demo and links\n\n${links}\n\n_Add a 2–3 minute demo video (Loom or YouTube “Unlisted”), your slides, and any Drive folders. Set each to “Anyone with the link can view”._\n` },
    { path: 'src/README.md', content: '# src\n\nPut your source code here (Python modules, scripts, app code). Keep secrets in a .env file, which .gitignore keeps out of Git.\n' },
    { path: 'data/README.md', content: '# data\n\nOnly small sample files belong here (under a few MB). Link large datasets in docs/03-data.md instead. Never add personal data.\n' },
    { path: 'notebooks/README.md', content: '# notebooks\n\nJupyter or Colab notebooks. Name them in order, e.g. 01-explore.ipynb, 02-clean.ipynb, 03-model.ipynb, and clear secret values before committing.\n' },
  ];
}
