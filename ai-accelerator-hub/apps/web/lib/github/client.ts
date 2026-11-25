/**
 * Minimal GitHub REST client (docs/SHOWCASE_GITHUB_SPEC.md). api.github.com only; tokens never logged.
 * Docs: https://docs.github.com/en/rest (repos, contents, collaborators, users).
 */
const API = 'https://api.github.com';

export class GithubError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function gh<T>(token: string | null, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': 'ai-accelerator-hub',
      ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const json = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const msg = (json && (json.message as string)) || `GitHub returned ${res.status}`;
    const detail = json?.errors?.[0]?.message ? `: ${json.errors[0].message}` : '';
    throw new GithubError(res.status, `${msg}${detail}`);
  }
  return json as T;
}

export type GhRepo = { full_name: string; name: string; html_url: string; private: boolean; description: string | null; updated_at: string; owner: { login: string }; fork: boolean };

/** A server token raises the anonymous limit (60/hour per IP) for public lookups. */
const lookupToken = () => process.env.GITHUB_ORG_TOKEN || null;

export const getUser = (username: string) => gh<{ login: string; html_url: string; public_repos: number }>(lookupToken(), 'GET', `/users/${encodeURIComponent(username)}`);
export const listPublicRepos = (username: string) => gh<GhRepo[]>(lookupToken(), 'GET', `/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100&type=owner`);
export const listMyRepos = (token: string) => gh<GhRepo[]>(token, 'GET', '/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator');
export const getViewer = (token: string) => gh<{ login: string }>(token, 'GET', '/user');
export const getRepo = (token: string | null, fullName: string) => gh<GhRepo>(token ?? lookupToken(), 'GET', `/repos/${fullName}`);

export async function repoExists(token: string | null, owner: string, name: string) {
  try { await gh(token ?? lookupToken(), 'GET', `/repos/${owner}/${name}`); return true; }
  catch (e) { if (e instanceof GithubError && e.status === 404) return false; throw e; }
}

const repoBody = (name: string, description: string) => ({ name, description: description.slice(0, 350), private: false, has_issues: true, has_wiki: false, auto_init: false });
export const createOrgRepo = (token: string, org: string, name: string, description: string) => gh<GhRepo>(token, 'POST', `/orgs/${encodeURIComponent(org)}/repos`, repoBody(name, description));
export const createUserRepo = (token: string, name: string, description: string) => gh<GhRepo>(token, 'POST', '/user/repos', repoBody(name, description));

export const putFile = (token: string, fullName: string, path: string, content: string, message: string) =>
  gh(token, 'PUT', `/repos/${fullName}/contents/${path.split('/').map(encodeURIComponent).join('/')}`, { message, content: Buffer.from(content, 'utf8').toString('base64') });

export const addCollaborator = (token: string, fullName: string, username: string, permission: 'pull' | 'push' | 'maintain' | 'admin') =>
  gh(token, 'PUT', `/repos/${fullName}/collaborators/${encodeURIComponent(username)}`, { permission });

export const setTopics = (token: string, fullName: string, names: string[]) =>
  gh(token, 'PUT', `/repos/${fullName}/topics`, { names: [...new Set(names)].slice(0, 20) });

/** OAuth: code → token (docs.github.com/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps). */
export async function exchangeCode(code: string, redirectUri: string) {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: process.env.GITHUB_CONNECT_CLIENT_ID, client_secret: process.env.GITHUB_CONNECT_CLIENT_SECRET, code, redirect_uri: redirectUri }),
    signal: AbortSignal.timeout(15_000),
  });
  const j = await res.json() as { access_token?: string; scope?: string; error_description?: string };
  if (!j.access_token) throw new GithubError(400, j.error_description || 'GitHub did not return a token.');
  return { token: j.access_token, scope: j.scope ?? '' };
}
