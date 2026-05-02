import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PW_BASE_URL ?? "https://vidyalaya-app.vercel.app";

export default defineConfig({
  testDir: "./tests/qa-e2e",
  timeout: 30_000,
  retries: 1,
  workers: 4,
  reporter: [["list"], ["json", { outputFile: "tests/qa/playwright-results.json" }]],
  use: {
    baseURL: BASE_URL,
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
