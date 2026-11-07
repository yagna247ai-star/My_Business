import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Adds a request id for log correlation. That's all it does.
 * - Sign-in and permissions are checked in each page/route via lib/server/context.ts (getCtx), never here.
 * - The institution comes from the signed-in membership in the database, never from a client header.
 * - Security headers are set in next.config (CSP, X-Frame-Options, nosniff, Referrer-Policy, HSTS in prod).
 * - Rate limits live in lib/server/http.ts (route()).
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const incoming = req.headers.get("x-request-id");
  res.headers.set("x-request-id", incoming && /^[A-Za-z0-9-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID());
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
