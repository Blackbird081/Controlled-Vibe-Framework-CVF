<!-- Memory class: FULL_RECORD -->
# Public Dependency Audit Triage

Date: 2026-05-22

Status: CLOSED - audit clean after bounded dependency updates

## Purpose

Close the dependency-audit residual discovered during the public developer
onboarding proof. The goal is to keep the public local-first web setup credible
for agent and developer readers without changing CVF runtime behavior or live
provider claims.

## Scope

In scope:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package.json`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package-lock.json`
- npm audit posture for the public web package
- non-live static CI proof

Out of scope:

- live provider behavior
- hosted workflow freshness
- broad dependency modernization
- Next canary adoption
- `next-auth` API migration
- runtime/governance semantics

## Baseline

The P1 onboarding proof passed install/check/static gate but recorded npm audit
residuals:

- 4 moderate
- 7 high
- 1 critical

## Change

Applied bounded package updates through npm:

- `next`: `16.1.6` -> `16.2.6`
- `eslint-config-next`: `16.1.6` -> `16.2.6`
- `jspdf`: lockfile resolved from `4.1.0` to `4.2.1`
- transitive audit fixes for `ajv`, `brace-expansion`, `dompurify`,
  `flatted`, `minimatch`, `picomatch`, `rollup`, `undici`, `vite`, and
  related optional packages
- npm override: `postcss` -> `8.5.15`

The `postcss` override is retained because `next@16.2.6` still declares a
bundled `postcss@8.4.31`, while npm audit flags `postcss <8.5.10`. The
override keeps the public dependency tree clean without using `npm audit fix
--force` or downgrading Next.

## Verification

Commands run from the public-sync clone:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm audit --json
npm ls postcss next next-auth --depth=2
npm run check
cd ../../..
python scripts/run_cvf_static_ci_gate.py --json
```

Results:

| Check | Result |
|---|---|
| `npm audit --json` | PASS, 0 vulnerabilities |
| `npm ls postcss next next-auth --depth=2` | PASS, `next@16.2.6`, `postcss@8.5.15` deduped/overridden |
| `npm run check` | PASS |
| `python scripts/run_cvf_static_ci_gate.py --json` | PASS, 7/7 |

Static gate checks:

| Static gate item | Result |
|---|---|
| Public surface guard | PASS |
| Workflow orchestration guard | PASS |
| Web build | PASS |
| Web TypeScript check | PASS |
| Secrets scan | PASS |
| Docs governance compatibility | PASS |
| Static governance/unit tests | PASS, 44/44 |

## Decision

The public dependency-audit residual is closed for the current public web
package. No `npm audit fix --force` was used.

## Claim Boundary

This packet claims only that the public web package's current npm audit posture
is clean after bounded dependency updates and static verification. It does not
claim live provider behavior, hosted release readiness, dependency freshness
across every extension, or broader security certification.
