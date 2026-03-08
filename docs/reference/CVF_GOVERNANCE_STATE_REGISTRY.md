# CVF Governance State Registry

Status: canonical runtime governance snapshot exported from authoritative CVF records.

## Purpose

- provide one machine-readable governance state artifact for runtime consumers
- reduce repeated ad hoc parsing of `CVF_AGENT_REGISTRY.md` and `CVF_SELF_UAT_DECISION_LOG.md`
- advance `W1` toward a shared governance state source across extensions

## Canonical Artifact

- JSON snapshot: `docs/reference/CVF_GOVERNANCE_STATE_REGISTRY.json`

## Source Records

- `governance/toolkit/03_CONTROL/CVF_AGENT_REGISTRY.md`
- `governance/toolkit/04_TESTING/CVF_SELF_UAT_DECISION_LOG.md`

## Export Command

```bash
python scripts/export_cvf_governance_state_registry.py --output docs/reference/CVF_GOVERNANCE_STATE_REGISTRY.json
```

## Consumer Rule

- runtime consumers should prefer the exported registry JSON
- direct markdown parsing is fallback-only for local resilience
- any batch that materially changes agent registry or Self-UAT state should regenerate this artifact
- if canonical source records still contain template-only content, the exported registry may legitimately have `agentCount = 0`
