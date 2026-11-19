# Production database

How to reach, inspect and safely change the production database.

| | |
|---|---|
| Engine | PostgreSQL (Neon), connected to Vercel through the Marketplace integration |
| Endpoint | `ep-odd-hill-bc0fm5kz` in `us-east-1` |
| Database | `neondb` |
| App connection | `DATABASE_URL` (pooled, host ends in `-pooler`) |
| Admin / migration connection | `DATABASE_URL_UNPOOLED` (direct) |
| Schema changes | Applied automatically by `prisma migrate deploy` in every Vercel build |

Credentials live only in Vercel and Neon. Don't paste them into docs, tickets or chat.

## Ways to connect

### 1. Neon SQL editor (recommended for quick checks)

Vercel dashboard → project → **Storage** → the Neon database → **Open in Neon** → **SQL Editor** → database `neondb`. Nothing to install, and it works even when your local DNS can't resolve Neon.

```sql
SELECT slug, name, status FROM tenants;
SELECT email, "globalRole", "createdAt" FROM users WHERE "globalRole" = 'super_admin';
SELECT action, "resourceType", "createdAt" FROM audit_logs ORDER BY "createdAt" DESC LIMIT 20;
```

Column names are camelCase in Postgres, so quote them (`"globalRole"`). Table names are snake_case (see [DATA_MODEL.md](./DATA_MODEL.md)).

### 2. Terminal: `psql` or Prisma Studio

1. Get the URLs, outside the project folder (they must not be committed):
   ```bash
   cd apps/web && vercel env pull ~/aihub-prod.env --environment=production --yes
   ```
   or copy them from Neon → **Connect**.
2. Connect:
   ```bash
   # psql (install once: brew install libpq && brew link --force libpq)
   psql "$(grep '^DATABASE_URL_UNPOOLED=' ~/aihub-prod.env | cut -d= -f2- | tr -d '"')"

   # Prisma Studio, a table browser at http://localhost:5555
   cd packages/db && set -a && . ~/aihub-prod.env && set +a && npx prisma studio
   ```
3. When finished: `rm ~/aihub-prod.env`

### 3. Desktop client (TablePlus, DBeaver, pgAdmin)

Use the host, user and password from Neon → **Connect**, database `neondb`, SSL mode **require**.

## If it says "Can't reach database server"

Some networks' DNS can't resolve `*.neon.tech`. Check:

```bash
dig +short ep-odd-hill-bc0fm5kz-pooler.c-16.us-east-1.aws.neon.tech          # your DNS
dig +short @8.8.8.8 ep-odd-hill-bc0fm5kz-pooler.c-16.us-east-1.aws.neon.tech # Google DNS
```

If only the second returns addresses, set your Mac's DNS to `8.8.8.8` and `1.1.1.1` (System Settings → Network → your connection → Details → DNS) and retry. Or use the Neon SQL editor.

## Common tasks

| Task | How |
|---|---|
| Create or upgrade an admin account | `packages/db/prisma/provision-staff.ts` — see [06-seed-and-admin-accounts.md](./enterprise-gaps/06-seed-and-admin-accounts.md) |
| Change a member's role | In the app: Admin → People. Audited as `member.role_changed`. |
| Apply a schema change | Commit a migration; the next deploy applies it. See [DEPLOYMENT.md](./DEPLOYMENT.md). |
| Check migration status | `cd packages/db && npx prisma migrate status` with the production env loaded |
| Test something risky | Neon → **Branches → Create branch** from production, point a local `.env` at the branch, test there, delete the branch |
| Restore after a mistake | Neon → **Restore** (point-in-time, within the plan's history window), ideally into a new branch first |

## Rules

- **Read freely, write carefully.** Change data through the app or a reviewed script that writes an audit log entry, not by editing rows by hand.
- **Never run against production:** `prisma db push`, `prisma migrate reset`, `prisma migrate dev`, or `packages/db/prisma/seed.ts`. The first three can drop data. The seed creates demo accounts with passwords published in the repo.
- **Use the unpooled URL** for `psql`, migrations and GUIs. The pooled URL is for the app.
- **Keep pulled env files out of the repo.** Delete them when done.
- Row-level security is **not** enabled yet ([04-tenancy-rls.md](./enterprise-gaps/04-tenancy-rls.md)). A query without a `"tenantId"` filter returns every institution's data.
