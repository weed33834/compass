# Security Policy

## Supported Versions

Only the latest release on the `main` branch receives security updates. We do not maintain backport branches for older versions.

| Version | Supported |
|---|---|
| main (latest commit) | Yes |
| All previous releases | No |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, report them privately via email. The maintainer will acknowledge receipt within 48 hours and provide a timeline for a fix.

### What to Include

- A clear description of the vulnerability and its impact
- Steps to reproduce, including environment details
- Any proof-of-concept code or screenshots
- Your assessment of severity

### Process

1. You submit a report via the private channel.
2. The maintainer acknowledges receipt within 48 hours.
3. The maintainer investigates and confirms the vulnerability.
4. A fix is developed and tested privately.
5. A security advisory is published alongside the patch release.
6. You will be credited in the advisory (unless you prefer to remain anonymous).

## Scope

Security vulnerabilities in the following areas are in scope:

- Authentication and session management
- Authorization and access control
- Database query injection (SQL, NoSQL)
- Cross-site scripting (XSS) and content injection
- Sensitive data exposure
- Server-side request forgery (SSRF)
- Dependency vulnerabilities with known CVEs (critical/high severity)

Out of scope:

- Vulnerabilities in third-party dependencies that have already been publicly disclosed and patched upstream
- Issues requiring physical access to the host machine
- Social engineering attacks
- Denial of service that does not cause data loss or corruption

## Dependencies

Compass uses Renovate-style dependency management. All dependencies are kept current within the constraints of the lockfile. If you discover a vulnerability in a transitive dependency, please report it—we will update the dependency tree and release a patch.

## Disclosure Policy

We follow a coordinated disclosure model. Once a fix is ready, we will:

1. Publish a GitHub Security Advisory.
2. Release a new version containing the fix.
3. Credit the reporter in the advisory and changelog.

We request that reporters allow up to 30 days for a fix before publicly disclosing the vulnerability.
