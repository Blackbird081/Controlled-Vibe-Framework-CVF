# CVF v1.6 Agent Platform - Roadmap

## 🎯 Mục tiêu
Hoàn thiện Agent Platform với CVF Governance để production-ready.

---

## ✅ Completed (Governance Integration)

### Phase 1: Agent Mode Detection ✅
- [x] Detect mode từ spec (Đơn giản/Có Quy tắc/CVF Full)
- [x] Mode badge trên Agent header
- [x] System message hiển thị mode

### Phase 2: Quality & Accept/Reject ✅
- [x] `governance.ts` - quality functions (13 tests)
- [x] Quality Score badge (0-100 + color)
- [x] Accept/Retry/Reject buttons

### Phase 3: Full CVF Mode ✅
- [x] `cvf-checklists.ts` - phase checklists (21 tests)
- [x] PhaseGateModal - checklist + compliance score
- [x] Auto-detect phase từ response
- [x] Approve/Reject flow

---

## 🚀 Sprint Plan (từ Assessment 07/02/2026)

### Sprint 1: Security Hardening ✅
**Duration:** 3-4 days (Completed)

| Task | File | Priority |
|------|------|:--------:|
| Replace XOR với Web Crypto API | `security.ts` | ✅ |
| Unit tests cho security.ts | `security.test.ts` | ✅ |
| Input sanitization review | `security.ts` | ✅ |

**Deliverables:**
- [x] AES-GCM encryption via Web Crypto API
- [x] 90%+ test coverage cho security.ts
- [x] Security audit passed

---

### Sprint 2: Component Testing ✅  
**Duration:** 4-5 days (Completed)

| Task | File | Priority |
|------|------|:--------:|
| AgentChat component tests | `AgentChat.test.tsx` | ✅ |
| PhaseGateModal tests | `PhaseGateModal.test.tsx` | ✅ |
| AI providers integration tests | `ai-providers.test.ts` | ✅ (unit) |
| Error Boundary component | `ErrorBoundary.tsx` | ✅ |

**Deliverables:**
- [ ] 80%+ test coverage cho components (chưa đo coverage)
- [x] Install @testing-library/react
- [x] Error boundaries ở critical paths

---

### Sprint 3: AgentChat Refactoring ✅
**Duration:** 3-4 days (Completed)

| Task | Description |
|------|-------------|
| Extract `ChatInput.tsx` | Input field + send logic ✅ |
| Extract `QualityScoreBadge.tsx` | Score display component ✅ |
| Extract `AcceptRejectButtons.tsx` | Action buttons ✅ |
| Create `hooks/useAgentChat.ts` | Chat state logic ✅ |
| Create `hooks/usePhaseDetection.ts` | Phase detection ✅ |

**Target:** AgentChat.tsx < 400 lines → ✅ ~216 lines

---

### Sprint 4: Polishing ✅
**Duration:** 2-3 days (Completed)

| Task | Version |
|------|---------|
| Fetch pricing from API | v1.6 ✅ |
| Compliance indicator UI | v1.6 ✅ |
| Decision log sidebar | v1.6 ✅ |
| Add Sentry error tracking | v1.6 ✅ (hooked via `window.Sentry`) |
| Analytics audit event (analytics_opened + retry) | v1.6 ✅ |
| Mobile responsive tweaks (History/Result/Analytics) | v1.6 ✅ |

---

## 📊 Test Coverage Target

```
Current → Target (Production)

governance.ts       ✅ tests → 91% (branches ~90%)
cvf-checklists.ts   ✅ tests → 85% (branches ~83%)
security.ts         ✅ tests → 92% (branches ~89%)
AgentChat.tsx       ✅ tests → 80% (branches ~90%)
ai-providers.ts     ✅ tests → 95% (branches ~74%)
PhaseGateModal.tsx  ✅ tests → 88% (branches ~90%)
quota-manager.ts    ✅ tests → 96% (branches ~81%)
analytics.ts        ✅ tests → 98% (branches ~96%)
Settings.tsx        ✅ tests → 95% (branches ~92%)
SkillLibrary.tsx    ✅ tests → 100% (branches ~90%)
```

---

## ✅ Coverage Snapshot (2026-02-07)

**Overall:** 94.11% statements / 85.04% branches / 91.64% functions / 95.51% lines  
**Tests:** 23 files / 176 tests / 0 failures  
**Gaps lớn nhất:** `useAgentChat.ts`, `ai-providers.ts` (branch-heavy paths)

---

## 🧭 Coverage Upgrade Plan (All Groups)

### Phase A — Core Logic (ưu tiên 1) ✅
- Mục tiêu: ≥70% cho `lib/`
- Tập trung: `ai-providers.ts`, `quota-manager.ts`, `error-handling.tsx`, `i18n.tsx`, `useAgentChat.ts`
- Deliverables:
  - Thêm unit tests cho error handling + retry/backoff
  - Mock provider responses + pricing + quota paths
  - Kiểm tra i18n fallback + key coverage

### Phase B — UI Components (ưu tiên 2) ✅
- Mục tiêu: ≥60% cho `components/`
- Tập trung: `Settings.tsx`, `DecisionLogSidebar.tsx`, `ExportMenu.tsx`, `TypingIndicator.tsx`
- Deliverables:
  - Test UI state transitions + empty/filled states
  - Export menu interactions + clipboard/file paths
  - Decision log clear + toggle behaviors

### Phase C — Integration / Flows (ưu tiên 3) ✅
- Mục tiêu: ≥70% overall
- Tập trung: Simple/Governance/Full flows
- Deliverables:
  - ✅ Add integration tests cho full chat flow
  - ✅ Phase gate approve/reject -> decision log updates

**Exit Criteria:** Overall ≥85% branches + không còn file 0% ở component critical. ✅

---

## 🎯 Production Criteria

| Criteria | Status |
|----------|:------:|
| Core functionality | ✅ |
| CVF Governance | ✅ |
| Security hardened | ✅ Sprint 1 |
| Test coverage ≥85% branches | ✅ (85.04% branches) |
| Refactored components | ✅ Sprint 3 |
| Error tracking | ✅ Sprint 4 |

**ETA Production:** phụ thuộc vào coverage + E2E

---

## 🔎 Assessment Alignment (CVF_COMPREHENSIVE_ASSESSMENT_2026-02-07)

### v1.6 Action Items từ Assessment
- ✅ Replace XOR encryption → done
- ✅ Add unit tests cho `security.ts` → done
- ✅ Add component tests cho `AgentChat.tsx` → done
- ✅ Refactor `AgentChat.tsx` → done
- ✅ Fetch pricing from API → done
- ✅ Add React Error Boundary → done
- ✅ Compliance indicator UI → done
- ✅ Coverage ≥70% → done (2026-02-07)
- ✅ Integration flow tests (Simple/Governance/Full) → done (2026-02-07)
- ✅ `quota-manager.ts` tests → done (2026-02-07)

### v1.6 Post-Assessment Updates (2026-02-07)
- ✅ Shared tools: `tools/skill-validation` (used by v1.5.2 + v1.6)
- ✅ Analytics audit event tracking + retry event logging
- ✅ UI responsive tweaks (History/Result/Analytics)
- ✅ Vitest full run clean (23 files / 176 tests, 85%+ branches)
- ✅ Skill Library UAT editor (View/Edit + save markdown)
- ✅ Demo Mode badge when `NEXT_PUBLIC_CVF_MOCK_AI=1`
- ✅ Tools modal marked as “Coming Soon” (avoid cost confusion)
- ✅ Spec export 강화: Input Coverage + Execution Constraints + Validation Hooks
- ✅ Output Template auto-injected for Strategy Analysis + fallback template for all
- ✅ Default export mode = Governance + migrate existing settings
- ✅ External intake pipeline v2 (SkillsMP): raw + normalized snapshot archive (`external-sources/skillsmp/raw/`)
- ✅ External intake pipeline v2 (SkillsMP): external index for cross-source dedupe (`external-sources/index.json`)
- ✅ External intake pipeline v2 (SkillsMP): quality gates (min stars + min description + require source default)
- ✅ External intake pipeline v2 (SkillsMP): skip existing CVF skills during search (name + source repo key)
- ✅ External intake pipeline v2 (SkillsMP): description fingerprint dedupe (cross-source content-level)
- ✅ External intake pipeline v2 (SkillsMP): similarity threshold (Jaccard) to drop near-duplicate descriptions
- ✅ External intake pipeline v2 (SkillsMP): CLI support `--api-key`, `--allow-missing-source`, `--refresh-template`
- ✅ External intake pipeline v2 (SkillsMP): refreshable template rendering to reduce “same example” look
- ✅ External intake pipeline v2 (SkillsMP): domain-specific example library for diverse Input/Output samples
- ✅ Skill Library domain report: count + avg UAT score + quality distribution per domain
- ✅ Skill Library domain report: filter/sort + spec quality scoring (auto)
- ✅ Spec Quality Gate vs Output UAT separation (docs + workflow): Spec Gate (input) + Pre-UAT (agent) + Final UAT (user)

### Items ngoài phạm vi v1.6 (từ Assessment)
- v1.3: Dashboard audit log (UI-only) → ✅ done (2026-02-07)
- v1.5: Analytics tracking implementation → ✅ done (2026-02-07)
- v1.5.2: Advanced skills examples + versioning + related skills → ✅ done (2026-02-07)

---

## 🔐 v1.3 Dashboard Authentication Plan

**Mục tiêu:** Bắt buộc login trước khi vào dashboard + phân quyền cơ bản  
**Scope đề xuất:**
- [ ] Auth provider (NextAuth hoặc custom)
- [x] Session management + middleware bảo vệ routes
- [x] Role-based access (admin/editor/viewer) — UI only (cookie)
- [x] Login UX: remember credentials + show/hide password
- [x] Audit log tối thiểu cho truy cập dashboard

**Deliverables:**
- [x] Login flow (admin/admin123)
- [x] Protected routes (global gate via middleware)
- [x] Logout action + user settings
- [x] Role badge + hide/disable UI theo role (UI-only)
- [x] Remember credentials + show/hide password
- [x] Audit log tối thiểu cho truy cập dashboard

---

## 🛡️ Sprint 5: Post-Review Hardening (09/02/2026)
**Duration:** 5-7 days — Blocking for production

| Task | Owner | Priority | Status |
|------|-------|:-------:|:------:|
| Server-side auth (session/JWT, HttpOnly cookie), remove hardcoded creds, enforce auth on `/api/*` | Platform | 🔴 | ✅ |
| Rate-limit + service token guard for `/api/execute`; budget meter + per-provider quotas | Platform | 🔴 | ✅ (quota per-provider TBD) |
| Move UAT state to writable store (KV/DB/S3) with atomic writes; disable FS writes on immutable targets | Platform | 🔴 | ⏳ fallback `.tmp-uat`, need real store |
| Runtime validation for `ExecutionRequest`; coerce/sanitize inputs before prompt build | Platform | 🟠 | ✅ |
| Align risk model to R0–R4 in SDK validator + governance docs; add tests for R4 block | SDK/Gov | 🟠 | ✅ |
| Pre-flight safety filters (prompt-injection/PII/content) before provider call; block/flag high risk | Platform | 🟠 | ✅ |
| CI wiring: lint + vitest + Playwright smoke for `cvf-web`; gate on PR | DevEx | 🟢 | ✅ (workflow added) |

**Exit Criteria**
- All APIs require authenticated session; no default creds; middleware protects `/api/*`.
- Public abuse vector closed: service token + rate-limit + quota enforced; budget check not hardcoded.
- UAT edits persist on production infra (no FS writes); graceful fallback on read-only.
- Schema validation prevents non-string payload crashes; risk model consistent (R4 blocked).
- Safety filters in place; CI green (lint/unit/e2e) before deploy.

---

## ✅ Checklist Còn Lại (từ Assessment 07/02/2026)

### v1.3 — Implementation Toolkit
- [x] Cải thiện SDK documentation (thêm examples) — `README.md`
- [x] Bổ sung test coverage cho TypeScript SDK — `typescript-sdk/` (vitest run ✅)
- [ ] Auth provider + session chuẩn (server-side) — nâng từ UI-only
- [x] Audit log truy cập dashboard

### v1.5 — UX Platform
- [x] Analytics tracking implementation — `22_ANALYTICS/`
- [x] Mobile responsive review (breakpoints) — CSS

### v1.5.2 — Skill Library
- [x] Automated testing/validation cho skills (sample I/O)

### v1.6 — Agent Platform
- [x] E2E flows (Simple/Governance/Full) — Playwright tests added (mock AI) + E2E run passed (3/3)

---

## 🔭 Long-term Focus (2026) — Telemetry + Mobile Experience

### Track 1: Telemetry/Analytics for Skill Usage Patterns
**Status:** In Progress

- [x] Baseline analytics events in v1.6 (`analytics.ts`)
- [x] Define privacy/data-minimization rules (no prompt/PII capture) — `docs/telemetry/TELEMETRY_POLICY.md`
- [x] Metrics schema: skill usage, domain trends, accept/reject rate, quality score — `docs/telemetry/TELEMETRY_SCHEMA.md`
- [x] Storage strategy: local-only + export format (CSV/JSON)
- [ ] Aggregation jobs: daily/weekly summaries
- [x] Dashboard widgets: Top skills + domain usage + event stats
- [x] Governance review: opt-out + retention policy (Settings + retention window)

### Track 2: Mobile Experience (Web-first, no native app)
**Status:** In Progress (baseline responsive done)

- [x] Baseline responsive tweaks (History/Result/Analytics)
- [x] Mobile UX audit checklist across Simple/Governance/Full flows — `docs/mobile/MOBILE_UX_AUDIT.md`
- [x] Mobile spec doc (layouts, touch targets, keyboard behavior, safe areas) — `docs/mobile/MOBILE_SPEC.md`
- [x] Implementation pass: chat input, sidebars, forms, modals (mobile layouts)
- [x] Device QA report (emulation checklist + pending physical) — `docs/mobile/DEVICE_QA_REPORT.md`

---

## 🧪 Independent Review Improvements (2026-02-07)

**Mục tiêu:** Ghi nhận các điểm cần hoàn thiện sau đánh giá độc lập.

### Critical
- [ ] Chuyển AI provider calls sang backend proxy (không gọi trực tiếp từ browser)
- [ ] Remove/lock `anthropic-dangerous-direct-browser-access` usage trong client

### High
- [ ] Auth thật (server-side session + hash password + rate limit), thay vì UI-only + default creds
- [ ] Tool execution backend (sandbox + permission model) trước khi mở “execute”

### Medium
- [x] UAT editor riêng (markdown View/Edit + save)
- [ ] Analytics storage server-side (đa user) + audit log (nếu rollout team rộng)

### Low
- [x] Badge “Mock/Demo” khi bật `NEXT_PUBLIC_CVF_MOCK_AI=1`
- [ ] Cảnh báo cost/rate-limit trong UI khi bật AI providers

---

## 🌐 Domain Refinement (v1.5.2) — Completed ✅

**Trạng thái:** Hoàn tất Quality Pass 2 cho 12 domains / 114 skills.  
**Nguồn theo dõi:** `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/ROADMAP.md`

---

*Last Updated: 2026-02-07*
