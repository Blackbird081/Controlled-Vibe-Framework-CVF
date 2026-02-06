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

### Sprint 1: Security Hardening 🔴 HIGH
**Duration:** 3-4 days

| Task | File | Priority |
|------|------|:--------:|
| Replace XOR với Web Crypto API | `security.ts` | 🔴 |
| Unit tests cho security.ts | `security.test.ts` | 🔴 |
| Input sanitization review | `security.ts` | 🟡 |

**Deliverables:**
- [ ] AES-GCM encryption via Web Crypto API
- [ ] 90%+ test coverage cho security.ts
- [ ] Security audit passed

---

### Sprint 2: Component Testing 🔴 HIGH  
**Duration:** 4-5 days

| Task | File | Priority |
|------|------|:--------:|
| AgentChat component tests | `AgentChat.test.tsx` | 🔴 |
| PhaseGateModal tests | `PhaseGateModal.test.tsx` | 🟡 |
| AI providers integration tests | `ai-providers.test.ts` | 🟡 |
| Error Boundary component | `ErrorBoundary.tsx` | 🟢 |

**Deliverables:**
- [ ] 80%+ test coverage cho components
- [ ] Install @testing-library/react
- [ ] Error boundaries ở critical paths

---

### Sprint 3: AgentChat Refactoring 🟡 MEDIUM
**Duration:** 3-4 days

| Task | Description |
|------|-------------|
| Extract `ChatInput.tsx` | Input field + send logic |
| Extract `QualityScoreBadge.tsx` | Score display component |
| Extract `AcceptRejectButtons.tsx` | Action buttons |
| Create `hooks/useAgentChat.ts` | Chat state logic |
| Create `hooks/usePhaseDetection.ts` | Phase detection |

**Target:** AgentChat.tsx < 400 lines

---

### Sprint 4: Polishing 🟢 LOW
**Duration:** 2-3 days

| Task | Version |
|------|---------|
| Fetch pricing from API | v1.6 |
| Compliance indicator UI | v1.6 |
| Decision log sidebar | v1.6 |
| Add Sentry error tracking | v1.6 |

---

## 📊 Test Coverage Target

```
Current → Target (Production)

governance.ts       ✅ 70% → 85%
cvf-checklists.ts   ✅ 75% → 85%
security.ts         ❌  0% → 90%
AgentChat.tsx       ❌  0% → 80%
ai-providers.ts     ❌  0% → 70%
PhaseGateModal.tsx  ❌  0% → 80%
```

---

## 🎯 Production Criteria

| Criteria | Status |
|----------|:------:|
| Core functionality | ✅ |
| CVF Governance | ✅ |
| Security hardened | ⏳ Sprint 1 |
| Test coverage ≥70% | ⏳ Sprint 2 |
| Refactored components | ⏳ Sprint 3 |
| Error tracking | ⏳ Sprint 4 |

**ETA Production:** ~2-3 weeks

---

*Last Updated: 2026-02-07*
