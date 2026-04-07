import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/security/jwt";

export function proxy(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/superadmin-lk")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("homenova_access_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const payload = verifyToken(token);
    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/superadmin-lk/:path*"],
};
