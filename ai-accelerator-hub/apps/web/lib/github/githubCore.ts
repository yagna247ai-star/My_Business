/**
 * Pure rules for showcase projects on GitHub (docs/SHOWCASE_GITHUB_SPEC.md). No network, no database.
 */
import { z } from 'zod';

/** Repo name from a title: lower-case ASCII, words joined by "-", at most 60 characters. */
export function repoName(title: string): string {
  const s = title.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/g, '');
  return s || 'project';
}

export function uniqueRepoName(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i++) { const n = `${base.slice(0, 56)}-${i}`; if (!taken.has(n)) return n; }
  return `${base.slice(0, 50)}-${Date.now().toString(36)}`;
}

export type RepoTarget = { kind: 'org'; owner: string } | { kind: 'own' } | { kind: 'none' };

/** Institution organisation first (when configured with a token), else the learner's own connected account. */
export function repoTarget(c: { org?: string | null; orgToken: boolean; learnerConnected: boolean }): RepoTarget {
  if (c.org && c.orgToken) return { kind: 'org', owner: c.org };
  if (c.learnerConnected) return { kind: 'own' };
  return { kind: 'none' };
}

/** GitHub usernames: 1–39 letters, digits or single hyphens; no leading or trailing hyphen. */
export function githubUsernameProblem(u: string): string | null {
  if (!u) return 'Enter your GitHub username.';
  if (u.length > 39) return 'GitHub usernames are at most 39 characters.';
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9]))*$/.test(u)) return 'Use only your username (letters, numbers and single hyphens), not a link.';
  return null;
}

/** Members see the author's email; learners under 18 never have theirs shown (docs/CHILD_SAFETY_POLICY.md). */
export const authorEmailFor = (a: { email: string; minor: boolean }) => (a.minor ? null : a.email);

const link = z.object({ url: z.string().trim().url('Paste a full link starting with https://').max(500), label: z.string().trim().max(60).default('') });
export const projectSchema = z.object({
  title: z.string().trim().min(4, 'Give the project a title of 4–90 characters.').max(90, 'Give the project a title of 4–90 characters.'),
  problem: z.string().trim().min(30, 'Describe the problem in at least 30 characters.').max(1000, 'Keep the problem under 1,000 characters.'),
  solution: z.string().trim().min(30, 'Describe your solution in at least 30 characters.').max(1000, 'Keep the solution under 1,000 characters.'),
  tech: z.array(z.string().trim().min(1).max(30)).max(12, 'List at most 12 tools.').default([]),
  links: z.array(link).max(6, 'Add at most 6 links.').default([]),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export type GuideStep = { id: string; title: string; why: string; steps: string[]; link?: { href: string; label: string } };

/** The GitHub guide for learners who have never used it (docs/SHOWCASE_GITHUB_SPEC.md §3.10). */
export const GUIDE_STEPS: GuideStep[] = [
  { id: 'account', title: 'Create your GitHub account', why: 'GitHub is where your project code and documents live, and where employers look at your work.',
    steps: ['Go to github.com/signup.', 'Enter your email (use one you will keep after your course), choose a password and a professional username such as asha-rao.', 'Solve the puzzle, then type the code GitHub emails you to verify your address.', 'Choose the Free plan.', 'Add your name and a photo in Settings → Public profile.'],
    link: { href: 'https://github.com/signup', label: 'Open GitHub sign-up' } },
  { id: 'twofa', title: 'Turn on two-factor authentication (2FA)', why: 'GitHub requires 2FA for people who contribute code. It stops anyone who learns your password from signing in.',
    steps: ['Install an authenticator app on your phone (Google Authenticator, Microsoft Authenticator or Authy).', 'On GitHub: your photo (top right) → Settings → Password and authentication → Enable two-factor authentication.', 'Scan the QR code with the app and type the 6-digit code it shows.', 'Download your recovery codes and keep them somewhere safe (not only on your phone).', 'Sign out and in again to check it works.'],
    link: { href: 'https://github.com/settings/security', label: 'Open Password and authentication' } },
  { id: 'token', title: 'Create a personal access token', why: 'Git on your computer uses a token instead of your password when it sends your work to GitHub.',
    steps: ['GitHub → your photo → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.', 'Name it "VS Code laptop", set Expiration to 90 days.', 'Repository access: Only select repositories → choose your project repo (or All repositories if you prefer).', 'Permissions → Repository permissions → Contents: Read and write.', 'Click Generate token and copy it now: GitHub shows it only once. Keep it in a password manager. Never paste it in chat, email or a file in your repo.'],
    link: { href: 'https://github.com/settings/personal-access-tokens/new', label: 'Create a fine-grained token' } },
  { id: 'install', title: 'Install Git and VS Code', why: 'Git copies your project to your computer and sends changes back; VS Code is where you edit files.',
    steps: ['Install Git from git-scm.com/downloads (Windows: keep the default options; macOS: run xcode-select --install in Terminal).', 'Install VS Code from code.visualstudio.com.', 'Open a terminal and tell Git who you are: git config --global user.name "Your Name"', 'Then: git config --global user.email "the email on your GitHub account"', 'Check with: git --version'],
    link: { href: 'https://code.visualstudio.com/download', label: 'Download VS Code' } },
  { id: 'vscode', title: 'Connect VS Code to GitHub', why: 'Once connected, VS Code can clone, commit and push without asking each time.',
    steps: ['In VS Code click the Accounts icon (bottom left) → Sign in with GitHub to use Copilot, Settings Sync and GitHub features → allow in the browser.', 'The first time you push, if Git asks for a username and password: type your GitHub username, and paste your personal access token as the password.', 'Windows and macOS remember it (Git Credential Manager / Keychain), so you only do this once until the token expires.', 'When the token expires, create a new one and paste it at the next prompt.'] },
  { id: 'clone', title: 'Check out (clone) your project', why: 'Cloning makes a copy of the project repo on your computer, already set up with the README and docs folders.',
    steps: ['On your project page here, copy the clone command or the repo link.', 'In VS Code: Source Control (left bar) → Clone Repository → paste the link → choose a folder → Open.', 'Or in a terminal: git clone https://github.com/OWNER/REPO.git then cd REPO and code .', 'If GitHub sent you an invitation email, accept it first (github.com/notifications), or the clone is refused.'] },
  { id: 'docs', title: 'Fill in the project documents', why: 'The docs folder tells reviewers and employers what you built and why. A good README is the first thing anyone reads.',
    steps: ['Open docs/01-problem.md and write who has the problem and how you will know it is solved.', 'Work through docs/02 … 06: design, data, how to run it, results, demo links. Delete the hints in italics as you go.', 'Put code in src/, notebooks in notebooks/, and small sample data in data/ (never personal data or passwords).', 'Source Control → write a short message such as "Add problem statement" → Commit → Sync Changes (push).', 'Refresh the repo on GitHub: your changes and the README now show there.'] },
  { id: 'organise', title: 'Organise all your GitHub projects', why: 'A tidy profile makes your work easy to find and trust.',
    steps: ['One repository per project, with a clear name (sales-dashboard, not test123).', 'Every repo has a README with the problem, how to run it, and a screenshot or demo link.', 'Keep the same layout everywhere: docs/ for writing, src/ for code, notebooks/, data/ for small samples.', 'Pin your best 4–6 repos: your profile → Customize your pins.', 'Create a profile README (a repo named exactly like your username) that introduces you and links your best projects.', 'Use .gitignore so secrets (.env), large data and system files never get committed.'] },
];
