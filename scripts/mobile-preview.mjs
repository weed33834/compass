// 移动端预览脚本（仅本地预览用，不进测试套件）
// 登录 demo 账号 -> 灌入官方题库 -> 对关键移动端页面截图
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
const OUT = "/workspace/mobile-preview";

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: MOBILE_UA,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1) 登录
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', "captain@compass.dev");
  await page.fill('input[type="password"]', "Compass-Test-2026!");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/compass/, { timeout: 30000 });
  await page.waitForTimeout(800);

  // 2) 灌入官方题库（按 manifest 名称幂等）
  const manifest = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "official-banks", "manifest.json"), "utf8"),
  );
  const fsrsBankDef = manifest.banks.find((b) => b.id === "fsrs-intro");
  const existing = await context.request.get(`${BASE}/api/banks`).then((r) => r.json());
  const existingNames = new Set((existing.banks || []).map((b) => b.name));
  if (fsrsBankDef && !existingNames.has(fsrsBankDef.name)) {
    const fileName = path.basename(fsrsBankDef.file);
    const buf = await fs.promises.readFile(path.join(process.cwd(), "public", "official-banks", fileName));
    const imp = await context.request.post(`${BASE}/api/banks/import`, {
      multipart: {
        file: { name: fileName, mimeType: "text/markdown", buffer: buf },
        name: fsrsBankDef.name,
        description: fsrsBankDef.description || "",
        coverColor: fsrsBankDef.coverColor || "brass",
        tags: (fsrsBankDef.tags || []).join(","),
        newCardsPerDay: String(fsrsBankDef.newCardsPerDay || 20),
      },
    });
    console.log("import:", imp.status(), fsrsBankDef.name);
  } else {
    console.log("import: skip (exists)");
  }

  // 3) 逐个页面截图
  const shots = [
    ["compass", "/compass"],
    ["study", "/study"],
    ["workshop", "/workshop"],
    ["wrongbook", "/wrongbook"],
    ["analytics", "/analytics"],
    ["account", "/account"],
  ];
  for (const [name, url] of shots) {
    await page.goto(`${BASE}${url}`);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
    console.log("shot:", name);
  }

  // 4) 登录页（先登出）
  await page.goto(`${BASE}/account`);
  await page.getByRole("button", { name: /退出登录/ }).click();
  await page.waitForURL(/\/login/, { timeout: 20000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "login.png"), fullPage: false });
  console.log("shot: login");

  await browser.close();
  console.log("DONE");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
