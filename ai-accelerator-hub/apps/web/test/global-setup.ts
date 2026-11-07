/** Builds a fresh test database from the real migrations + seed before the integration suite runs. */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default function setup() {
  const db = path.resolve(__dirname, '../../../packages/db/prisma/test.db');
  for (const f of [db, `${db}-journal`]) if (fs.existsSync(f)) fs.rmSync(f);
  const env = { ...process.env, DATABASE_URL: `file:${db}`, NODE_ENV: 'test' as const };
  const cwd = path.resolve(__dirname, '../../../packages/db');
  execSync('npx prisma migrate deploy', { cwd, env, stdio: 'pipe' });
  // NOTE: `npx tsx` opens an IPC pipe that sandboxed shells block (EPERM listen).
  // `node --import tsx/esm` runs the same seeds without the pipe. Behaviour is identical.
  execSync('node --import tsx/esm prisma/seed.ts', { cwd, env, stdio: 'pipe' });
  execSync('node --import tsx/esm prisma/seed-v3.ts', { cwd, env, stdio: 'pipe' });
}
