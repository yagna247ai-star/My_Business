/**
 * Outgoing email over SMTP (Gmail App Password or any SMTP server). docs/FORGOT_PASSWORD_SPEC.md.
 * - SMTP_HOST, SMTP_PORT (465 = TLS, 587 = STARTTLS), SMTP_USER, SMTP_PASS, MAIL_FROM.
 * - Tests: mail goes to the in-memory `_outbox`, never to a server.
 * - Not configured outside production: the message is written to the server log so the flow can be tried locally.
 * - Not configured in production: the send fails with an error the caller logs (the user still sees the generic reply).
 */
import nodemailer, { type Transporter } from 'nodemailer';

export type Mail = { to: string; subject: string; text: string; html?: string };
export const _outbox: Mail[] = [];

let transport: Transporter | null = null;
function smtp(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!transport) {
    const port = Number(SMTP_PORT || 465);
    transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  }
  return transport;
}

export function appUrl(): string {
  const u = process.env.APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
  if (!u && process.env.NODE_ENV === 'production') throw new Error('APP_URL must be set in production to build email links.');
  return u || 'http://localhost:3000';
}

export async function sendMail(m: Mail): Promise<void> {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) { _outbox.push(m); return; }
  const t = smtp();
  if (!t) {
    if (process.env.NODE_ENV === 'production') throw new Error('SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS).');
    console.info(`[mail:dev] to=${m.to} subject="${m.subject}"\n${m.text}`);
    return;
  }
  await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: m.to, subject: m.subject, text: m.text, html: m.html });
}
