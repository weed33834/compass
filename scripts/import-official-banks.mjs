// 批量导入官方题库脚本（仅本地/部署初始化用）
// 登录 demo 账号 -> 读取 public/official-banks/manifest.json
// -> 对尚未导入的题库逐一 POST /api/banks/import（按名称幂等跳过）
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const EMAIL = "captain@compass.dev";
const PASSWORD = "Compass-Test-2026!";

async function main() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "official-banks", "manifest.json"), "utf8"),
  );

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1) 登录
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/compass/, { timeout: 30000 });
  await page.waitForTimeout(500);

  // 2) 现有题库名称（幂等判断）
  const existing = await context.request.get(`${BASE}/api/banks`).then((r) => r.json());
  const existingNames = new Set((existing.banks || []).map((b) => b.name));
  console.log("已存在题库:", [...existingNames].join(" | ") || "(无)");

  // 3) 逐个导入缺失题库
  let imported = 0;
  for (const bank of manifest.banks) {
    if (existingNames.has(bank.name)) {
      console.log(`跳过（已存在）: ${bank.name}`);
      continue;
    }
    const fileName = path.basename(bank.file); // 形如 /official-banks/xxx.md
    const filePath = path.join(process.cwd(), "public", "official-banks", fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`跳过（文件缺失）: ${fileName}`);
      continue;
    }
    const buffer = await fs.promises.readFile(filePath);
    const res = await context.request.post(`${BASE}/api/banks/import`, {
      multipart: {
        file: { name: fileName, mimeType: "text/markdown", buffer },
        name: bank.name,
        description: bank.description || "",
        coverColor: bank.coverColor || "brass",
        tags: (bank.tags || []).join(","),
        newCardsPerDay: String(bank.newCardsPerDay || 20),
      },
    });
    const body = await res.json().catch(() => ({}));
    console.log(
      `导入 ${res.status()} : ${bank.name} -> ${body.questionCount ?? "?"} 题`,
    );
    if (res.status() === 201) imported++;
  }

  await browser.close();
  console.log(`DONE, 本次新增 ${imported} 套`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
