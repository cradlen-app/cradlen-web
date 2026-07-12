import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { isPublicRoute } from "./common/constants/public-routes";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_SELECTION_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "./common/constants/auth-cookies";
import { isExpiredJwt } from "./infrastructure/auth-transport/jwt";

const intlMiddleware = createMiddleware(routing);

// Next's generated OG card is served at an extension-less path, so it does not
// hit the `matcher`'s dotted-path exclusion. It is not a *page*, so it lives here
// rather than in the shared public-route list.
const PUBLIC_ASSET_PREFIXES = ["/opengraph-image"];

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

  if (isPublicRoute(pathWithoutLocale)) return false;

  return !PUBLIC_ASSET_PREFIXES.some(
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

// Routes a logged-in-but-not-yet-profiled user (selection token only) can reach.
// The page itself handles the missing auth context gracefully.
const SELECTION_TOKEN_ALLOWED_PATHS = ["/create-organization", "/select-profile"];

export default function proxy(request: NextRequest) {
  if (isProtectedPath(request.nextUrl.pathname)) {
    const authToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
    const refreshToken = request.cookies.get(AUTH_REFRESH_TOKEN_COOKIE)?.value;
    const selectionToken = request.cookies.get(AUTH_SELECTION_TOKEN_COOKIE)?.value;
    const hasAuthToken = Boolean(authToken && !isExpiredJwt(authToken));
    const hasRefreshToken = Boolean(refreshToken);
    const pathWithoutLocale = getPathWithoutLocale(request.nextUrl.pathname);
    const hasSelectionAccess =
      Boolean(selectionToken) &&
      SELECTION_TOKEN_ALLOWED_PATHS.some(
        (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/"),
      );

    if (!hasAuthToken && !hasRefreshToken && !hasSelectionAccess) {
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

// `.*\..*` excludes any path containing a dot, which is what keeps /robots.txt,
// /sitemap.xml and /icon.png out of this middleware. Next's *code-based* metadata
// images are the exception: `opengraph-image.tsx` is served at `/opengraph-image`
// with NO extension, so it does not match that exclusion. Left unlisted, it falls
// through to the auth gate below and 307s Facebook/LinkedIn/Slack crawlers to
// /sign-in — silently, with no build error. It must be excluded by name.
export const config = {
  matcher: ["/((?!api|_next|_vercel|opengraph-image|twitter-image|.*\\..*).*)"],
};
