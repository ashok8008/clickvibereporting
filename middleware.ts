import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;
    const role = token?.role;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      const url = role === "PUBLISHER" ? "/publisher" : "/login";
      return NextResponse.redirect(new URL(url, req.url));
    }

    if (pathname.startsWith("/publisher") && role !== "PUBLISHER") {
      const url = role === "ADMIN" ? "/admin" : "/login";
      return NextResponse.redirect(new URL(url, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/publisher/:path*"],
};
