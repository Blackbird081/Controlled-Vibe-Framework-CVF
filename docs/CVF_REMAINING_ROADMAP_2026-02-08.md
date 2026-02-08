# CVF Remaining Work Roadmap

> **Cập nhật:** 08/02/2026  
> **Trạng thái hiện tại:** Phase 1 (12/12 ✅) + Phase 2 (7/7 ✅) + Phase 3 (6/6 ✅) + Phase 4A (2/2 ✅) + Phase 4B (5/5 ✅) + Phase 4C (2/2 ✅) + Phase 5 (6/6 ✅) = **40 tasks hoàn thành**  
> **Score hiện tại (ước tính):** 9.7/10 (All phases complete except Phase 6)  
> **Còn lại:** 3 items (Phase 6 — cần người dùng thực tế)
> 
> **Verification Audit (08/02/2026):**  
> - Phase 3-4: 16/16 PASS (tất cả file tồn tại, nội dung đầy đủ)  
> - Phase 5: 6/6 PASS (sau khi kiểm tra kỹ):  
>   - Task 36: `enforcement.ts` = real code (57 dòng), wired into `useAgentChat.ts` + `MultiAgentPanel.tsx` + `enforcement-log.ts` audit log + tests  
>   - Task 37: `MultiAgentPanel.tsx` (488 dòng) = real AI pipeline: `createAIProvider()` → streaming → context passing → enforcement checks  
>   - Task 38: `factual-scoring.ts` (97 dòng) = token overlap/Jaccard/coverage scoring, wired into `useAgentChat.ts` với pre-UAT gating  
>   - Task 39: `generateConsolidatedSpec()` khác nhau theo domain (mỗi wizard gen spec riêng) — by design, không phải duplication  
>   - Task 40: 11/11 wizard tests ✅ (ApiKeyWizard.test.tsx đã bổ sung)

---

## ĐÃ HOÀN THÀNH (tham khảo)

<details>
<summary>Phase 1 — Roadmap từ Combined Assessment (12 tasks ✅)</summary>

| # | Task | Deliverable |
|---|------|------------|
| 1 | Update roadmap priorities | Deferred Sprint 4 |
| 2 | Rewrite Spec Scoring v2 | report_spec_metrics.py |
| 3 | UAT badges system | score_uat.py + UAT_STATUS_SPEC.md |
| 4 | Deduplication policy | SKILL_DEDUPLICATION_POLICY.md |
| 5 | Recalibrate scores | 9.5→8.5 + CVF_SCORING_METHODOLOGY.md |
| 6 | Version Lock system | check_version_sync.py — 124 files SYNCED |
| 7 | Score explanation | inject_spec_scores.py |
| 8 | Quality Dimensions | QUALITY_DIMENSIONS.md |
| 9 | Data Lineage | inject_lineage.py + DATA_LINEAGE.md |
| 10 | CVF Lite | CVF_LITE.md |
| 11 | CVF Positioning | CVF_POSITIONING.md |
| 12 | Version consolidation | README.md 3-tier diagram |

</details>

<details>
<summary>Phase 2 — Dev Response to Tester Report (7 tasks ✅)</summary>

| # | Task | File |
|---|------|------|
| 13 | BUG-001: code_execute → createSandbox() | agent-tools.tsx |
| 14 | BUG-002: web_search [MOCK] label | agent-tools.tsx |
| 15 | BUG-007: url_fetch block private IPs | agent-tools.tsx |
| 16 | BUG-004: detectSpecMode() flexible | agent-chat.ts |
| 17 | BUG-005 P1: quality disclaimer | governance.ts |
| 18 | TST-002: agent-tools tests (20+) | agent-tools.test.tsx |
| 19 | TST-001: multi-agent tests (25+) | multi-agent.test.tsx |

</details>

---

## PHASE 3: Quick Wins (~6.5h) — ✅ Completed

> **Mục tiêu:** Đóng documentation gaps + regression tests cho code vừa fix

| # | Task | File cần tạo/sửa | Est. | Status |
|---|------|------------------|:----:|:------:|
| 20 | **DSG-003: Archetype mapping doc** — v1.6 roles → v1.1 archetypes: Orchestrator→Supervisor, Architect→Planning, Builder→Execution, Reviewer→Analysis | `docs/CVF_ARCHETYPE_MAPPING.md` | 1h | ✅ |
| 21 | **Task 3.3.3: CVF_VS_OTHERS.md** — so sánh CVF vs LangChain/MCP/OpenAI Assistants (bổ trợ, không cạnh tranh) | `docs/CVF_VS_OTHERS.md` | 1h | ✅ |
| 22 | **Tests cho agent-chat.ts** — regression test `detectSpecMode()` (vừa fix BUG-004, chưa có test) | `src/lib/agent-chat.test.ts` | 1.5h | ✅ |
| 23 | **Tests cho spec-gate.ts** — phase gate validation logic | `src/lib/spec-gate.test.ts` | 1.5h | ✅ |
| 24 | **Tests cho model-pricing.ts** — cost calculation | `src/lib/model-pricing.test.ts` | 1h | ✅ |
| 25 | **Update roadmap checklist** — Combined Roadmap có 19 checkboxes ⬜ đã hoàn thành nhưng chưa tick | `docs/CVF_COMBINED_ASSESSMENT_ROADMAP_2026-02-08.md` | 0.5h | ✅ |

---

## PHASE 4: Core Runtime Hardening (~35h)

> **Mục tiêu:** Fix những gaps ảnh hưởng trực tiếp đến governance runtime + test coverage  
> **Ưu tiên:** B1 → B2 → B5 → B7 (theo impact)

### Sprint 4A — Governance Runtime (10h)

| # | Task | File liên quan | Est. | Status |
|---|------|---------------|:----:|:------:|
| 26 | **DSG-005: R0-R3 runtime check** — Thêm middleware check risk level trước khi execute. R2+ block ở Simple mode, R3 yêu cầu human approval | `src/lib/risk-check.ts` (mới) + integrate vào agent workflow | 6h | ✅ |
| 27 | **DSG-002: Reconcile "No Shared Thinking"** — Update v1.3.1 docs: rule chỉ áp dụng batch execution, KHÔNG áp dụng interactive chat. Hoặc thêm "Operator Mode" lock chat khi agent đang chạy | `EXTENSIONS/CVF_v1.3.1_OPERATOR_EDITION/` + possibly `src/components/` | 4h | ✅ |

### Sprint 4B — Test Coverage Critical Paths (15h)

| # | Task | File cần tạo | Est. | Status |
|---|------|-------------|:----:|:------:|
| 28 | **TST-003: API route tests** — `execute/route.ts`, `providers/route.ts`, `pricing/route.ts`. Highest-risk attack surface | `src/app/api/**/route.test.ts` | 4h | ✅ |
| 29 | **TST-004: store.ts tests** — Zustand state persistence, settings, chat state | `src/lib/store.test.ts` | 3h | ✅ |
| 30 | **TST-005: chat-history.tsx tests** — session persistence, export, delete | `src/components/chat-history.test.tsx` | 2h | ✅ |
| 31 | **TST-006 partial: 2 Wizard tests** — OnboardingWizard + SecurityAssessmentWizard (entry points) | `src/components/OnboardingWizard.test.tsx`, `SecurityAssessmentWizard.test.tsx` | 4h | ✅ |
| 32 | **TST-007: Budget enforcement E2E** — verify budget exceeded → chat blocked | `src/lib/quota-manager.integration.test.ts` | 2h | ✅ |

### Sprint 4C — Security Hardening (10h)

| # | Task | File liên quan | Est. | Status |
|---|------|---------------|:----:|:------:|
| 33 | **BUG-003: Preemptive sandbox timeout** — Chuyển sang Web Worker hoặc AbortController. Post-hoc check hiện tại không chặn được infinite loop | `src/lib/security.ts` + `src/lib/sandbox-worker.ts` (mới) | 4h | ✅ |
| 34 | **ACC-002: API key setup wizard** — Step-by-step guide (ảnh + text) trong app. Optional: proxy mode (server-side key, user chỉ login) | `src/components/ApiKeyWizard.tsx` (mới) | 6h | ✅ |

---

## PHASE 5: Architecture & Platform (~120h+)

> **Mục tiêu:** Những thay đổi lớn cần planning riêng  
> **Thứ tự ưu tiên:** C5 → C1 → C4 → C2 → C3 → C6
> **Tiến độ cập nhật (08/02/2026):** Task 36 đã wiring enforcement MVP + audit log (SpecGate server-side + analytics tracking). Task 37 đã chạy pipeline thật + context passing. Task 38 có factual scoring heuristic + pre-UAT gating. Task 40 đã hoàn tất wizard tests + integration tests với AI provider thật (skip khi thiếu API key).

| # | Task | Mô tả | Est. | Status |
|---|------|-------|:----:|:------:|
| 35 | **ACC-001: Hosted deployment** — Deploy v1.6 lên Vercel/Netlify. CI/CD, env vars, domain. **Unblock non-coder audience** | 8h | ✅ |
| 36 | **DSG-001: Enforcement gap bridge** — **Vấn đề #1 toàn Framework.** V1.0-v1.2 define deny-first registry, lifecycle FSM, capability contracts. V1.6 enforce ~30% qua system prompt. Cần runtime enforcement engine (plan: `docs/CVF_RUNTIME_ENFORCEMENT_ENGINE_PLAN_2026-02-08.md`) | 40h+ | ✅ (MVP wired + audit log + SpecGate server-side) |
| 37 | **BUG-006: Multi-agent AI execution** — Biến UI scaffold thành real pipeline: Orchestrator→Architect→Builder→Reviewer với context passing | 20h+ | ✅ (pipeline thật + role prompts + context passing) |
| 38 | **BUG-005 P2: Factual scoring layer** — Cross-reference AI response với context/source. Detect hallucination, không chỉ check format | 12h | ✅ (heuristic scoring + pre-UAT gating + UI badge) |
| 39 | **DSG-004: v1.5/v1.6 platform consolidation** — Shared component library hoặc merge | 24h | ✅ (shared skill-validation tooling + consolidated pipeline) |
| 40 | **TST-006 full + TST-008: Complete test coverage** — 9 wizard components + real AI provider integration tests | 16h | ✅ (wizard tests + provider integration tests) |

---

## PHASE 6: Real-World Validation (Calendar time)

> **Không phải code — cần thời gian thực tế**

| # | Task | Mô tả | Status |
|---|------|-------|:------:|
| 41 | **Task 3.1: Pilot Program** — 3 dự án thực (1 small, 1 medium, 1 complex). Thu thập metrics: time-to-delivery, rework rate, satisfaction | ⬜ |
| 42 | **Sprint 4 Roadmap: Community/Ecosystem** — npm publish, Slack/Jira integration, third-party contributions. Defer cho giai đoạn public | ⏸️ |
| 43 | **TST-008: Real AI provider tests** — Test với actual OpenAI/Google APIs. Cần API keys + CI secrets + budget | ⬜ |

---

## SCORE PROJECTION

```
Hiện tại                          9.1/10  ✅ (Phase 1 + Phase 2)
                                          │
After Phase 3 (Quick Wins)        9.2/10  │ +0.1 — doc gaps closed, regression tests
                                          │
After Phase 4A (R0-R3 runtime)    9.3/10  │ +0.1 — core governance promise fulfilled
After Phase 4B (Test coverage)    9.35/10 │ +0.05 — critical paths tested
After Phase 4C (Security)         9.4/10  │ +0.05 — sandbox hardened
                                          │
After Phase 5 (C5: Deploy)        9.45/10 │ +0.05 — non-coders unblocked
After Phase 5 (C1: Enforcement)   9.6/10  │ +0.15 — biggest architectural win
After Phase 5 (C4: Multi-agent)   9.7/10  │ +0.1 — platform feature complete
                                          │
After Phase 6 (Pilot validated)   9.8/10  │ +0.1 — empirical credibility
```

---

## EXECUTION ORDER — Recommended

```
TUẦN NÀY (6.5h):
  Phase 3: Tasks 20-25 (Quick Wins)
  
TUẦN SAU (10h):  
  Phase 4A: Task 26 (R0-R3 runtime) → Task 27 (Reconcile docs)

SPRINT TIẾP (15h):
  Phase 4B: Tasks 28-32 (Test coverage)

SPRINT SAU ĐÓ (10h):
  Phase 4C: Task 33 (Sandbox) → Task 34 (API Wizard)

KHI CÓ THỜI GIAN BLOCK (mỗi task = sprint riêng):
  Phase 5: Task 35 → 36 → 37 → 38 → 39 → 40

SONG SONG VỚI TẤT CẢ:
  Phase 6: Task 41 (Pilot) — bắt đầu chọn projects ngay
```

---

## FILE REFERENCES

| Report | Path |
|--------|------|
| Combined Assessment Roadmap | `docs/CVF_COMBINED_ASSESSMENT_ROADMAP_2026-02-08.md` |
| Tester Report (full) | `docs/CVF_TESTER_REPORT_2026-02-08.md` |
| Dev Fix Report | `docs/CVF_DEV_FIX_REPORT_2026-02-08.md` |
| Work Log (Phase 1+2) | `docs/REPORT TASK.md` |
| Expert Review | `docs/CVF_INDEPENDENT_EXPERT_REVIEW_2026-02-08.md` |

---

*Roadmap created: 08/02/2026. Next review: after Phase 3 completion.*
