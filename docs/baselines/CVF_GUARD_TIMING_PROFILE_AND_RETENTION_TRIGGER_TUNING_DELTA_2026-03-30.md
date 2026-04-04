# CVF Guard Timing Profile And Retention Trigger Tuning Delta — 2026-03-30
Memory class: SUMMARY_RECORD

> Scope: profile the local `pre-push` governance chain, rank the heaviest guards by cost/value, and tighten retention-scan triggers so future pushes only pay full dynamic scan cost when retention truth can actually drift

## Timing Profile

Measured on the active local `pre-push` chain before this tuning round:

| Rank | Guard | Time |
|---|---|---:|
| 1 | `review retention registry compatibility` | `97.574s` |
| 2 | `audit retention registry compatibility` | `34.221s` |
| 3 | `governed file size compatibility` | `0.692s` |
| 4 | `progress tracker sync compatibility` | `0.594s` |
| 5 | `foundational guard surfaces compatibility` | `0.415s` |

All remaining guards were below `0.4s`.

## Value Ranking

- `review retention registry`: high governance value, but too broad in its trigger surface before this round
- `audit retention registry`: medium-high governance value, same trigger-breadth problem
- `governed file size`: medium value, already fast enough
- `progress tracker sync`: high value, already fast enough
- `foundational guard surfaces`: high value, already fast enough

Conclusion:

- there were no remaining `heavy + low-value` guards after the first incremental pass
- the only meaningful optimization target was still the retention pair because they were `heavy + high-value but over-triggered`

## Trigger Tuning

Updated:

- `governance/compat/check_review_retention_registry.py`
- `governance/compat/check_audit_retention_registry.py`
- corresponding regression tests

New rule:

- full dynamic retention scan remains mandatory when the changed set touches the governed retention surface directly:
  - `docs/reviews/` or `docs/audits/`
  - retention registries
  - active window registry
  - retention guard code itself
  - archive engine code
- for broader docs surfaces such as `docs/reference/`, `docs/roadmaps/`, `docs/baselines/`, `AGENT_HANDOFF.md`, `docs/INDEX.md`, and `docs/CVF_CORE_KNOWLEDGE_BASE.md`, the guards now look for actual diff-level mentions of `docs/reviews/` or `docs/audits/` before escalating to full scan
- synthetic/unit-test paths without a real git range still fall back to current-file content so the guard remains testable and fail-closed

## Result

- ordinary code-only pushes now short-circuit the retention guards instead of paying a 30–100 second scan penalty
- documentation/governance pushes that do not actually touch review/audit retention truth should also skip the expensive dynamic rebuild
- batches that modify retention truth, retention registries, or the retention/archiving logic still run the full scan intentionally

## Verification

- `python governance/compat/test_check_review_retention_registry.py`
- `python governance/compat/test_check_audit_retention_registry.py`
- `python governance/compat/check_review_retention_registry.py --enforce`
- `python governance/compat/check_audit_retention_registry.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
