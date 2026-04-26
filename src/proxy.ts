import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { AUTH_TOKEN_COOKIE } from "./features/auth/lib/auth.constants";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_ROUTES = [
  "/analytics",
  "/calendar",
  "/dashboard",
  "/medical-rep",
  "/medicine",
  "/patients",
  "/settings",
  "/staff",
];

function getPathWithoutLocale(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (routing.locales.includes(maybeLocale as (typeof routing.locales)[number])) {
    const path = `/${segments.slice(2).join("/")}`;
    return path === "/" ? "/" : path.replace(/\/$/, "");
  }

  return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
}

function isProtectedPath(pathname: string) {
  const pathWithoutLocale = getPathWithoutLocale(pathname);

  return PROTECTED_ROUTES.some(
    (route) => pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`),
  );
}

function getLocale(pathname: string) {
  const maybeLocale = pathname.split("/")[1];

  return routing.locales.includes(maybeLocale as (typeof routing.locales)[number])
    ? maybeLocale
    : routing.defaultLocale;
}

export default function proxy(request: NextRequest) {
  if (isProtectedPath(request.nextUrl.pathname)) {
    const hasAuthToken = Boolean(request.cookies.get(AUTH_TOKEN_COOKIE)?.value);

    if (!hasAuthToken) {
      const locale = getLocale(request.nextUrl.pathname);
      const signInUrl = new URL(`/${locale}/sign-in`, request.url);
      signInUrl.searchParams.set(
        "redirectTo",
        `${getPathWithoutLocale(request.nextUrl.pathname)}${request.nextUrl.search}`,
      );

      return NextResponse.redirect(signInUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
