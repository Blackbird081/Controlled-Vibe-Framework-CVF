# CVF Independent System Review (2026-03-10)

> Purpose: Independent assessment snapshot for upgrade reference.
> Date: 2026-03-10
> Scope: CVF core + extensions + Web UI + governance toolchain.
> Inputs:
> - docs/reviews/cvf_phase_governance/CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md
> - docs/reviews/cvf_phase_governance/CVF_UPGRADE_TRACE_2026-03-07.md
> - docs/assessments/CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md
> - docs/assessments/CVF_INDEPENDENT_ASSESSMENT_2026-02-28.md
> - docs/CVF_CORE_KNOWLEDGE_BASE.md (2026-03-05)
> - docs/reference/CVF_RELEASE_MANIFEST.md (2026-03-07)
> - ECOSYSTEM/strategy/CVF_USER_REQUIREMENTS_2026-03-10.md (User Actions Required excluded)

---

## 1. Executive Summary

- CVF has moved beyond documentation-only governance and now demonstrates runtime enforcement + evidence artifacts across multiple layers.
- Phase 1-4 gaps were declared closed on 2026-03-09 with concrete runtime modules and tests (UnifiedStateResolver, Wave 2 conformance, SkillRolloutEngine, WorkflowCoordinator).
- Web UI v1.6 is production-ready and provides a usable non-coder entrypoint, but it is not a full execution substrate (limited file/runtime access in Agent Chat).
- The weakest operational gap is cross-channel guard enforcement: Web UI can enforce governance, but VS Code/other agent contexts still rely on manual prompt injection.
- Several lines remain local-ready and are not fully normalized into a single release narrative (v1.8, v1.8.1, v1.9, v2.0).

## 2. Findings (Ordered by Severity)

### High

1) Cross-channel governance enforcement is not guaranteed.
- Web UI injects governance and enforces guards; VS Code and external agents require manual prompt injection.
- This leaves a bypass risk if operators do not apply the toolkit prompt.
- Evidence: docs/reference/CVF_IN_VSCODE_GUIDE.md

### Medium

2) Release narrative is fragmented for local-ready lines.
- v1.8/v1.8.1/v1.9/v2.0 are implemented but not fully normalized into an ecosystem-wide release gate.
- Evidence: docs/reference/CVF_RELEASE_MANIFEST.md, docs/reference/CVF_MATURITY_MATRIX.md

3) Execution substrate is still split across roadmap and requirements.
- Roadmap emphasizes governance closure; user requirements introduce MCP HTTP bridge + execution runtime without a consolidated release plan.
- Evidence: ECOSYSTEM/strategy/CVF_USER_REQUIREMENTS_2026-03-10.md

### Low

4) Web UI remains UI-first, not full runtime.
- Agent Chat lacks project file access and code execution. This is acceptable for non-coders but limits “end-to-end execution” claims.
- Evidence: docs/reference/CVF_v16_AGENT_PLATFORM.md

## 3. System Strengths (Evidence-Based)

- Governance pipeline and evidence chain are now enforced at multiple layers, with conformance baselines and release-grade packet artifacts.
- Independent assessments (2026-02-25, 2026-02-28) show lint/test/build are green for cvf-web and key extensions.
- Control plane unification and conformance wave expansion were completed in the 2026-03-09 update.

## 4. Open Questions / Decision Gates

- What is the official merge strategy for cvf-next to main (affects integration path)?
- Should MCP HTTP bridge be a separate service or Next.js API route?
- What execution scope is acceptable for MVP (text only vs code/file ops)?

## 5. Recommendation Snapshot

- Prioritize cross-channel guard enforcement as P0.
- Normalize local-ready lines into a unified release narrative and conformance gate.
- Merge MCP HTTP bridge + execution runtime into the same governance/evidence chain instead of a parallel track.

---

## Appendix: What was excluded

- “User Actions Required” sections in ECOSYSTEM/strategy/CVF_USER_REQUIREMENTS_2026-03-10.md were intentionally excluded per request.
