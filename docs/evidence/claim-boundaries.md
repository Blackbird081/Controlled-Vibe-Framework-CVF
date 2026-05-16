# Claim Boundaries

Memory class: FULL_RECORD

Status: CURRENT PUBLIC CLAIM BOUNDARY

CVF public claims are intentionally underclaimed.

## Purpose

Define what public CVF claims are allowed and which claims require new evidence
before they can be made.

## Scope

This file governs public-facing claim language for the current repository. It
does not replace the evidence summaries or benchmark methodology that support
individual claims.

## Source

Predecessor evidence anchors:

- `docs/evidence/current-cvf-quality-status.md`
- `docs/evidence/latest-release-gate.md`
- `docs/evidence/provider-lanes.md`
- `docs/benchmark/quality-benchmark-suite-methodology.md`
- `docs/benchmark/qbs-1/` planning material

## Decision

Treated as the authoritative public claim-boundary reference. Public-facing
documents, READMEs, and external communication must use the allowed claims
verbatim where they apply. Adding a claim to the allowed list requires fresh
evidence under `docs/evidence/` or a new benchmark run.

## Evidence

Each allowed claim below cites the public evidence file that supports it.
Each not-allowed claim is blocked until a new evidence artifact unlocks it.

## Claim Boundary

Only claims listed as allowed below may be used as public posture. The
not-allowed list remains blocked until fresh public evidence changes it.

Allowed:

- CVF is designed to be a provider-agnostic AI governance gateway/control
  plane. Current public provider claims remain lane-specific.
- The public repo includes a buildable web control surface.
- Release-quality governance proof requires live provider calls.
- Alibaba/DashScope is the active live proof lane when configured.
- DeepSeek has confirmatory evidence, not parity certification.
- Current CVF quality status may be cited as a bounded local-first baseline:
  governance/audit/safety remain strong, non-coder deliverable contracts are
  hardened, and output-quality parity is not proven. See
  `docs/evidence/current-cvf-quality-status.md`.
- CVF 16.5 runtime absorption may be cited as deterministic local contract
  coverage for provider/model gateway behavior, controlled memory, knowledge
  intake, agent delegation, tool tracing, MCP business actions, artifact
  rendering, OpenSpec change packets, observe-only runtime signals, and
  proposal-only skill evolution. See
  `docs/evidence/cvf-16-5-runtime-absorption.md`.
- QBS methodology is public under `docs/benchmark/`, but no public QBS quality
  score is claimed until a powered run is published.
- QBS-1 runner/corpus planning is public, but scored QBS runs require a
  run-specific `qbs/preregister/<run-id>` tag.
- QBS-1 calibration pilot evidence may be cited as runner/harness proof only,
  with public status `CALIBRATION_DIRECTIONAL_NO_QBS_SCORE`.
- QBS-1 scored-run readiness packet may be cited as aggregate-only
  `POWERED_SINGLE_PROVIDER` preparation, not as scored benchmark evidence.
- QBS-1 pre-registration may be cited as a frozen plan for a future scored run,
  not as execution evidence.
- QBS-1 Alibaba powered execution may be cited as a failed/no-score hard-gate
  result, not as a quality score.
- QBS-6 remediation may be cited as bounded hard-gate remediation and rerun
  planning, not as a rerun result.
- QBS-7 rerun pre-registration may be cited as a frozen R2 rerun plan with the
  F7 front-door clarification entrypoint, not as rerun execution evidence.
- QBS-8 R3 pre-registration may be cited as the live rerun target after bounded
  F7 router hardening, not as a QBS score before execution artifacts and
  reviewer scoring exist.
- QBS-8 R4 powered execution may be cited as hard-gate-passing
  `POWERED_SINGLE_PROVIDER` execution evidence for Alibaba/DashScope
  `qwen-turbo`, still pending reviewer scoring and agreement.
- QBS-9 R5 reviewer scoring may be cited as model-assisted reviewer scoring
  with reviewer agreement passed and no public QBS claim because `CFG-B` did
  not meet the L4 quality-uplift threshold versus `CFG-A1`.

Not allowed without new evidence:

- all providers have equal quality
- CVF has output-quality parity with direct provider output
- CVF improves output quality across EVT-4
- focused small-sample checks prove broad metric superiority
- the EVT4-03 output-validation failure root cause is fixed
- all agent frameworks are certified
- CVF has a public QBS quality score
- QBS-1 planning documents are scored benchmark evidence
- QBS-1 calibration pilot evidence proves powered QBS quality levels
- QBS-1 scored-run readiness packet proves a public QBS quality score
- QBS-1 pre-registration proves scored benchmark results
- QBS-1 failed powered execution proves L4/L5/L6 quality claims
- QBS-6 remediation changes the QBS-5 failed result
- QBS-7 pre-registration proves scored rerun results
- QBS-8 pre-registration alone proves scored rerun results
- QBS-8 hard-gate-passing execution alone proves a public QBS score, L4/L5/L6,
  family-level claims, or provider parity
- QBS-9 reviewer agreement alone proves a QBS quality uplift when the measured
  `CFG-B` quality delta is negative
- CVF 16.5 deterministic contracts prove live provider governance behavior
- `cvf-web` directly exposes every CVF 16.5 runtime contract
- document artifact rendering creates new audit evidence by itself
- governed skill evolution self-writes production skills without review gates
- web proves the entire CVF runtime
- mock tests prove governance behavior
- public docs include the full internal operating history
