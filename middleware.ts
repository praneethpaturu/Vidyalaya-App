import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Paths that bypass the cookie auth gate. The /api/v1/* surface uses its own
// API-key auth (lib/api-key.ts); /api/payments/razorpay/webhook is signed by
// HMAC; /api/calendar/[token] (future) uses a token query param.
const PUBLIC = [
  "/login",
  "/api/auth",
  "/api/v1",                          // public REST — API-key auth in handler
  "/api/payments/razorpay/webhook",   // HMAC-signed by Razorpay
  "/api/digest",                      // shared-secret in header
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
