# plugins/

Real extensions: telemedicine, billing, lab-integration, sms-reminders, insurance-claims, etc.

Each plugin is structured the same as a core module:

```
plugins/<name>/
  manifest.ts         # default export: ModuleManifest (kind: 'plugin')
  api.ts              # public surface
  index.ts            # re-exports manifest + api only
  components/
  hooks/
  lib/
  listeners/          # subscribers to kernel/events or core domain events
  messages/{en,ar}.json
```

Dependency rule: `plugins/ → common, common/kernel-contracts, kernel/events, core/*/api.ts`.

Plugins **may not**:

- Import core module internals (only `@/core/<name>/api`).
- Import another plugin's internals.
- Import from `infrastructure/`, `builder/`, or `kernel/registry|host` directly.

See `_template/` for a starter skeleton when authoring a new plugin.
