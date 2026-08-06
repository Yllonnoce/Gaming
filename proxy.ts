import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, createIdentity, readIdentity } from "@/lib/identity";

/**
 * Issues the identity cookie on a visitor's very first request.
 *
 * This has to happen here rather than in a layout, because Server Components
 * are not allowed to set cookies -- only proxies, Route Handlers, and Server
 * Actions are. Running at the edge means a first-time visitor has an identity
 * before any page renders, so no component ever has to handle "no user yet".
 */
export async function proxy(request: NextRequest) {
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  const userId = await readIdentity(existing);

  // A present-but-invalid cookie (tampered, or signed with a retired secret) is
  // replaced rather than rejected -- there are no credentials to protect, and
  // an error page would be a dead end for the visitor.
  if (userId) return NextResponse.next();

  const { cookie } = await createIdentity();
  const response = NextResponse.next();
  response.cookies.set({
    name: cookie.name,
    value: cookie.value,
    maxAge: cookie.maxAge,
    httpOnly: true, // never readable from client JS
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}

export const config = {
  // Skip static assets: they don't need an identity and shouldn't pay the cost.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
