import { defineConfig, devices } from "@playwright/test";
const remote = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  workers: process.env.CI ? 2 : 2,
  use: {
    baseURL: remote || "http://127.0.0.1:4173/creative_music_art_startup/",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH },
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    {
      name: "desktop-firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: /design.spec.ts/,
    },
    {
      name: "mobile-webkit",
      use: {
        ...devices["iPhone 13"],
        launchOptions: { executablePath: process.env.WEBKIT_EXECUTABLE_PATH },
      },
      testIgnore: /design.spec.ts/,
    },
  ],
  webServer: remote
    ? undefined
    : {
        command: "npm run preview -- --host 127.0.0.1 --port 4173",
        url: "http://127.0.0.1:4173/creative_music_art_startup/",
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
});
