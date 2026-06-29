import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

// The suite is large (300+ files, each spinning up a jsdom environment). Letting
// the forks pool fan out to every core oversubscribes memory on developer
// machines and CI runners, which surfaces as "Timeout waiting for worker to
// respond" worker-startup failures rather than real test failures. Cap the
// worker count so workers stay responsive; this changes throughput only, not
// correctness or isolation.
const cpuCount = os.availableParallelism?.() ?? os.cpus().length;
const maxForks = Math.max(1, Math.min(4, cpuCount - 1));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    css: true,
    pool: "forks",
    // Vitest 4 moved the former `poolOptions.forks.maxForks` to this top-level
    // option. Capping workers keeps the large jsdom suite from oversubscribing
    // memory (which surfaces as worker-startup timeouts).
    maxWorkers: maxForks,
    // Cushion for slow worker startup under load (contention, not slow tests).
    testTimeout: 15_000,
    hookTimeout: 15_000,
    teardownTimeout: 15_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.integration.test.{ts,tsx}",
        "src/test/**",
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
      ],
    },
    exclude: ["**/node_modules/**", "**/.git/**", "e2e/**"],
  },
});
