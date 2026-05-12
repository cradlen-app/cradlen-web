# _template/

Starter skeleton for a new plugin. Copy this folder, rename to your plugin id, and fill in the manifest.

Files:

- `manifest.ts` — declares id, nav, permissions, queryKeyRoot, i18nNamespace, api.
- `api.ts` — public surface other modules may consume.
- `index.ts` — re-exports manifest + api.
- `components/`, `hooks/`, `listeners/` — implementation, never imported from outside this folder.
- `messages/{en,ar}.json` — locale slices, unwrapped keys. The kernel wraps them under `manifest.i18nNamespace`.
