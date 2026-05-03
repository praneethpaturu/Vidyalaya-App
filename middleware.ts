import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Paths that bypass the cookie auth gate. The /api/v1/* surface uses its own
// API-key auth (lib/api-key.ts); /api/payments/razorpay/webhook is signed by
// HMAC; /api/calendar/[token] (future) uses a token query param.
const PUBLIC = [
  "/login",
  "/signup",                          // self-serve school + first-admin signup
  "/forgot-password",
  "/reset-password",
  "/invite",                          // /invite/[token] — accept invitation
  "/verify-email",                    // future use
  "/api/signup",                      // POST handler for signup
  "/api/auth",
  "/api/auth/forgot",
  "/api/auth/reset",
  "/api/invites",                     // POST is admin-gated in handler;
                                       // /api/invites/[token]/accept is public
  "/api/v1",                          // public REST — API-key auth in handler
  "/api/payments/razorpay/webhook",   // HMAC-signed by Razorpay
  "/api/digest",                      // shared-secret in header
  "/api/outbox/flush",                // shared-secret OR Vercel cron token
  "/api/transport/ping",              // driver-phone GPS, bus.driverToken auth
  "/driver",                           // /driver/track/[busId] — bus.driverToken auth
  "/enquire",                          // /enquire/[schoolCode] — public enquiry form
  "/api/enquire",                      // public POST handler
  "/_next", "/favicon", "/assets",
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const session = await auth();
  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
