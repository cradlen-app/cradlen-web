import { defineConfig, devices } from "@playwright/test";

// Point the started server at a test backend for the backend-backed e2e
// (auth-refresh.spec.ts). API_BASE_URL is read server-side at runtime, so it
// doesn't require a rebuild (unlike NEXT_PUBLIC_* which is inlined at build).
const webServerEnv: Record<string, string> | undefined = process.env.E2E_API_URL
  ? { ...(process.env as Record<string, string>), API_BASE_URL: process.env.E2E_API_URL }
  : undefined;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    ...(webServerEnv ? { env: webServerEnv } : {}),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
