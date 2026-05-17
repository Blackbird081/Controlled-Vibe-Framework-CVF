# CVF Live Evidence Publication Packet

Memory class: POINTER_RECORD

> Date: 2026-04-21
> Scope: current public-safe evidence for CVF effectiveness claims
> Roadmap: `docs/roadmaps/CVF_W111_T1_LIVE_EVIDENCE_PUBLICATION_ROADMAP_2026-04-21.md`

---

## Current Publication Claim

CVF has live evidence that it can govern real AI/agent behavior for non-coders and preserve that governance posture across more than one provider lane.

Public-safe wording:

> CVF helps non-coders use AI through a governed path that is safer, clearer, and more auditable than unguided prompting. Alibaba and DeepSeek are certified provider lanes; provider speed, cost, strength, and reliability remain provider-specific tradeoffs chosen by the user.

---

## Evidence Summary

| Claim | Current status | Evidence |
| --- | --- | --- |
| Non-coder governed path uses real AI | PROVEN | Live Playwright governance specs through `/api/execute` |
| Release gate requires live governance proof | PROVEN | `scripts/run_cvf_release_gate_bundle.py --json` runs live governance E2E by default and fails without `DASHSCOPE_API_KEY` |
| Alibaba lane certified | PROVEN | `docs/audits/alibaba-canary/INDEX.md`, latest receipt `RECEIPT_20260421-072551-422037.json`, `6/6` pass, `3` consecutive passes |
| DeepSeek lane certified | PROVEN | `docs/audits/deepseek-canary/INDEX.md`, latest receipt `RECEIPT_20260421-114125-19515e.json`, `6/6` pass, `3` consecutive passes |
| Mock is UI-only | ENFORCED | `AGENTS.md`, `AGENT_HANDOFF.md`, `README.md`, known limitations register, release gate script |

---

## Latest Release Gate Result

Local run on 2026-04-21:

```text
python scripts/run_cvf_release_gate_bundle.py --json

gate_result: PASS
Web build: PASS
TypeScript check (guard contract): PASS
Provider readiness: PASS, CERTIFIED lanes: 2
Secrets scan: PASS
Docs governance: PASS
E2E Playwright UI (mock): PASS, 6 passed
E2E Playwright Governance (live): PASS, 7 passed
```

The live governance row uses a real Alibaba `qwen-turbo` call. The UI mock row is retained only for UI structure coverage.

---

## Provider Certification Snapshot

`python scripts/check_cvf_provider_release_readiness.py --json` reports:

| Provider | Model | Status | Latest result | Consecutive passes |
| --- | --- | --- | --- | --- |
| Alibaba | `qwen-turbo` | CERTIFIED | `6/6` | `3` |
| DeepSeek | `deepseek-chat` | CERTIFIED | `6/6` | `3` |

The certification proves CVF-governed operability, not provider parity.

---

## Mock Boundary

Mock mode may be used for:

- navigation and routing;
- static badge rendering;
- layout and visual structure;
- RBAC pages without AI execution.

Mock mode may not be used for:

- risk classification claims;
- approval/phase gate claims;
- DLP or bypass detection claims;
- output validation claims;
- audit trail claims;
- any claim that CVF controlled real AI/agent behavior.

---

## Required Commands Before Publication

```bash
python scripts/run_cvf_release_gate_bundle.py --json
python scripts/check_cvf_provider_release_readiness.py --json
```

For a demo machine, also run:

```bash
python scripts/check_cvf_demo_preconditions.py
```

All commands must be run without printing or committing raw API key values.

---

## What CVF Must Not Claim

- Provider parity across speed, cost, quality, reliability, or latency.
- Universal provider/model support beyond certified lanes.
- Production SaaS deployment readiness.
- Governance proof from mock-only tests.

---

## Primary Pointers

- Agent instructions: `AGENTS.md`
- Handoff policy: `AGENT_HANDOFF.md`
- Release gate script: `scripts/run_cvf_release_gate_bundle.py`
- Known limitations: `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md`
- Release candidate truth packet: `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md`
- Provider readiness matrix: `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md`
