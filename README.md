# Cradlen Web

A modern web application built with Next.js 16 App Router, React 19, and full Arabic/English localization support.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (`radix-nova` style) |
| State | Zustand v5 |
| Server State | TanStack Query v5 |
| Forms | React Hook Form + Zod v4 |
| Icons | Lucide React |
| i18n | next-intl v4 (English + Arabic / RTL) |

## Prerequisites

- Node.js 20+
- npm

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root shell — sets lang/dir on <html>
│   └── [locale]/
│       ├── layout.tsx          # Mounts NextIntlClientProvider
│       └── page.tsx            # Locale-aware pages
├── components/
│   └── ui/                     # shadcn/ui primitive components
├── i18n/
│   ├── routing.ts              # Locale list: en, ar
│   ├── request.ts              # getRequestConfig — loads messages
│   └── navigation.ts           # Locale-aware Link, redirect, useRouter
├── lib/
│   ├── utils.ts                # cn() for class merging
│   ├── api.ts                  # Fetch helpers
│   └── queryClient.ts          # TanStack Query shared client
├── messages/
│   ├── en.json                 # English translations
│   └── ar.json                 # Arabic translations
├── styles/
│   └── globals.css             # Tailwind v4 theme tokens (CSS vars)
├── types/
│   ├── api.types.ts
│   └── common.types.ts
└── proxy.ts                    # next-intl middleware (Next.js 16 uses proxy.ts)
```

## Key Conventions

**Class names** — use `cn()` from `@/lib/utils` for conditional Tailwind classes.

**Path alias** — `@/` maps to `src/`.

**shadcn components** — use `radix-ui` (not scoped `@radix-ui/*` packages). Import `Slot` from `radix-ui`.

**Tailwind v4** — no `tailwind.config.js`. Extend the theme in `src/styles/globals.css` using `@theme`.

**Next.js 16** — middleware file is `src/proxy.ts`, not `middleware.ts`.

## Localization

The app supports English (`en`) and Arabic (`ar`) with automatic RTL layout for Arabic.

- All pages live under `src/app/[locale]/`
- Call `setRequestLocale(locale)` at the top of every page/layout that receives `params`
- Server components: `const t = await getTranslations("namespace")` from `next-intl/server`
- Client components: `const t = useTranslations("namespace")` from `next-intl`
- Always use `Link`, `redirect`, `useRouter` from `@/i18n/navigation` — never from `next/navigation` or `next/link`
- Use Tailwind's `rtl:`/`ltr:` variants and logical properties (`ms-`, `me-`, `ps-`, `pe-`) in components

To add a new locale: update `src/i18n/routing.ts` and create `src/messages/{locale}.json`.

## Adding UI Components

Components are managed via shadcn/ui:

```bash
npx shadcn add <component-name>
```

Generated components land in `src/components/ui/`. Extend them, but avoid modifying generated files directly.
