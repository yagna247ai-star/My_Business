/**
 * Builds a fresh test database from the real migrations + seeds before the integration suite runs.
 *
 * The app runs on Postgres, so the suite needs a DISPOSABLE Postgres database in TEST_DATABASE_URL
 * (CI provides one as a service container; locally use Docker or any throwaway Postgres).
 * The database is WIPED. As a guard, only local / CI hosts are accepted unless ALLOW_REMOTE_TEST_DB=1,
 * so the production database can never be reset by running the tests.
 */
import { execSync } from 'child_process';
import path from 'path';

export const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'postgres', 'db'];

export function testDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.TEST_DATABASE_URL;
  if (!url) throw new Error('Set TEST_DATABASE_URL to a disposable Postgres database (it is wiped). Example: postgresql://postgres:postgres@localhost:5432/aihub_test');
  let host: string;
  try { host = new URL(url).hostname; } catch { throw new Error('TEST_DATABASE_URL is not a valid URL.'); }
  if (!/^postgres(ql)?:$/.test(new URL(url).protocol)) throw new Error('TEST_DATABASE_URL must be a postgresql:// URL.');
  if (!LOCAL_HOSTS.includes(host) && env.ALLOW_REMOTE_TEST_DB !== '1') {
    throw new Error(`Refusing to wipe a database on "${host}". Tests only run against a local or CI database (set ALLOW_REMOTE_TEST_DB=1 to override for a disposable remote one).`);
  }
  return url;
}

export default function setup() {
  const url = testDatabaseUrl();
  const env = { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url, NODE_ENV: 'test' as const };
  const cwd = path.resolve(__dirname, '../../../packages/db');
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', { cwd, env, stdio: 'pipe' });
  // NOTE: `npx tsx` opens an IPC pipe that sandboxed shells block (EPERM listen).
  // `node --import tsx/esm` runs the same seeds without the pipe. Behaviour is identical.
  execSync('node --import tsx/esm prisma/seed.ts', { cwd, env, stdio: 'pipe' });
  execSync('node --import tsx/esm prisma/seed-v3.ts', { cwd, env, stdio: 'pipe' });
  execSync('node --import tsx/esm prisma/seed-domain-journeys.ts', { cwd, env, stdio: 'pipe' }); // 17 domain journeys
}
