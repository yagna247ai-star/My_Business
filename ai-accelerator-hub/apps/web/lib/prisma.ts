import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// SQLite dev, Postgres prod via DATABASE_URL
// RLS is enforced via middleware for tenant isolation (app.current_tenant simulation)
// In Postgres prod, set app.current_tenant via SET LOCAL and enable RLS policies
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// SQLite (local/dev): WAL lets reads continue while one write is in progress, so bursts of sign-ups queue instead
// of timing out. journal_mode is stored in the database file, so this only needs to succeed once.
const g = globalThis as unknown as { __sqliteTuned?: boolean };
if (!g.__sqliteTuned && (process.env.DATABASE_URL || "").startsWith("file:")) {
  g.__sqliteTuned = true;
  prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL").catch((e: unknown) => console.warn("[prisma] could not enable WAL", e));
}

// Tenant context — AsyncLocalStorage-like via explicit passing
// Every tenant-scoped query MUST include tenantId filter
export function withTenant<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>) {
  if (!tenantId) throw new Error("withTenant: tenantId required (fail-closed)");
  // In Postgres prod, we would do: await prisma.$executeRaw`SET LOCAL app.current_tenant = ${tenantId}`
  return fn(prisma);
}

// Helper to enforce tenant isolation on raw queries
export function tenantWhere(tenantId: string) {
  if (!tenantId) throw new Error("tenantWhere: tenantId required");
  return { tenantId };
}
