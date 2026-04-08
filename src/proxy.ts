import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/security/jwt";

export function proxy(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/superadmin-lk")) {
    return NextResponse.next();
  }

  const access = req.cookies.get("homenova_access_token")?.value;
  const refresh = req.cookies.get("homenova_refresh_token")?.value;
  if (!access && !refresh) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const payload = verifyToken(access ?? refresh ?? "");
    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  } catch {
    try {
      const payload = verifyToken(refresh ?? "");
      if (payload.role !== "admin") return NextResponse.redirect(new URL("/", req.url));
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
}

export const config = {
  matcher: ["/superadmin-lk/:path*"],
};
