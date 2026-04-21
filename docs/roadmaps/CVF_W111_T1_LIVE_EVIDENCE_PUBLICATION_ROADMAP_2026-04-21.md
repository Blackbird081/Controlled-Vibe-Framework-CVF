# CVF W111-T1 Live Evidence Publication Roadmap

Memory class: SUMMARY_RECORD

> Date: 2026-04-21
> Status: CLOSED DELIVERED 2026-04-21
> Purpose: package the live evidence needed to publish CVF's current effectiveness claims without relying on mock-only results.

---

## Objective

Create a public-safe evidence packet for the current CVF posture:

- CVF controls real AI/agent output for non-coders through a governed path.
- CVF has live multi-provider operability on Alibaba `qwen-turbo` and DeepSeek `deepseek-chat`.
- Mock mode remains valid only for UI structure checks.
- Provider speed, cost, strength, and reliability remain lane-specific economics chosen by the user.

---

## Binding Test Policy

Release-quality governance proof must use live provider API calls.

Mock mode may only prove UI structure: navigation, routing, static badges, layout, and RBAC pages that do not assert AI governance behavior.

Required command for publication-grade proof:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

The command must run both UI-only mock E2E and live governance E2E, and it must fail if `DASHSCOPE_API_KEY` is missing.

---

## Deliverables

| ID | Deliverable | Status |
| --- | --- | --- |
| CP1 | Root agent policy file `AGENTS.md` | DELIVERED |
| CP2 | Live evidence publication packet | DELIVERED |
| CP3 | Front-door docs updated (`README.md`, `ARCHITECTURE.md`, `docs/INDEX.md`) | DELIVERED |
| CP4 | RC truth/demo/limitations docs corrected for live-first governance proof | DELIVERED |
| CP5 | Full release gate rerun with live API | DELIVERED |

---

## Verification

Latest local publication gate:

```text
python scripts/run_cvf_release_gate_bundle.py --json
PASS
Web build: PASS
Guard Contract TypeScript: PASS
Provider readiness: PASS, CERTIFIED lanes: 2
Secrets scan: PASS
Docs governance: PASS
E2E Playwright UI (mock): PASS, 6 passed
E2E Playwright Governance (live): PASS, 7 passed
```

Provider readiness:

```text
python scripts/check_cvf_provider_release_readiness.py --json
status: CERTIFIED
certified_count: 2
Alibaba qwen-turbo: CERTIFIED, latest 6/6, 3 consecutive passes
DeepSeek deepseek-chat: CERTIFIED, latest 6/6, 3 consecutive passes
```

---

## Publication Boundary

CVF may claim:

- governed non-coder AI path is proven on live Alibaba E2E;
- multi-provider operability is proven on Alibaba and DeepSeek live canary receipts;
- mock mode is not used as governance evidence.

CVF must not claim:

- provider parity;
- identical speed, quality, cost, latency, or reliability between providers;
- universal model compatibility beyond certified lanes;
- hosted SaaS readiness.

---

## Closed State

W111-T1 is closed once the evidence packet and front-door docs point to the same current truth and the full release gate passes with live governance E2E.
