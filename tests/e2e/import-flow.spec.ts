// 导入流程端到端测试：通过 UI 上传各种文件，验证成功/失败反馈
// 运行：pnpm exec playwright test tests/e2e/import-flow.spec.ts --reporter=list

import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

const BASE = "http://localhost:3000";
const DEMO_EMAIL = "captain@compass.dev";
const DEMO_PASSWORD = "Compass-Test-2026!";
const FIXTURES = path.join(__dirname, "..", "fixtures", "import");

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(compass|account)/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
}

// 打开导入对话框
async function openImportDialog(page: Page) {
  await page.goto(`${BASE}/workshop`);
  await page.waitForLoadState("networkidle");
  // 按钮文案："导入文件"（顶部操作栏 或 空状态卡片里各有一个）
  await page.getByRole("button", { name: /导入文件/ }).first().click();
  await expect(page.locator("h2", { hasText: "从文件导入题库" })).toBeVisible({ timeout: 5_000 });
}

// 上传文件并点导入，等待结果。
// 成功（无告警）→ 对话框自动关闭；
// 成功（有告警）→ 对话框停留，显示绿色成功条 + 告警列表 + "完成" 按钮；
// 失败 → 对话框停留，显示红色 error。
async function uploadAndWait(
  page: Page,
  fileName: string
): Promise<{ error: string; warningCount: number; success: boolean; dialogClosed: boolean }> {
  const input = page.locator('input[type="file"]');
  await input.setInputFiles(path.join(FIXTURES, fileName));
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^导入$/ }).click();

  const dialog = page.locator("h2", { hasText: "从文件导入题库" });
  const errorEl = page.locator("p.border-coral\\/30");
  const successEl = page.locator("p.border-f-emerald\\/30");
  const warningSummary = page.locator("details.border-f-amber\\/30 summary");

  // 等任一结果出现：对话框关闭 / error / 成功条
  await Promise.race([
    dialog.waitFor({ state: "hidden", timeout: 25_000 }).catch(() => {}),
    errorEl.waitFor({ state: "visible", timeout: 25_000 }).catch(() => {}),
    successEl.waitFor({ state: "visible", timeout: 25_000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(400);

  const dialogClosed = !(await dialog.isVisible().catch(() => false));
  const error = (await errorEl.isVisible().catch(() => false))
    ? ((await errorEl.textContent()) ?? "").trim()
    : "";
  const successVisible = await successEl.isVisible().catch(() => false);
  let warningCount = 0;
  if (await warningSummary.isVisible().catch(() => false)) {
    const txt = (await warningSummary.textContent()) ?? "";
    const m = txt.match(/(\d+)/);
    if (m) warningCount = parseInt(m[1], 10);
  }
  // 成功判定：对话框关闭（无告警自动关闭）或 成功条可见（有告警停留）
  const success = dialogClosed || successVisible;
  return { error, warningCount, success, dialogClosed };
}

test.describe.configure({ mode: "serial" });

test.describe("导入流程", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("01. 合法 Markdown 导入成功", async ({ page }) => {
    await openImportDialog(page);
    const { error, success, warningCount } = await uploadAndWait(page, "valid-multi-types.md");
    console.log(`  ℹ️ 结果：success=${success}, warnings=${warningCount}, error="${error}"`);
    expect(success).toBeTruthy();
  });

  test("02. 合法 CSV 导入成功", async ({ page }) => {
    await openImportDialog(page);
    const { error, success, warningCount } = await uploadAndWait(page, "valid-csv.csv");
    console.log(`  ℹ️ 结果：success=${success}, warnings=${warningCount}, error="${error}"`);
    expect(success).toBeTruthy();
  });

  test("03. 空文件导入报错", async ({ page }) => {
    await openImportDialog(page);
    const { error, success } = await uploadAndWait(page, "malformed-empty.md");
    console.log(`  ℹ️ 结果：success=${success}, error="${error}"`);
    expect(error).toContain("文件为空");
    expect(success).toBeFalsy();
  });

  test("04. 二进制伪装 .md 报错", async ({ page }) => {
    await openImportDialog(page);
    const { error, success } = await uploadAndWait(page, "malformed-binary-as-md.md");
    console.log(`  ℹ️ 结果：success=${success}, error="${error}"`);
    expect(error).toContain("不是文本");
    expect(success).toBeFalsy();
  });

  test("05. 旧版 .doc 拒绝", async ({ page }) => {
    await openImportDialog(page);
    const { error, success } = await uploadAndWait(page, "malformed-legacy.doc");
    console.log(`  ℹ️ 结果：success=${success}, error="${error}"`);
    expect(error).toContain("不支持旧版 .doc");
    expect(success).toBeFalsy();
  });

  test("06. 答案不在选项中 → 告警但可导入", async ({ page }) => {
    await openImportDialog(page);
    const { error, success, warningCount } = await uploadAndWait(page, "malformed-answer-not-in-options.md");
    console.log(`  ℹ️ 结果：success=${success}, warnings=${warningCount}, error="${error}"`);
    // 不在选项中是 warning 而非 error，应能导入成功
    expect(success).toBeTruthy();
    expect(warningCount).toBeGreaterThan(0);
    expect(error).toBe("");
  });

  test("07. 判断题答案无法识别 → 跳过该题（有告警但可导入）", async ({ page }) => {
    await openImportDialog(page);
    const { error, success, warningCount } = await uploadAndWait(page, "malformed-bad-boolean.md");
    console.log(`  ℹ️ 结果：success=${success}, warnings=${warningCount}, error="${error}"`);
    // 1 题跳过 + 1 题正常 → 应能导入 1 题，且有告警
    expect(success).toBeTruthy();
    expect(warningCount).toBeGreaterThan(0);
    expect(error).toBe("");
  });
});
