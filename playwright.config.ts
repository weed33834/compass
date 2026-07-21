import { defineConfig, devices } from "@playwright/test";

// Compass 全功能 E2E 测试配置
// 前置：dev server 运行在 http://localhost:3000（手动启动 pnpm dev）

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // 串行：避免多 worker 同时操作 demo 数据导致状态污染
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 120_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // 不启动 webServer：dev server 已手动启动
});
