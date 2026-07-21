## Summary

<!-- A concise description of what this PR does and why. -->

## Related Issues

<!-- Link related issues using `Closes #123` or `Refs #123`. -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactor (no functional change)
- [ ] Performance improvement
- [ ] Dependency update

## Checklist

- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] Database migrations generated if schema changed (`pnpm db:generate`)
- [ ] Rebased onto the latest `main` branch
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)

## Screenshots

<!-- If the change affects the UI, include before/after screenshots. -->

## Testing

<!-- Describe how you verified the change works correctly. -->

---

## Maintainer Notes

- **Auto-merge is disabled.** All PRs are merged manually by the maintainer after review.
- **Dependency updates are managed manually.** Do not enable Dependabot or other bots on this fork—see [`.github/dependabot.yml`](.github/dependabot.yml).
- **CI gates:** PR must pass `pnpm typecheck`, `pnpm lint`, and `pnpm build` before merge (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).
