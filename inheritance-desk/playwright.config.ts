import { defineConfig, devices } from "@playwright/test";

// Visual-regression suite. Screens are captured at five viewports (desktop → mobile).
// Animations are disabled via reduced-motion (our CSS honours it) so snapshots are
// stable. First run creates baselines: `npx playwright test --update-snapshots`.
const PORT = process.env.PORT || 3199;
const baseURL = `http://localhost:${PORT}`;

const viewports = {
  "desktop-1440": { width: 1440, height: 900 },
  "desktop-1280": { width: 1280, height: 800 },
  "tablet-1024": { width: 1024, height: 768 },
  "tablet-768": { width: 768, height: 1024 },
  "mobile-390": { width: 390, height: 844 },
};

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 150_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" } },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    reducedMotion: "reduce",
    ignoreHTTPSErrors: true,
  },
  projects: Object.entries(viewports).map(([name, viewport]) => ({
    name,
    use: { ...devices["Desktop Chrome"], viewport, isMobile: false },
  })),
  // Reuse the running dev server if present; otherwise start one.
  webServer: {
    command: `PORT=${PORT} npm run dev`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
