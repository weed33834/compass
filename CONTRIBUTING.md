# Contributing to Compass

Thank you for considering a contribution. This document outlines the process for proposing changes, reporting issues, and submitting pull requests.

## Code of Conduct

All participants must adhere to the [Code of Conduct](CODE_OF_CONDUCT.md). Harassment or disrespectful behavior will not be tolerated.

## Reporting Bugs

Before opening an issue, search [existing issues](https://gitcode.com/badhope/compass/issues) to avoid duplicates. When filing a bug report, include:

- Steps to reproduce the issue
- Expected versus actual behavior
- Compass version (or commit hash) and environment details (OS, Node.js version, PostgreSQL version)
- Screenshots or error logs when applicable

Use the **Bug Report** issue template.

## Proposing Features

Feature requests should be scoped and actionable. Open a **Feature Request** issue and describe:

- The problem the feature solves
- How you envision it working
- Any prior art or references in other tools

For large features, consider opening a discussion before writing code. The maintainer will review the proposal and discuss feasibility and scope.

## Development Workflow

### Setup

```bash
git clone https://gitcode.com/badhope/compass.git
cd compass
pnpm install
cp .env.example .env
# Configure DATABASE_URL and NEXTAUTH_SECRET
pnpm db:generate && pnpm db:migrate
pnpm db:seed
pnpm dev
```

### Branching

- `main` is the stable branch. All PRs target `main`.
- Create feature branches from `main`: `feat/short-description` or `fix/short-description`.
- Keep branches focused. One concern per branch.

### Before Submitting

1. Run `pnpm typecheck` — must pass with zero errors.
2. Run `pnpm lint` — must pass with zero errors (warnings are accepted for pre-existing patterns documented in `eslint.config.mjs`, but new code should not add warnings).
3. Run `pnpm test:unit` — all unit tests must pass.
4. If you modified the database schema, run `pnpm db:generate` and commit the generated Prisma client code.
5. If you added new functionality, consider adding test coverage.
6. Rebase onto the latest `main` before opening a PR.

### Commit Style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): description
fix(scope): description
docs(scope): description
refactor(scope): description
chore(scope): description
```

## Pull Request Process

1. Open a PR against `main` with a clear title and description.
2. Reference any related issues using `Closes #123` or `Refs #123`.
3. CI must pass (`pnpm typecheck`, `pnpm lint`, `pnpm build`). See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
4. The maintainer will review within 3–5 business days.
5. Address review feedback by pushing additional commits to the same branch.
6. Once approved, the maintainer will squash-merge.

### Repository Automation Policy

This repository intentionally keeps automation to a minimum:

- **CI only** — One workflow ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs `typecheck` + `lint` + `build` on every push/PR to `main`. No deploy, no release, no artifact upload.
- **No Dependabot / Renovate** — All dependency updates (including security patches) are evaluated and applied manually by the maintainer. See [`.github/dependabot.yml`](.github/dependabot.yml).
- **No auto-merge** — Every PR is merged manually after review. Do not enable GitHub's auto-merge feature on your fork.
- **No bots** — No welcome bots, stale bots, or auto-labeling bots are configured.

If you fork this repo and want to enable any of the above, you're free to do so in your fork—but keep the upstream clean.

## Style Conventions

- **TypeScript**: Strict mode. All function signatures include explicit return types where non-obvious.
- **Components**: Prefer server components; use `"use client"` sparingly and only when interactivity is required.
- **Styling**: Tailwind utility classes only. No custom CSS files. Use design tokens (`abyss`, `ivory`, `brass`, `coral`, `starlight`, `tide`, and the 4 feedback colors `f-emerald` / `f-azure` / `f-amber` / `f-coral2`).
- **API Routes**: Validate inputs. Return consistent error shapes: `{ error: string }`. Use `requireApiUser` + `assertRateLimit` from `src/lib/api.ts`.
- **Quiz Logic**: All grading flows through `src/lib/quiz/grading.ts`. All FSRS scheduling flows through `src/lib/fsrs.ts`. Never call `ts-fsrs` directly from a route handler.
- **Two-Phase Submit**: New answer flows must use `/api/study/grade` (judge + write AnswerRecord, no FSRS) followed by `/api/study/apply` (apply FSRS + write ReviewLog). Do not combine them—the split avoids double-applying FSRS scheduling when the user overrides the auto-mapped rating.
- **Import Parsers**: New file formats belong in `src/lib/quiz/import/`. Output the shared `ParsedQuestion[]` shape from `index.ts`; never write to the database directly from a parser.
- **Naming**: PascalCase for components, camelCase for functions and variables, kebab-case for files.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
