# Changelog

All notable changes to Compass are documented in this file. This project adheres to [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

## V1.4.2 — 2026-07-22

### Changed — 依赖手动升级（最低限度自动化策略，无 Dependabot）

所有依赖由 maintainer 手动评估后升级，CI 全绿验证通过。

- **next** `16.2.10` → `16.2.11`（补丁）
- **eslint-config-next** `16.2.10` → `16.2.11`（补丁）
- **next-auth** `^4.24.10` → `^4.24.15`（补丁，安全修复）
- **react / react-dom** `^19.2.7` → `^19.2.8`（补丁）
- **lucide-react** `^1.23.0` → `^1.25.0`（小版本）
- **@radix-ui/react-dialog / react-popover** `^1.1.19` → `^1.1.21`（补丁）
- **@tailwindcss/postcss / tailwindcss** `^4.3.2` → `^4.3.3`（补丁）
- **postcss** `^8.4.49` → `^8.5.22`（小版本）
- **autoprefixer** `^10.4.20` → `^10.5.4`（小版本）
- **tsx** `^4.23.0` → `^4.23.1`（补丁）
- **@types/node** `^20.17.6` → `^22.10.0`（对齐 `engines.node >=22.13`，pnpm 11 要求）

### Evaluated — 大版本升级评估（保守不升，记录理由）

- **TypeScript 5.9 → 7.0**：实测升级后 `eslint-config-next` 16.2 依赖的 `@typescript-eslint/typescript-estree@8.63` 崩溃（`TypeError: Cannot read properties of undefined (reading 'Cjs')`），根因是 TS 7.0 移除了编译器 API（计划 7.1 提供），typescript-eslint 的 type-aware 规则无法运行。**保持 5.9.3**，待 eslint-config-next 适配 TS 7 后再升。
- **ESLint 9 → 10**：ESLint 10 有配置格式与规则 breaking changes，eslint-config-next 16.2 对 ESLint 10 的兼容性未明确。**保持 9.x**。
- **Prisma 5 → 7**：Prisma 6/7 涉及 generator 配置变更、client API 变更、迁移流程变更，需 PostgreSQL 实例跑 `migrate deploy` 验证。**保持 5.22.0**，待单独的升级分支完整测试 DB 集成后再升。

### Added — 仓库可检索性（SEO / 发现性）

- **`src/app/robots.ts`**：Next.js Metadata API 生成 `/robots.txt`，允许公开页（落地页 / 登录 / 注册）被索引，屏蔽鉴权后功能区与 `/api/`。
- **`src/app/sitemap.ts`**：生成 `/sitemap.xml`，声明可索引的公开页面及更新频率。
- **`src/app/layout.tsx` metadata 增强**：新增 `keywords`、`openGraph`、`twitter`、`robots`、`metadataBase`、`canonical`、`authors`、`creator`、`publisher`、`category`，title 改为 `default + template` 模式，提升搜索引擎与社交分享可检索性。
- **`public/manifest.json` 增强**：新增 `scope` / `display_override` / `lang` / `dir` / `categories`，描述同步为完整版，icon 增加 SVG + `purpose`。
- **`package.json` keywords 扩充**：从 19 个增至 43 个，新增 `free-spaced-repetition-scheduler` / `flashcards` / `learning` / `memorization` / `anki` / `supermemo` / `react19` / `docker` / 中文关键词（间隔重复 / 刷题 / 题库 / 复习 / 错题本）等，提升 npm 与代码搜索发现性。
- **README 徽章**：新增 CI status badge（GitHub Actions）+ Version badge + React badge。
- **README 技术栈表**：补全精确版本号，新增 Radix UI 与 Node.js 运行时行。

### Changed — 文档完善

- **`CONTRIBUTING.md`**：提交前检查清单补 `pnpm test:unit`；lint 规则说明改为"零 errors，warnings 仅接受 eslint.config.mjs 已记录的既有模式"。
- **`SECURITY.md`**：漏洞上报渠道从模糊的"via email"改为明确指向 GitCode 私有安全通告页 + maintainer profile 邮箱。

---

## V1.4.1 — 2026-07-22

### Fixed — Critical（阻断核心功能）

- **C-1 FSRS 调度失效**（`src/lib/fsrs.ts`）：Prisma 存字符串 enum（`NEW`/`LEARNING`/`REVIEW`/`RELEARNING`），ts-fsrs 内部用数字 `State`（0/1/2/3）做分支判断。原代码 `state as unknown as number` 绕过类型检查但运行时仍是字符串，导致 `card.state === State.New`（`"NEW" === 0`）永远为 false，FSRS 调度算法完全失效。新增 `statePrismaToTs()` / `stateTsToPrisma()` 双向转换函数，`dbRowToCard()` 接受字符串 state 输出数字 state，`cardToDbUpdate()` 反向转换；移除所有 `as unknown as number` 断言。同步修复 `grade/route.ts` 和 `apply/route.ts` 中的同类问题。
- **C-2 题库删除外键约束失败**（`prisma/schema.prisma`）：`AnswerRecord.question` / `AnswerRecord.bank`、`SessionAnswer.question`、`ReviewItem.bank` 未声明 `onDelete`，默认 Restrict，有答题记录的题库无法删除（500 错误）。补全 `onDelete: Cascade`，新增迁移 `20260722000001_fix_fk_cascade`。
- **C-3 apply 无幂等保护**（`src/app/api/study/apply/route.ts`）：不校验是否刚调用过 grade，可跳过答题直接 apply 或重复 apply，间隔被指数级放大。新增基于 `lastReviewAt` 的 5 分钟幂等检查，重复 apply 返回当前状态并标记 `idempotent: true`。

### Fixed — High（数据正确性 / 性能 / 安全）

- **H-4 analytics N+1 查询**（`src/app/api/analytics/route.ts`）：连续天数计算最坏 365 次串行 `count` 查询。改为单次 `findMany` + 内存分桶到 `Set<string>`，查询数从 N+1 降到 1。
- **H-5 memoryCards 无 limit**（`src/app/api/analytics/route.ts`）：全表回传可能 OOM。加 `take: 5000` 上限。
- **H-7 IP 信任链安全**（`src/lib/client-ip.ts`）：`x-real-ip` / `x-forwarded-for` 可被客户端伪造。新增 `TRUSTED_PROXY_IPS` 环境变量白名单机制，仅当直连 IP 在白名单内才信任代理头；未配置时仅 dev 信任代理头，生产环境必须显式配置。
- **H-8 错题本 errorReason 丢弃**（`src/app/api/wrongbook/route.ts`）：PATCH 写入的 `errorReason` 没有落库。改为写入最近一条答错的 `AnswerRecord.errorReason`。
- **H-9 grade 重复计数**（`src/app/api/study/grade/route.ts`）：同一 `(sessionId, questionId)` 无唯一约束，重复 grade 导致 `totalQuestions` / `correctCount` 双倍计数。create 前先 `findFirst` 检查是否已存在，已存在则跳过计数。
- **H-3 timeSpentSec 越界**（`grade` + `apply`）：未限制范围，恶意请求可传超大值污染统计。clamp 到 `[0, 3600]`。
- **M-11 forgot-password 错误码**（`src/app/api/auth/forgot-password/route.ts`）：catch 块返回 400（客户端错误），实际是服务端异常。改为 500。

### Added — 部署与可观测

- **`Dockerfile`**：3 阶段构建（deps → builder → runner），`node:22-alpine`（pnpm 11 要求 Node ≥22.13），非 root 用户，`tini` 作 init，`HEALTHCHECK` 指向 `/api/health`，Next.js standalone 输出。
- **`docker-compose.yml`**：`db`（postgres:17-alpine）+ `app`（build from Dockerfile）+ 可选 `caddy`（自动 HTTPS 反代），含 healthcheck 和数据卷持久化。
- **`docker-entrypoint.sh`**：等 DB 可达（60s）→ `prisma migrate deploy` → `exec server`。
- **`src/app/api/health/route.ts`**：Docker / K8s 容器探活端点，GET → 200 `{status:"ok",db:"ok"}` 或 503 `{status:"degraded",db:"down"}`。
- **`Caddyfile.example`**：自动 HTTPS 反代 + CSP 安全头 + 静态资源缓存 + 访问日志。
- **`.dockerignore`**：排除 node_modules / .next / .git / tests / screenshots。
- **`.env.example` 更新**：新增 `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `APP_PORT` / `TRUSTED_PROXY_IPS` 等 Docker Compose 与安全相关变量。

### Fixed — Docker 构建（CI docker-build job 全绿）

- **`pnpm` 版本冲突**（`.github/workflows/ci.yml`）：`pnpm/action-setup@v4` 同时指定 `version` 与 `package.json` 的 `packageManager` 字段触发 `ERR_PNPM_BAD_PM_VERSION`。移除 action 的 `version` 参数，由 `packageManager` 字段驱动。
- **Node 20 → 22 升级**：pnpm 11.13.1 是纯 ESM，依赖 `node:sqlite` 内置模块，要求 Node ≥22.13。CI `node-version` 20→22；Dockerfile 3 阶段 `node:20-alpine`→`node:22-alpine`；`package.json` `engines` ≥20→≥22.13；README badge 同步。
- **`ERR_PNPM_IGNORED_BUILDS`**（`pnpm-workspace.yaml` + `Dockerfile`）：pnpm 11 `strictDepBuilds` 默认 true，未被 `allowBuilds` 放行的构建脚本会硬失败。`pnpm-workspace.yaml` 从 v10 的 `onlyBuiltDependencies`（已移除）改为 v11 的 `allowBuilds` 映射；Dockerfile deps 阶段补充 `COPY pnpm-workspace.yaml`。
- **Prisma COPY 路径错误**（`Dockerfile` runner 阶段）：pnpm 嵌套结构下 `node_modules/.prisma` / `@prisma` / `prisma` 不在根级，3 行 COPY 全部 `not found`。standalone 输出已含 `@prisma/client` 运行时 + 生成的 `.prisma/client`（经 Next.js 依赖追踪），移除冗余 COPY；`prisma` CLI 是 devDependency 不在 standalone 中，改为 runner 阶段 `npm install --global prisma@5.22.0`；entrypoint 由 `npx prisma` 改为直接 `prisma`；`apk add` 补 `netcat-openbsd`（entrypoint 的 `nc -z` DB 端口探测需要）。
- **构建时占位环境变量**（`Dockerfile` builder 阶段）：`next build` 静态分析读取 `DATABASE_URL` / `NEXTAUTH_URL` / `NEXTAUTH_SECRET`，缺失会告警。新增 `ARG` 占位变量，CI 可通过 `--build-arg` 覆盖。

### Added — 单元测试（49 个，CI 必跑）

- **`scripts/fsrs-test.ts`（19 个）**：Prisma 字符串 enum ↔ ts-fsrs 数字 State 双向转换、`dbRowToCard` / `cardToDbUpdate`、`gradeCard` 调度、`previewIntervals`、`formatInterval`、`scoreToRating` 映射。直接覆盖 C-1 修复点。
- **`scripts/grading-test.ts`（13 个）**：4 题型判分——单选 / 多选（漏选部分给分 + 错选 0 分）/ 判断（中英文布尔归一化）/ 填空（多空 + `|` 等价答案 + 全角转半角 + 折叠空白）。
- **`package.json` 新增脚本**：`test:grading` / `test:fsrs` / `test:unit`（= grading + fsrs + parser）。

### Changed — CI 加固

- **`.github/workflows/ci.yml`**：build job 新增 "Unit tests（判分 + FSRS + 解析器）"步骤（`pnpm test:unit`）；新增 `docker-build` job（仅 push to main 触发）验证 Dockerfile 可构建。
- **`README.md`**：新增 "Docker 一键部署" 段落 + "测试" 段落 + CI 策略说明；命令速查表补全 `test:unit` / `test:grading` / `test:fsrs` / `test:parser`；路线图新增 V1.4.1 段。

---

## V1.4.0 — 2026-07-22

### Added — 官方题库按需加载

- **`public/official-banks/` 静态题库目录**：4 个官方题库以 Markdown 文件随仓库分发（FSRS 与间隔重复入门 / 中国地理与人文常识 / 编程基础与 TypeScript / **Python 编程基础**），每库 20 题覆盖 4 题型。
- **`manifest.json` 索引**：前端 `fetch("/official-banks/manifest.json")` 获取题库元数据（名称 / 描述 / 封面色 / 标签 / 题数 / 每日新题 / 难度），无需后端。
- **`OfficialBanksDialog` 组件**：`/workshop` 顶部新增"官方题库"按钮，弹出对话框列出全部官方题库卡片。点击"加载"→ 拉取 Markdown → 构造 `File` → 复用 `POST /api/banks/import` 导入。不点不占数据库，零内存开销。
- **已加载标记**：已导入的官方题库在对话框中显示绿色"已加载"徽章，避免重复导入。
- **新增 Python 官方题库**：20 题（6 单选 + 5 多选 + 4 判断 + 5 填空），覆盖数据类型、控制流、函数、模块、面向对象、异常处理等核心概念。

### Changed — seed 精简化

- **`prisma/seed.ts` 不再自动插入题库**：V1.4 起 seed 只创建 demo 用户 + FSRS 默认参数。题库数据保留在文件内作为参考但不写入数据库，改为通过官方题库对话框按需加载。
- **清理遗留 seed 题库**：seed 自动删除 `sourceRef` 以 `seed-v1-` 开头的旧题库，确保从 V1.3 升级时数据库干净迁移。

### Added — E2E 测试覆盖

- **C2 测试组（5 项）**：官方题库按钮可见 / 对话框打开 / 列出 4 题库 / 加载 Python 题库 / 已加载标记。
- **`ensureBankLoaded` 辅助函数**：B/C/D/E 组测试前置，自动检测工坊是否有题库，无则加载第一个官方题库，等待成功反馈后验证列表刷新。

## V1.3.0 — 2026-07-21

### Added — 工坊题目内联编辑

- **`/workshop/[id]` 题目行新增"编辑"按钮**：点击切换到内联编辑模式，可改题型、题干、选项、答案、解析、知识点、难度（1-5 滑块）、收藏标记、启用/禁用。
- **`QuestionEditor` 组件**：4 题型分别处理——
  - 单选 / 多选：动态增删选项（2-8 个），勾选正确答案；多选支持多选
  - 判断：正确 / 错误两个按钮
  - 填空：单输入框，`||` 分隔多空，`|` 分隔可接受答案
- **切换题型时自动重置选项 / 答案**：避免不同题型间的数据形状不一致。
- **删除二次确认**：点击"删除"按钮先弹出"确认 / 取消"内联按钮，避免误操作；DELETE 走软删除（`isDisabled=true`），保留答题记录可追溯。
- **Toast 提示**：保存 / 删除 / 导出操作完成后右上角 Toast 反馈，3 秒自动消失。

### Added — 每库 FSRS 参数调优 UI

- **`/workshop/[id]` 顶部新增"FSRS"按钮**：点击展开 FSRS 参数调优面板，包含 4 项配置——
  - FSRS 调度开关（toggle，关闭后该库不参与调度）
  - 目标留存率（0.70-0.99 滑块，推荐 90%）
  - 每日新题数（1-500 输入框）
  - 每日复习上限（10-2000 输入框）
- **保存按钮**：调用 `PATCH /api/banks/:id` 持久化，仅对此题库生效（不影响用户全局默认）。
- **重置按钮**：恢复到题库当前 DB 值。

### Added — CSV / Anki 导出

- **`GET /api/banks/:id/export?format=csv`**：导出与 Excel 导入兼容的 CSV（表头 `type,stem,options,answer,explanation,difficulty,knowledge,source`），UTF-8 BOM 头确保 Excel 直接打开不乱码。文件名 `题库名-YYYYMMDD.csv`，URL 编码处理中文。
- **`GET /api/banks/:id/export?format=anki`**：导出 Anki 桌面端可直接导入的 TSV 文本，包含 `#separator:tab` / `#html:true` / `#tags column:3` / `#deck:题库名` 头部指令。每行 `front<TAB>back<TAB>tags`，正面是题干 + 选项，背面是答案 + 解析。文件名 `题库名-YYYYMMDD.txt`。
- **`/workshop/[id]` 顶部新增"CSV"和"Anki"两个导出按钮**：浏览器端 fetch + Blob + `<a download>` 触发下载，从 `Content-Disposition` 解析文件名。

### Added — 分析页 365 天热力图

- **`/analytics` 新增"连续答题热力图"面板**：GitHub 风格 365 天网格（53 列 × 7 行，周一为列起点），4 色阶（0 题 / 1-4 / 5-9 / 10-19 / 20+）映射黄铜透明度。
- **月份标签**：每列首日所在月份变化时在顶部标注 `X月`。
- **周标签**：左侧标 一 / 三 / 五（仅奇数行，避免密集）。
- **Tooltip**：每个格子悬停显示 `YYYY-MM-DD：N 题（M 对）`。
- **图例 + 统计**：底部显示 4 色阶图例和"共 N 题 / 活跃 M 天"汇总。
- **独立加载**：热力图始终加载 365 天数据，不随上方 `days` 选择器变化，避免 30 天视图下热力图稀疏。

### Changed

- `package.json` version `1.2.0` → `1.3.0`
- `README.md` 核心能力表格：造船工坊行加"题目内联编辑 + 每库 FSRS 调优 + CSV/Anki 导出"，航迹分析行加"365 天答题热力图"
- `README.md` 路线图：V1.2 段 4 项次功能全部标 `[x]`，新增 V1.3 段（标记为已完成）
- 修复 `workshop/[id]/page.tsx` 与 `workshop/page.tsx` 中 `useEffect` 内 `setState` 的 lint 警告（添加 `eslint-disable-next-line react-hooks/set-state-in-effect`）

---

## V1.2.0 — 2026-07-20

### Added — 记忆健康度（Retrievability）

- **`src/lib/fsrs.ts` 新增 `retrievability()` 函数**：基于 ts-fsrs `forgetting_curve` 实现 FSRS-6 衰退公式 `R(t,S) = (1 + factor · t/9S)^decay`，其中 `factor` / `decay` 由 `FSRS6_DEFAULT_W[20]` 推导。仅对 REVIEW / RELEARNING 状态的卡计算 R；NEW / LEARNING 因 stability 未稳定返回 `null`。
- **`/api/analytics` 新增 `memoryHealth` 字段**：包含平均 R、濒危卡数（R&lt;70%）、5 桶分布（危急 / 脆弱 / 尚可 / 稳固 / 鲜活）、未来 7 天到期预测。一次 `reviewItem.findMany` 同时算 R 和 forecast，避免 N 次 SQL。
- **`/analytics` 页新增"记忆健康度"面板**：左侧环形进度图显示平均 R（按区间映射颜色：≥90 emerald / ≥70 brass / ≥50 tide / 否则 coral），下方警示条提示濒危卡数；右侧 SVG 柱图显示未来 7 天到期数（今天=coral，未来=brass）。底部 5 桶横向柱图按桶色（coral / amber / tide / brass / emerald）显示分布。

### Added — 断点续答

- **`/study` 答题进度持久化**：在 `answering` / `submitted` phase 持续把 `{bankId, mode, items, stats, cursor, history, savedAt}` 写入 `localStorage[compass:study-resume-v1.2]`，每次 cursor / history 变化触发保存。
- **进入页面检测存档**：首次 mount 时读取 localStorage，若参数（bankId + mode）匹配且 cursor 未越界，进入 `resume-prompt` phase，展示存档元信息（总题数 / 已答 / 剩余 / 正确率 / 保存时间）+ "继续答题 / 放弃存档 · 重新开始"两个 CTA。用户选"继续"直接还原 state 进入 answering；选"放弃"清除存档并重新拉队列。
- **存档生命周期**：TTL 7 天，过期自动清除；答完本轮（phase 进入 completed）自动清除；参数不匹配自动清除。

### Added — 开源仓库自动化配套

- **`.github/workflows/ci.yml`**：最低程度 CI——push / PR to `main` 触发 `pnpm install --frozen-lockfile` → `db:generate` → `typecheck` → `lint` → `build`。无发布、无部署、无 artifact 上传。同分支新提交取消旧 run（`concurrency.cancel-in-progress`）。
- **`.github/dependabot.yml`**：显式 `updates: []`，关闭 Dependabot 自动版本更新 PR。依赖（含安全补丁）由 maintainer 手动评估后更新，理由记录在文件注释。
- **`.github/PULL_REQUEST_TEMPLATE.md`**：新增 "Maintainer Notes" 段，明示 auto-merge 禁用、依赖手动管理、CI 门禁三项规则。
- **`CONTRIBUTING.md`**：新增 "Repository Automation Policy" 段，说明 CI only / No Dependabot / No auto-merge / No bots 四项原则。

### Changed

- `package.json` version `1.1.0` → `1.2.0`
- `README.md` 核心能力表格：答题舱行加"断点续答（localStorage 7 天）"，航迹分析行加"记忆健康度（Retrievability 环形图 + 5 桶分布 + 7 天到期预测）"
- `README.md` 路线图：V1.2 标题改为"记忆健康度与断点续答（已完成）"，3 项主功能标 `[x]`，剩余 4 项次功能保留 `[ ]`

---

## V1.1.0 — 2026-07-20

### Added — 内容与引导

- **种子题库扩容**：从 12 题扩到 60 题，拆成 3 个独立题库——`FSRS 与间隔重复入门`（20 题）/ `中国地理与人文常识`（20 题）/ `编程基础与 TypeScript`（20 题）。每库均覆盖 6 单选 + 5 多选 + 4 判断 + 5 填空，便于一站式验收 4 题型判分。Seed 通过 `sourceRef: seed-v1-*` 前缀做幂等清理，重复执行不会产生重复数据。
- **首次进入欢迎引导卡**（`/compass`）：基于 `localStorage[compass:onboarding-v1.1-dismissed]` 标记关闭，展示 FSRS-6 卖点 + 3 个 CTA（立即开始答题 / 创建导入题库 / 稍后再说）。
- **题库舰队卡片升级**：新增 `description`（line-clamp-2）、`tags`（最多 3 个）、进度条（`(questionCount - dueCount) / questionCount`），让首页一眼看清每个题库的进度。
- **完成报告升级为学习画像**（`/study` 答完队列后）：从原来的 3 个统计数字升级为完整学习画像，包含——
  - 学习画像标签：基于正确率（≥90 记忆稳固 / ≥70 稳步掌握 / ≥50 基础待固 / <50 起步阶段）+ 评分分布（自信作答 / 需要重练）
  - 题型掌握度：每种题型的正确率进度条，绿/黄/红三色
  - FSRS 评分分布：AGAIN / HARD / GOOD / EASY 四键分布柱图
  - 薄弱知识点 TOP3：从错题的 knowledgePoints 按频次排序
  - 漏选提示：多选漏选时解释 `0.5 + ratio*0.5` 判分规则
  - 规则化下一步建议：基于错题数 / 薄弱知识点 / AGAIN 数动态生成
  - 4 个操作按钮：再来一轮 / 错题漂流瓶(含计数) / 查看航迹分析 / 返回罗盘
- **API 烟雾测试脚本**（`scripts/api-test.ts`）：覆盖未登录拦截、NextAuth credentials 登录、题库 CRUD、两阶段提交、错题本、日志、分析共 7 组测试。

### Added — 视觉

- **LOGO 嵌入导航品牌区**：`AppShell` 桌面侧栏 + 移动端顶栏均替换为 `/logo.svg`，并加上"刷题罗盘"副标题。品牌区可点击回 `/compass`。

### Fixed — 关键 bug

- **`/api/study/apply` 500 错误**：`ReviewLog.rating` 字段是 Prisma 字符串 enum（`AGAIN` / `HARD` / `GOOD` / `EASY`），但代码把 ts-fsrs 的数字 `Rating`（1-4）直接 `as unknown as PrismaRating` 强转，运行时 Prisma 校验失败。新增 `GRADE_TO_PRISMA_RATING` 数字→字符串映射表修复。
- **错题本漏掉 AGAIN 答错的新卡**：原先 `wrongbook` / `analytics.wrongCount` / `WRONG_REDO` 队列都只过滤 `lapses > 0`，但 FSRS 对 NEW / LEARNING 卡答错（AGAIN）不计 lapse（lapse 只在 REVIEW → RELEARNING 时 +1），导致首次答错的题不进错题本。改为 `OR: [{ lapses: { gt: 0 } }, { lastErrorAt: { not: null } }]`，apply 阶段 AGAIN 评分也写 `lastErrorAt` / `firstErrorAt`，三类查询全部联动修复。
- **`prisma/seed.ts` 解析错误**：8 处中文文本里的 `"五岳"` / `"世界屋脊"` / `"123"` 等嵌套直引号导致 ESLint parser 报 `',' expected`。统一替换为中文弯引号 `""`，符合中文排版习惯。

### Changed

- `package.json` version `1.0.0` → `1.1.0`
- `public/manifest.json` 标题与描述更新为"刷题罗盘"
- `src/app/layout.tsx` 标题改为 `Compass · 刷题罗盘`，themeColor 改为 `#0a0f14`，新增 apple-icon
- `README.md` 种子描述从"12 道"更新为"60 道 × 3 题库"，V1.1 路线图标记为已完成，新增 V1.2 段落

---

## V1.0.0 — 2026-07-20

### Major Product Pivot

Compass has been refocused from a goal-management tool into a **spaced-repetition quiz workbench** built around the FSRS-6 algorithm. All previous goal/habit/calendar/focus modules have been removed. The codebase now ships a single, focused practice tool.

### Added — Quiz Core

- **FSRS-6 Scheduling** (`src/lib/fsrs.ts`): wrapper around `ts-fsrs` with 21 default weights, 1m→10m learning steps, 10m relearning step, 0.9 target retention. Exports `gradeCard`, `previewIntervals`, `scoreToRating`, `formatInterval`.
- **Unified Grading** (`src/lib/quiz/grading.ts`): 4 question types (single / multi / true-false / fill-blank). Multi-choice partial scoring: full match → 1.0, missing → `0.5 + ratio*0.5` (max 0.99), wrong → 0. Fill-blank normalization: trim + lowercase + full→half width + `\|`-separated alternatives.
- **Daily Queue Builder** (`src/lib/quiz/scheduler.ts`): 3 modes — LEARN (due + new), REVIEW_ONLY, WRONG_REDO. Per-bank `newCardsPerDay` cap.

### Added — API

- `POST /api/study/grade` — grade-only endpoint (writes `AnswerRecord`, no FSRS)
- `POST /api/study/apply` — applies FSRS scheduling based on user-chosen rating (writes `ReviewLog`, updates `ReviewItem`)
- `GET /api/study/queue` — daily queue with hidden answers
- `POST /api/banks/import` — multipart file upload + parse + create bank
- `GET/PATCH /api/wrongbook` — drift-bottle of lapsed cards
- `GET /api/logbook` — answer history timeline
- `GET /api/analytics` — streak, accuracy, trend, type stats, weak points

### Added — Import Parsers (`src/lib/quiz/import/`)

- **Markdown parser** — `---` block separator, `## 题型` headers, `A.` options, `答案：` labels
- **Excel/CSV parser** — header-based column mapping (type/stem/options/answer/explanation/difficulty/knowledge/source) with fallback to fixed order
- **Word parser** — uses mammoth to extract text, then routes through Markdown or plain-style parser

### Added — UI Pages

- `/compass` — today overview + bank fleet grid
- `/study` — quiz cabin with 4 question types, 4-key rating bar (hotkeys 1-4), per-key interval preview, completion report
- `/workshop` + `/workshop/[id]` — bank CRUD, drag-drop import dialog, paginated question list
- `/wrongbook` — drift-bottle of lapsed cards with expand-to-reveal
- `/logbook` — answer timeline grouped by day with bank filter
- `/analytics` — streak/accuracy/state distribution + SVG trend chart + per-type accuracy + weak knowledge points TOP10
- `/account` — profile + theme switcher (deep-sea / parchment) + FSRS parameter preview

### Added — Design System

- 4 feedback color tokens: `f-emerald` (#10b981), `f-azure` (#38bdf8), `f-amber` (#f59e0b), `f-coral2` (#ef4444)
- Parchment theme variables fully wired
- Custom scrollbar, brass glow, compass grid utilities in `globals.css`

### Removed

- All legacy modules: `dashboard`, `goals`, `calendar`, `inbox`, `voyage`, `focus`, `habits`
- Legacy API routes: `/api/calendar`, `/api/focus/*`, `/api/goals/*`, `/api/tasks/*`, `/api/habits/*`, `/api/logs/*`, `/api/reports/*`, `/api/inbox/*`, `/api/reviews/*`
- Old Prisma migrations (`0_init` through `4_add_indexes`) — superseded by new schema
- Old `prisma/seed.ts` (replaced with quiz-focused seed)
- Legacy components: `calendar/`, `goals/`, `inbox/`, `workshop/` (habit workshop, replaced by quiz workshop)

### Changed

- `prisma/schema.prisma` rewritten with 12 quiz-focused models (`QuestionBank`, `Question`, `ReviewItem`, `ReviewLog`, `AnswerRecord`, `QuizSession`, `SessionAnswer`, `FsrsParams`, `LearningPlan`, `AgentGenerationTask`, `Notification`, `WeeklyReview`)
- `src/proxy.ts` (NextAuth middleware) updated to protect new quiz routes
- `src/app/(main)/layout.tsx` and `AppShell.tsx` navigation updated to 7 quiz-themed items (compass / study / workshop / wrongbook / logbook / analytics / account)
- `src/app/login/page.tsx` and `register/page.tsx` redirects updated from `/dashboard` to `/compass`
- `src/app/not-found.tsx` fixed: named import + redirect to `/compass`
- `package.json` description and keywords updated for spaced-repetition focus
- `README.md` rewritten for V1 quiz product (Chinese, with badges + Mermaid flowchart + LOGO)

---

## Unreleased (legacy — pre-pivot)

### Phase 1 — Foundation

- **PWA Support**: Offline-capable with service worker cache strategy, installable on desktop and mobile. Custom compass icons at 192px and 512px.
- **Inbox (Drift Bottle)**: Quick-capture panel activated via Ctrl+B with 3-second auto-dismiss. Bottle metaphor for unsorted thoughts. Archive and convert workflows. Dedicated `InboxItem` data model with full CRUD API.
- **Tidal Tasks (Recurrence)**: iCalendar-style recurrence engine supporting daily/weekly/monthly rules with interval, day-of-week, day-of-month, and end conditions (never/count/until). Preset templates for common patterns. Human-readable rule preview. `RecurrenceRule` stored in `Task` model.
- **Calendar Drag-and-Drop**: Time-blocking via @dnd-kit with `DayView` (24-hour grid), `TimeBlock` (draggable task cards), and `UnscheduledPanel` (200px left-side task pool). Unschedule endpoint at `/api/calendar?unscheduled=true`.
- **Flexible Habit Cadence**: `Habit.cadence` migrated from enum to JSON. `HabitCadenceConfig` supports daily (days-per-week), weekly (times-per-week), and custom modes. Backward-compatible deserialization of legacy enum values.
- **Mobile Navigation**: `MobileBottomNav` with four-tab layout (Compass, Workshop, Logbook, Dashboard), safe-area inset padding, 48px touch targets, and `usePathname` active-state highlighting.
- **Animation Library**: `driftBottleEnter`, `bottleFloat`, `calendarDropRipple`, `taskSnapToCell` variant additions to `src/lib/animations.ts`.
- **PWA Icons**: Custom four-direction compass pointer icons at 192×192 and 512×512 in the project palette (brass, tide, coral, ivory).
