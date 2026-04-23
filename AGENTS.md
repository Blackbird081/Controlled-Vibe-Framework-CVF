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

## Latest Closed Continuation Roadmap

The latest closed implementation roadmap is `docs/roadmaps/CVF_W117_T1_D1_4B_RAG_CHUNK_ENFORCEMENT_ROADMAP_2026-04-23.md`.

The previous closed implementation roadmap is `docs/roadmaps/CVF_W116_T1_DOWNSTREAM_KNOWLEDGE_PIPELINE_ROADMAP_2026-04-23.md`.

Treat the W113/W116/W117 boundary language as binding:

- Workspace bootstrap is now agent-enforcement-ready when generated artifacts and the workspace doctor pass.
- W113 proved this in one real downstream sample project with live API-backed governance evidence.
- W116 proved the downstream knowledge pipeline: `.md` files in `knowledge/` → ingested chunks → positive retrieval delta confirmed by unit evidence tests (16/16 pass).
- W117 proved the writable knowledge store: `KNOWLEDGE_COLLECTIONS` constant replaced by `InProcessKnowledgeStore`; admin CRUD API and UI delivered; Wave 2 live regression 4/4 pass; D1.4b deferred note retired.
- Web is governance-inherited on the active governed AI path, not the full CVF runtime.
- Future work must improve enforcement without overstating either claim.
