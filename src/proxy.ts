import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl;
      // 受保护路由：刷题相关页面均需登录
      const protectedRoutes = [
        "/compass",
        "/study",
        "/workshop",
        "/wrongbook",
        "/logbook",
        "/analytics",
        "/account",
      ];
      const isProtected = protectedRoutes.some((p) => pathname.startsWith(p));
      if (isProtected) {
        return !!token;
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/compass/:path*",
    "/study/:path*",
    "/workshop/:path*",
    "/wrongbook/:path*",
    "/logbook/:path*",
    "/analytics/:path*",
    "/account/:path*",
    "/login",
    "/register",
  ],
};
