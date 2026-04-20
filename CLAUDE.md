# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```

## Stack

- **Next.js 16** (App Router) — read `node_modules/next/dist/docs/` before writing Next.js code; APIs differ from older versions
- **React 19** + **TypeScript**
- **Tailwind CSS v4** — configured via CSS imports in `src/styles/globals.css`, not `tailwind.config.js`
- **shadcn/ui** (`radix-nova` style) — components live in `src/components/ui/`, added via `npx shadcn add <component>`
- **TanStack Query v5** — `src/lib/queryClient.ts` holds the shared `QueryClient`
- **Zustand v5** — for global client state
- **React Hook Form + Zod v4** — for forms and validation
- **Lucide React** — icon library
- **next-intl v4** — i18n and RTL support

## Architecture

- `src/app/` — Next.js App Router pages and layouts
  - `src/app/layout.tsx` — root shell; reads `getLocale()` to set `lang` and `dir` on `<html>`
  - `src/app/[locale]/layout.tsx` — locale segment; mounts `NextIntlClientProvider`, exports `generateStaticParams`
  - `src/app/[locale]/page.tsx` — pages use `getTranslations` (server) or `useTranslations` (client)
- `src/components/ui/` — shadcn/ui primitive components; extend but don't modify generated files directly
- `src/lib/` — shared utilities (`utils.ts` exports `cn()` for class merging, `api.ts` for fetch helpers, `queryClient.ts` for TanStack Query setup)
- `src/types/` — shared TypeScript types (`api.types.ts`, `common.types.ts`)
- `src/styles/globals.css` — Tailwind v4 theme tokens defined as CSS variables here; `:lang(ar)` swaps `--font-sans` to Cairo
- `src/i18n/routing.ts` — locale list (`en`, `ar`) and `defaultLocale`
- `src/i18n/request.ts` — `getRequestConfig`; loads messages from `src/messages/{locale}.json`
- `src/i18n/navigation.ts` — locale-aware `Link`, `redirect`, `useRouter`, `usePathname` via `createNavigation`
- `src/messages/` — translation JSON files (`en.json`, `ar.json`)
- `src/proxy.ts` — Next.js 16 route interceptor (next-intl middleware); Next.js 16 uses `proxy.ts`, not `middleware.ts`

## Localization Conventions

- All pages live under `src/app/[locale]/`. Call `setRequestLocale(locale)` at the top of every page and layout that receives `params`.
- Server components: `const t = await getTranslations("namespace")` from `next-intl/server`.
- Client components: `const t = useTranslations("namespace")` from `next-intl`.
- Navigation: always use `Link`, `redirect`, `useRouter` from `@/i18n/navigation` (locale-aware), never from `next/navigation` or `next/link` directly.
- RTL: `dir="rtl"` is set on `<html>` automatically for `ar`. Use Tailwind's `rtl:`/`ltr:` variants and logical properties (`ms-`, `me-`, `ps-`, `pe-`) in components.
- Add new locales in `src/i18n/routing.ts` and create a matching `src/messages/{locale}.json`.
- Dynamic imports of JSON messages must use a `switch` (not template literals) — Turbopack requires static paths.

## Key Conventions

- Use `cn()` from `@/lib/utils` for conditional class names.
- shadcn components use `radix-ui` (not `@radix-ui/*` scoped packages) — import `Slot` from `radix-ui`, not `@radix-ui/react-slot`.
- Tailwind v4 has no `tailwind.config.js` — extend the theme in `globals.css` using `@theme`.
- Path alias `@/` maps to `src/`.
