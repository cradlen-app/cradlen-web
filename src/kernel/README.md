# kernel/

Registry + host plumbing for the modular kernel. Implementation only — contracts live in `@/common/kernel-contracts`.

Subfolders:

- `registry/` — `ModuleRegistry`, `NavRegistry`, `PermissionRegistry`, `QueryKeyRegistry`, `I18nRegistry`. **Internal** (ESLint zone-locked; not imported by other layers).
- `host/` — `bootModules`, `KernelProvider`, `useKernel`, `usePluginNav`, `usePermission`. **Internal**; re-exported from `kernel/index.ts`.

External code reaches a module's public surface via static `import "@/core/<name>/api"`. The manifest no longer carries an `api` field — keeping React client components out of the kernel boot path lets the kernel run in server/test contexts.
- `events/` — kernel lifecycle EventBus (module-registered, frozen, etc.).

External callers import only the public surface from `@/kernel` (the barrel).

Boot model: `bootModules()` is idempotent. It maintains separate `serverRegistry` / `clientRegistry` instances so server-side rendering and client hydration don't share mutable state. Both register the same manifests so their frozen contents are identical.
