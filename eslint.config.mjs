import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Directory names under `rel` (skipping `_`-prefixed scaffolding like `_template`). */
function listModules(rel) {
  try {
    return readdirSync(join(__dirname, rel), { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
      .map((d) => d.name);
  } catch {
    return [];
  }
}

const CORE_MODULES = listModules("src/core");

/**
 * Internal-surface patterns for every core module EXCEPT `ownName`, so a module
 * may deep-import its own internals (e.g. `financial` importing
 * `@/core/financial/components/...`) but not another module's. The negation
 * (`!@/core/<own>/**`) re-permits the module's own subtree.
 */
function crossCoreInternalPatterns(ownName) {
  return [
    "@/core/*/components/**",
    "@/core/*/hooks/**",
    "@/core/*/lib/**",
    "@/core/*/types/**",
    "@/core/*/data/**",
    "@/core/*/permissions",
    "@/core/*/queryKeys",
    "@/core/*/nav",
    `!@/core/${ownName}/**`,
  ];
}

/**
 * Architecture boundary rules — see `CLAUDE.md` § "Architecture: Modular
 * Kernel + Plugin Layout" for the full rationale.
 *
 * Public surface rule: `core/<name>` and `plugins/<name>` may only be
 * imported via their barrel (the path ending at the module name) or via
 * `api`, `manifest`, `index`, or `messages` subpaths. Deep imports into
 * `components/`, `hooks/`, `lib/`, etc. are blocked.
 *
 * Kernel internal rule: `@/kernel/registry` and `@/kernel/host` are
 * implementation; only the kernel itself reaches them. External code
 * imports via the `@/kernel` barrel.
 *
 * Transitional: `src/features/**` (the sunset layer) is allowed to import
 * from anywhere. Likewise `core/<name>` may still depend on
 * `@/features/<feature>` while features wait their turn to migrate.
 */
const moduleBoundaryRules = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "@/core/*/components/**",
            "@/core/*/hooks/**",
            "@/core/*/lib/**",
            "@/core/*/types/**",
            "@/core/*/data/**",
            "@/core/*/permissions",
            "@/core/*/queryKeys",
            "@/core/*/nav",
          ],
          message:
            "Import only from a core module's public surface: '@/core/<name>', '@/core/<name>/api', '@/core/<name>/manifest', or '@/core/<name>/messages/*'.",
        },
        {
          group: [
            "@/plugins/*/components/**",
            "@/plugins/*/hooks/**",
            "@/plugins/*/lib/**",
            "@/plugins/*/listeners/**",
          ],
          message:
            "Import only from a plugin's public surface: '@/plugins/<name>', '@/plugins/<name>/api', or '@/plugins/<name>/manifest'.",
        },
        {
          group: ["@/kernel/registry/**", "@/kernel/host/**", "@/kernel/events/**"],
          message: "Import kernel internals only via the '@/kernel' barrel.",
        },
      ],
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
  {
    // Apply the boundary rules to all TS/TSX source files...
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: moduleBoundaryRules,
  },
  {
    // Plugins consume their own internals; the kernel obviously consumes its
    // own. Cross-plugin boundaries are still governed by the global rule above
    // (plugins import core only via `api`, never another plugin's internals).
    files: ["src/plugins/*/**", "src/kernel/**"],
    rules: { "no-restricted-imports": "off" },
  },
  // Per-core-module override: a module may deep-import ITS OWN internals, but
  // reaching into another core module's internals stays blocked (use the
  // sibling's `@/core/<name>/api` barrel instead). Replaces the old blanket
  // "off for every core file", which silently let cross-module deep imports
  // through.
  ...CORE_MODULES.map((name) => ({
    files: [`src/core/${name}/**/*.ts`, `src/core/${name}/**/*.tsx`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: crossCoreInternalPatterns(name),
              message:
                "Import another core module via its public surface: '@/core/<name>', '@/core/<name>/api', or '@/core/<name>/manifest'. A module may deep-import only its own internals.",
            },
            {
              group: [
                "@/plugins/*/components/**",
                "@/plugins/*/hooks/**",
                "@/plugins/*/lib/**",
                "@/plugins/*/listeners/**",
              ],
              message:
                "Import a plugin only via '@/plugins/<name>', '@/plugins/<name>/api', or '@/plugins/<name>/manifest'.",
            },
            {
              group: ["@/kernel/registry/**", "@/kernel/host/**", "@/kernel/events/**"],
              message: "Import kernel internals only via the '@/kernel' barrel.",
            },
          ],
        },
      ],
    },
  })),
]);

export default eslintConfig;
