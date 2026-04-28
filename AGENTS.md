<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cradlen Web Agent Memory

## Project Snapshot

- Framework: Next.js 16 App Router with React 19 and TypeScript.
- Styling: Tailwind CSS v4 in `src/styles/globals.css`; there is no `tailwind.config.js`.
- i18n: `next-intl` with English (`en`) and Arabic (`ar`) locales.
- UI: shadcn-style components, `radix-ui`, Lucide icons, React Hook Form, Zod, TanStack Query, Zustand.
- Path alias: `@/*` maps to `src/*`.

## Next.js 16 Rules

- Read the local docs in `node_modules/next/dist/docs/` before changing framework-sensitive code.
- Middleware is `src/proxy.ts`, not `middleware.ts`.
- Route/page/layout `params` are promises. Await them before reading values.
- Route handlers live in `route.ts`; use `NextRequest`/`NextResponse` where helpful.
- `cookies()` from `next/headers` is async.

## Auth And API Rules

- Do not store access or refresh tokens in Zustand, localStorage, sessionStorage, or readable browser cookies.
- Auth tokens are owned by Next route handlers and stored as `HttpOnly` cookies:
  - `cradlen-auth-token`
  - `cradlen-refresh-token`
- Authenticated browser calls must go through the same-origin proxy:
  - client helper: `apiAuthFetch(...)`
  - server route: `/api/backend/[...path]`
- Token-issuing flows must go through local route handlers that set cookies and return only non-sensitive session state:
  - `/api/auth/login`
  - `/api/auth/register-organization`
  - `/api/auth/reset-password`
  - `/api/staff/invite/accept`
- Current user and logout use local auth routes:
  - `/api/auth/me`
  - `/api/auth/logout`
- Backend base URL comes from `API_BASE_URL` or `NEXT_PUBLIC_API_URL`, with fallback to `https://api.cradlen.com/v1`.
- `src/proxy.ts` is only an optimistic route guard. Backend authorization remains the source of truth.

## Localization Rules

- User-facing pages live under `src/app/[locale]/`.
- Call `setRequestLocale(locale)` in any page/layout receiving locale params.
- Server translations: `getTranslations(...)` from `next-intl/server`.
- Client translations: `useTranslations(...)` from `next-intl`.
- Use navigation helpers from `@/i18n/navigation` for localized links/router/pathname.
- `useSearchParams` still comes from `next/navigation`.
- Keep `src/messages/en.json` and `src/messages/ar.json` key-compatible.
- Use logical Tailwind utilities (`ms-`, `me-`, `ps-`, `pe-`) and RTL/LTR variants for bidirectional UI.

## Layout And UI Rules

- The global locale layout should mount providers only; do not put shared marketing footer/chrome there.
- Render `Footer` only on public/auth/invite pages where intended, not dashboard pages.
- Dashboard pages use `DashboardLayout` and should remain dense, operational, and low-decoration.
- Use `cn()` from `@/lib/utils` for conditional class names.
- Prefer Lucide icons for icon buttons and controls.
- Existing generated UI primitives live in `src/components/ui/`; extend with care.

## Staff Domain Rules

- Staff roles are `owner`, `doctor`, `reception`, or `unknown`.
- Unknown backend role names must stay `unknown`; never silently coerce them to `doctor`.
- Invite/create staff forms should only offer assignable roles (`owner`, `doctor`, `reception`).
- Keep schedule day codes as backend values: `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`.

## Verification

- Before handing off meaningful code changes, run:
  - `npm run lint`
  - `npm run build`
- Use `npx tsc --noEmit --pretty false` when you need a faster TypeScript signal.
- If adding translation keys, verify English and Arabic key parity.
- Do not revert unrelated dirty work. This repo may have local changes outside the current task.
