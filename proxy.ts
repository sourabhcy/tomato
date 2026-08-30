import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getRequiredPermission, hasPermission } from "@/lib/rbac";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function proxy(request: NextRequest) {
  const requiredPermission = getRequiredPermission(request.nextUrl.pathname);

  if (!requiredPermission) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    if (!hasPermission(payload.role as string, requiredPermission)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Next.js requires a static matcher, so this must broadly cover every entry in
  // lib/rbac.ts's PROTECTED_ROUTES; getRequiredPermission() does the precise matching.
  matcher: ["/admin/:path*"],
};
