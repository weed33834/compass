# Changelog

All notable changes to Compass are documented in this file. This project adheres to [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

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
