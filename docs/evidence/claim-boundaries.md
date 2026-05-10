# Claim Boundaries

CVF public claims are intentionally underclaimed.

Allowed:

- CVF is designed to be a provider-agnostic AI governance gateway/control
  plane. Current public provider claims remain lane-specific.
- The public repo includes a buildable web control surface.
- Release-quality governance proof requires live provider calls.
- Alibaba/DashScope is the active live proof lane when configured.
- DeepSeek has confirmatory evidence, not parity certification.
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

Not allowed without new evidence:

- all providers have equal quality
- all agent frameworks are certified
- CVF has a public QBS quality score
- QBS-1 planning documents are scored benchmark evidence
- QBS-1 calibration pilot evidence proves powered QBS quality levels
- QBS-1 scored-run readiness packet proves a public QBS quality score
- QBS-1 pre-registration proves scored benchmark results
- QBS-1 failed powered execution proves L4/L5/L6 quality claims
- QBS-6 remediation changes the QBS-5 failed result
- QBS-7 pre-registration proves scored rerun results
- web proves the entire CVF runtime
- mock tests prove governance behavior
- public docs include the full internal operating history
