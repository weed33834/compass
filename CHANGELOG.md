# Changelog

All notable changes to Compass are documented in this file. This project adheres to [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

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
