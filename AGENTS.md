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

The latest closed implementation roadmap is `docs/roadmaps/CVF_W119_T1_NONCODER_ADOPTION_PROOF_AND_EVIDENCE_UX_ROADMAP_2026-04-23.md`.

The previous closed implementation roadmap is `docs/roadmaps/CVF_W118_T1_UNIFIED_PERSISTENT_KNOWLEDGE_STORE_ROADMAP_2026-04-23.md`.

No next implementation roadmap is pre-authorized. Fresh GC-018 required for continuation.

Treat the W113/W116/W117/W118/W119 boundary language as binding:

- Workspace bootstrap is now agent-enforcement-ready when generated artifacts and the workspace doctor pass.
- W113 proved this in one real downstream sample project with live API-backed governance evidence.
- W116 proved the downstream knowledge pipeline: `.md` files in `knowledge/` → ingested chunks → positive retrieval delta confirmed by unit evidence tests (16/16 pass).
- W117 proved the writable knowledge store: `KNOWLEDGE_COLLECTIONS` constant replaced by `InProcessKnowledgeStore`; admin CRUD API and UI delivered; Wave 2 live regression 4/4 pass; D1.4b deferred note retired.
- W118 proved unified persistent knowledge store: `_runtimeCollections` Map eliminated; `InProcessKnowledgeStore` unified with ephemeral path (`registerEphemeral()`); `FileBackedKnowledgeStore` delivers JSON-file persistence for admin-CRUD collections; `KnowledgeStoreAuditEntry` append-only audit trail delivered; `GET /api/admin/knowledge/audit` route delivered; Wave 2 live regression 4/4 pass; CP2 evidence hardening added real file I/O regression coverage (11 CP4 tests + 3 audit route tests in targeted W118 coverage).
- W119 proved the bounded non-coder adoption journey: secret-free first-run readiness; project knowledge ingest into governed `/api/execute`; route-returned `governanceEvidenceReceipt`; ProcessingScreen/ResultViewer evidence visibility and copy/export; live W119 runner 3/3 locked journeys pass on Alibaba lane with raw keys not printed.
- Web is governance-inherited on the active governed AI path, not the full CVF runtime.
- Future work must improve enforcement without overstating either claim.

