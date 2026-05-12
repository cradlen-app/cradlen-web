# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev            # Start dev server (Turbopack)
npm run build          # Production build
npm run lint           # ESLint
npm run test           # Run all tests (Vitest)
npm run test:unit      # Unit tests only (excludes *.integration.test.*)
npm run test:integration  # Integration tests only
npx vitest run path/to/file.test.ts  # Run a single test file
npx vitest run -t "test name"        # Run tests matching a name
npx tsc --noEmit --pretty false      # Faster TypeScript check without emit
```

Requires Node.js 20+.

## Stack

- **Next.js 16** (App Router) — read `node_modules/next/dist/docs/` before writing Next.js code; APIs differ from older versions
- **React 19** + **TypeScript**
- **Tailwind CSS v4** — configured via CSS imports in `src/styles/globals.css`, not `tailwind.config.js`
- **shadcn/ui** (`radix-nova` style) — components live in `src/components/ui/`, added via `npx shadcn add <component>`
- **TanStack Query v5** — `src/infrastructure/query/queryClient.ts` holds the shared `QueryClient`; `src/lib/queryKeys.ts` is the centralized key factory — always use it for cache invalidation (will move to per-module ownership in Phase C)
- **Zustand v5** — auth context, user, and flow state; all persisted stores use the `persist` middleware
- **React Hook Form + Zod v4** — for forms and validation
- **Lucide React** — icon library
- **next-intl v4** — i18n and RTL support

## Architecture

- `src/app/` — Next.js App Router pages and layouts
  - `src/app/layout.tsx` — root shell; reads `getLocale()` to set `lang` and `dir` on `<html>`; loads Poppins and Cairo fonts via `next/font/google`
  - `src/app/[locale]/layout.tsx` — locale segment; mounts `NextIntlClientProvider`, exports `generateStaticParams`
  - `src/app/[locale]/page.tsx` — pages use `getTranslations` (server) or `useTranslations` (client)
- `src/features/<feature>/` — feature modules with `components/`, `lib/` (schemas), `types/`, `hooks/`, `store/` subdirectories; active features: `auth`, `staff`, `patients`, `visits`, `calendar`, `notifications`, `settings`, `organizations`
- `src/components/ui/` — shadcn/ui primitive components; extend but don't modify generated files directly
- `src/lib/` — shared utilities: `utils.ts` (`cn()`), `api.ts` (fetch helpers), `queryClient.ts`, `queryKeys.ts` (centralized query key factory), `routes.ts` (`buildDashboardUrl`), `error.ts`, `branch.utils.ts`; `src/lib/server/` holds server-only helpers (`backend.ts`, `signup-session.ts`, `multi-tenant-auth.ts`)
- `src/types/` — shared TypeScript types (`api.types.ts`, `common.types.ts`)
- `src/styles/globals.css` — Tailwind v4 theme tokens defined as CSS variables here; `:lang(ar)` swaps `--font-sans` to Cairo
- `src/public/` — static assets (Logo.png, Logo-icon.png); import via Next.js `Image` as static imports — **not** the root `public/`. New static assets go here.
- `src/i18n/routing.ts` — locale list (`en`, `ar`) and `defaultLocale`
- `src/i18n/request.ts` — `getRequestConfig`; loads messages from `src/messages/{locale}.json`
- `src/i18n/navigation.ts` — locale-aware `Link`, `redirect`, `useRouter`, `usePathname` via `createNavigation`
- `src/messages/` — translation JSON files (`en.json`, `ar.json`)
- `src/proxy.ts` — Next.js 16 route interceptor (next-intl middleware); Next.js 16 uses `proxy.ts`, not `middleware.ts`

## Brand Tokens

Custom Tailwind tokens for brand consistency (defined in `globals.css`):

- `--color-brand-primary: #11604C` → use as `bg-brand-primary`, `text-brand-primary`
- `--color-brand-secondary: #AAB37D` → use as `bg-brand-secondary`, `text-brand-secondary`
- `--color-brand-black: #1D1D1B` → use as `text-brand-black`

## Localization Conventions

- All pages live under `src/app/[locale]/`. Call `setRequestLocale(locale)` at the top of every page and layout that receives `params`.
- **Next.js 16**: `params` is a `Promise<{ locale: string }>` — always `await params` before accessing its properties.
- Server components: `const t = await getTranslations("namespace")` from `next-intl/server`.
- Client components: `const t = useTranslations("namespace")` from `next-intl`.
- Navigation: always use `Link`, `redirect`, `useRouter` from `@/i18n/navigation` (locale-aware), never from `next/navigation` or `next/link` directly.
- RTL: `dir="rtl"` is set on `<html>` automatically for `ar`. Use Tailwind's `rtl:`/`ltr:` variants and logical properties (`ms-`, `me-`, `ps-`, `pe-`) in components.
- Add new locales in `src/i18n/routing.ts` and create a matching `src/messages/{locale}.json`.
- Dynamic imports of JSON messages must use a `switch` (not template literals) — Turbopack requires static paths.

## Multi-tenant URL Structure

Dashboard pages live at `[locale]/[orgId]/[branchId]/dashboard/<section>`. The `orgId` and `branchId` are URL path segments — use `useDashboardPath()` from `src/hooks/useDashboardPath.ts` in client components to build navigation URLs, or `buildDashboardUrl(orgId, branchId, path)` from `src/lib/routes.ts` in server contexts.

The auth context (org/branch/profile IDs) is held in `authContextStore` (Zustand, persisted as `cradlen-org-context`) and injected as `X-Organization-Id`, `X-Profile-Id`, `X-Branch-Id` headers by `apiAuthFetch`.

## Real-time

Visits use a Socket.IO connection (`socket.io-client`) via `useVisitSocket`. The WebSocket base URL strips `/v1` from `NEXT_PUBLIC_API_URL`. Set `NEXT_PUBLIC_VISITS_MOCK=true` to skip the socket in local dev.

## Testing

- Framework: Vitest + Testing Library + jsdom; setup in `src/test/setup.ts`.
- Integration tests (files named `*.integration.test.*`) hit real network/servers and run separately with `npm run test:integration`.
- MSW (`msw`) is available for mocking HTTP in unit tests.
- Toasts use **Sonner** — import `toast` from `sonner`.

## Key Conventions

- Use `cn()` from `@/common/utils/utils` for conditional class names.
- shadcn components use `radix-ui` (not `@radix-ui/*` scoped packages) — import `Slot` from `radix-ui`, not `@radix-ui/react-slot`.
- Tailwind v4 has no `tailwind.config.js` — extend the theme in `globals.css` using `@theme`.
- Path alias `@/` maps to `src/`. Layer aliases: `@/common/*`, `@/infrastructure/*`, `@/builder/*`, `@/core/*`, `@/plugins/*`, `@/kernel/*`.

## Architecture: Modular Kernel + Plugin Layout

The codebase is migrating from a flat `src/features/<feature>/` layout to a five-layer split that mirrors `cradlen-api`. Phase A (kernel skeleton) is in; Phase B (move shared `lib/` and `types/` into `common/` + `infrastructure/`) and Phase C (migrate `staff` to `core/staff/`) are upcoming.

### Layers

| Layer | Path | What lives here |
|---|---|---|
| common | `src/common/` | Pure types, utils, errors, constants, and `kernel-contracts/`. No imports from anywhere else in `src/`. |
| infrastructure | `src/infrastructure/` | Talks to the outside world: `http/`, `query/`, `realtime/`, `auth-transport/`, `i18n/`, `storage/`, `logging/`, `monitoring/`, `config/`. |
| builder | `src/builder/` | Frontend renderer + runtime for the backend's DSL (fields, sections, templates, workflows, rules). |
| kernel | `src/kernel/` | Module registries + host hooks (`bootModules`, `usePluginNav`, `usePermission`, `KernelProvider`). Internal — external code imports only from `@/kernel`. |
| core | `src/core/` | Domain modules: `auth/`, `org/`, `branch/`, `staff/`, `patient/`, `clinical/{journey,episode,visit,mmr}/`. Each exposes a `manifest.ts` and an `api.ts`. |
| plugins | `src/plugins/` | Extensions (telemedicine, billing, lab-integration, sms-reminders, insurance-claims). Same manifest contract as core modules. |
| features (legacy) | `src/features/` | Sunset path. Allowed to import from anywhere during migration. Each feature migrates to `core/` or `plugins/` in its own PR. |

### Dependency rules

```text
common/                 → nothing in src/
common/kernel-contracts → nothing in src/ (pure types)
infrastructure/         → common
builder/                → common, infrastructure
kernel/                 → common (contracts), infrastructure (host plumbing only)
core/                   → common, infrastructure, builder, @/kernel (host hooks only)
plugins/                → common, common/kernel-contracts, kernel/events, core/*/api.ts
features/ (legacy)      → anywhere (transitional)
```

### Where do I put X?

| New code | Goes in |
|---|---|
| Shared TS type used by 2+ layers | `src/common/types/` |
| Pure helper (`cn`, formatters, guards) | `src/common/utils/` |
| Wraps `fetch`, sockets, cookies, env, Sentry | `src/infrastructure/<topic>/` |
| Renders a dynamic field / section / template from backend DSL | `src/builder/` |
| Domain feature (CRUD, hooks, components for an entity) | `src/core/<module>/` |
| Third-party-ish extension (telemedicine, billing, etc.) | `src/plugins/<name>/` |
| Cross-module accessor by id, sidebar item registration | `src/kernel/` |

### Module manifest contract

Every core module and plugin exports a `ModuleManifest` from `manifest.ts`. The kernel registers manifests at boot and exposes registries via `usePluginNav()` and `usePermission(id)`. Per-module `messages/{en,ar}.json` files contain **unwrapped** keys; the kernel wraps them under `manifest.i18nNamespace` at load time.

Each module also exposes a public surface as one or two sibling files:

- `api.ts` — data/types/hooks/predicates. Importable from server-side, test, and route-guard contexts. Must **not** re-export React client components.
- `pages.ts` — top-level page components rendered by app routes. Imports React client modules; keep out of `api.ts` to avoid pulling client code into server bundles. (Add only if the module has page components.)

The manifest deliberately does not reference `api.ts` or `pages.ts` so kernel boot stays usable from `getRequestConfig` and Vitest. See `src/core/staff/` for the canonical example.

### Import surface for core / plugins

External code may import only:

- `@/core/<name>` — the barrel.
- `@/core/<name>/api` — non-UI public surface.
- `@/core/<name>/pages` — page components (when present).
- `@/core/<name>/manifest` — the manifest (rarely needed outside the kernel boot list).

Deep imports into module internals (`@/core/<name>/components/...`, `@/core/<name>/hooks/...`, etc.) are blocked by ESLint. The same rule applies to `@/plugins/<name>/...` and to `@/kernel/registry/...` / `@/kernel/host/...` — external code imports the kernel via the `@/kernel` barrel only.

Until features migrate, `@/features/<feature>/...` deep imports remain allowed.
