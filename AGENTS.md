# CVF Agent Instructions

## Mandatory Live Governance Proof

Any test, roadmap closure, release gate, demo proof, or public claim that asserts CVF governance behavior must use a real provider API call.

This includes claims about risk classification, approval flow, phase gates, DLP filtering, bypass detection, output validation, provider routing, audit trail updates, or CVF controlling AI/agent behavior for non-coders.

Mock mode is allowed only for pure UI structure checks such as navigation, routing, static badges, layout, and RBAC pages that do not assert AI governance behavior.

Required command for release-quality proof:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

This command must include live governance E2E and must fail if no DashScope-compatible live key is available. `DASHSCOPE_API_KEY` is accepted directly; `ALIBABA_API_KEY`, `CVF_ALIBABA_API_KEY`, and `CVF_BENCHMARK_ALIBABA_KEY` are accepted aliases. `--e2e` is a targeted UI-only mock check and is not a substitute for governance proof.

Never commit or print raw API key values. Use operator-supplied environment variables such as `DASHSCOPE_API_KEY`, `ALIBABA_API_KEY`, and `DEEPSEEK_API_KEY`.

## Current Continuation Roadmap

The current approved implementation roadmap is `docs/roadmaps/CVF_W113_T1_FIRST_DOWNSTREAM_PROJECT_PROOF_ROADMAP_2026-04-22.md`.

The latest closed implementation roadmap is `docs/roadmaps/CVF_W112_T1_WORKSPACE_AGENT_ENFORCEMENT_AND_WEB_CONTROL_UPLIFT_ROADMAP_2026-04-22.md`.

Treat the W112/W113 boundary language as binding:

- Workspace bootstrap is now agent-enforcement-ready when generated artifacts and the workspace doctor pass.
- W113 must prove this in a real downstream project before public docs claim downstream adoption is proven.
- Web is governance-inherited on the active governed AI path, not the full CVF runtime.
- Future work must improve enforcement without overstating either claim.
