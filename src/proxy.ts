import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "./features/auth/lib/auth.constants";

const intlMiddleware = createMiddleware(routing);

// All paths that are publicly accessible without authentication (locale-stripped).
// Anything not matching these prefixes is treated as protected.
const PUBLIC_ROUTE_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/select-profile",
  "/staff/invite",
  "/staff/join-code",
  "/patient",
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

  if (pathWithoutLocale === "/") return false;

  return !PUBLIC_ROUTE_PREFIXES.some(
    (prefix) =>
      pathWithoutLocale === prefix || pathWithoutLocale.startsWith(prefix + "/"),
  );
}

function getLocale(pathname: string) {
  const maybeLocale = pathname.split("/")[1];

  return routing.locales.includes(maybeLocale as (typeof routing.locales)[number])
    ? maybeLocale
    : routing.defaultLocale;
}

function isExpiredJwt(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return false;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded)) as { exp?: number };

    return typeof decoded.exp === "number" && decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

export default function proxy(request: NextRequest) {
  if (isProtectedPath(request.nextUrl.pathname)) {
    const authToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
    const refreshToken = request.cookies.get(AUTH_REFRESH_TOKEN_COOKIE)?.value;
    const hasAuthToken = Boolean(authToken && !isExpiredJwt(authToken));
    const hasRefreshToken = Boolean(refreshToken);

    if (!hasAuthToken && !hasRefreshToken) {
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
