# Forgot Password — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-25 |
| Trigger | "People forget their password and we have no forgot-password module. When they click Forgot password they give their email and we send a reset link to it." |
| Decisions | Email is sent over **SMTP (Gmail or any SMTP server)** with nodemailer. |
| Builds on | `apps/web/lib/auth.ts` (credentials login, lockout), `apps/web/lib/domain/settingsRules.ts` (`passwordProblem`), `apps/web/lib/server/http.ts` (`route`, `rateLimit`), `docs/ENVIRONMENT_VARIABLES.md` |
| Code | `apps/web/lib/domain/passwordResetCore.ts` (new, pure) · `apps/web/lib/domain/passwordReset.ts` (new, DB) · `apps/web/lib/server/mail.ts` (new) · `apps/web/app/api/v1/auth/forgot-password/route.ts` (new) · `apps/web/app/api/v1/auth/reset-password/route.ts` (new) · `apps/web/app/(auth)/forgot-password/page.tsx` (new) · `apps/web/app/(auth)/reset-password/page.tsx` (new) · `apps/web/app/(auth)/login/page.tsx` (link) · `apps/web/lib/auth.ts` (clear lockout) · `packages/db/prisma/schema.prisma` · `packages/db/prisma/migrations/0012_password_reset/migration.sql` (new) |
| Tests | `apps/web/test/password-reset.test.ts` (new, pure) · `apps/web/test/password-reset-flow.test.ts` (new, DB) |

---

## 1. Problem
Anyone who forgets their password is locked out for good. The only fix today is for an admin to step in by hand. There is no self-service reset, and the app cannot send email.

## 2. Solution

```
Login → "Forgot password?" → /forgot-password (email) → POST /api/v1/auth/forgot-password
      → always "If an account exists, we have emailed a link"  → email with /reset-password?token=…
      → /reset-password (new password ×2) → POST /api/v1/auth/reset-password → /login?reset=1
```

- The token is 32 random bytes in base64url. Only its SHA-256 hash is stored. It works once and expires after 30 minutes.
- Email goes out through `lib/server/mail.ts` (nodemailer over SMTP). If SMTP is not set up outside production, the link is written to the server log so developers can test the flow.

## 3. Behaviour
1. **No account enumeration.** `forgot-password` returns the same 200 body for a known email, an unknown email, and a suspended account. The text is: "If an account exists for that email, we have sent a reset link. It expires in 30 minutes."
2. A reset email is sent only for a user who exists and has at least one active membership. Each new request marks that user's earlier unused tokens as used, so only the newest link works.
3. Rate limits: 5 requests per 15 minutes per IP address, and 3 reset emails per hour per email address. Requests over the email limit still return the generic 200 but send nothing.
4. `reset-password` takes `{ token, password }`. The password must pass `passwordProblem` (at least 10 characters, with a letter and a number). An unknown, expired or already-used token returns 400 with "This reset link is invalid or has expired. Request a new one."
5. A successful reset updates `passwordHash` (bcrypt), marks the token and the user's other unused tokens as used, sets `emailVerified = true` (they proved they own the inbox), clears the login lockout for that email, and sends a "Your password was changed" email.
6. Every request and every reset is written to the audit log (`auth.password_reset_requested`, `auth.password_reset_completed`). The audit log stores the email, never the token.
7. If sending the email fails, the error is logged on the server. The API still returns the generic 200.
8. The reset link uses `APP_URL` (falling back to `AUTH_URL`, then `NEXTAUTH_URL`), never the request's Host header, so an attacker cannot point the link at another site.
9. Accounts that signed in with GitHub and have no password can use the same flow to set one.

## 4. Data and API
```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@map("password_reset_tokens")
}
```
Migration `0012_password_reset` (proposed).

| Route | Body | Response |
|---|---|---|
| `POST /api/v1/auth/forgot-password` | `{ email }` | 200 `{ ok: true, message }` always (400 only for a malformed email) |
| `POST /api/v1/auth/reset-password` | `{ token, password }` | 200 `{ ok: true }` · 400 invalid token or weak password |

New environment variables: `SMTP_HOST`, `SMTP_PORT` (default 465), `SMTP_USER`, `SMTP_PASS` (for Gmail, a 16-character App Password), `MAIL_FROM` (for example `AI Accelerator Hub <no-reply@…>`).

## 5. UI
- **Login:** a "Forgot password?" link under the password field, which carries the typed email through.
- **/forgot-password:** an email field and a "Send reset link" button. States: busy, the generic success message, an invalid-email error, and "Too many requests".
- **/reset-password:** two password fields and a "Set new password" button. States: mismatch, weak password (the server message), invalid or expired link (with a link to request a new one), and success (redirect to `/login?reset=1`, which shows "Password changed. Sign in with your new password.").

## 6. Acceptance criteria
- [x] AC-1: Given a new token, then the raw token is 43 base64url characters, its hash is SHA-256 hex, and the raw token is never stored.
- [x] AC-2: Given a token 31 minutes old, or one already used, then it is not valid; at 29 minutes and unused, it is valid.
- [ ] AC-3: Given an unknown email, when forgot-password is called, then the response is identical to the one for a known email and no email is sent.
- [ ] AC-4: Given a known email, when forgot-password is called, then exactly one email is sent, its link starts with `APP_URL/reset-password?token=`, and only the hash is stored.
- [ ] AC-5: Given a valid token and a strong password, when reset-password is called, then the user can sign in with the new password and not with the old one, and reusing the same token returns 400.
- [ ] AC-6: Given a weak password, then 400 with the `passwordProblem` message, and the token is still unused.
- [ ] AC-7: Given four requests within an hour for one email, then only three emails are sent.
- [x] AC-8: The login page links to `/forgot-password`.

## 7. Out of scope
- Signing out sessions that are already open. Sessions are JWTs that expire after 7 days. Revoking them needs a session version field and is a separate change.
- Email verification at sign-up, and magic-link sign-in.
- HTML email templates beyond a simple branded message.

## 8. Open questions
1. Which mailbox sends from production? Default: a dedicated Gmail or Google Workspace account with an App Password. The send limit is about 500 a day on Gmail and 2,000 on Workspace.
2. Rate limits are in memory, so they apply per server instance (see `http.ts`). Default: acceptable for now, since the per-email cap is also enforced in the database by counting the tokens created in the last hour.
