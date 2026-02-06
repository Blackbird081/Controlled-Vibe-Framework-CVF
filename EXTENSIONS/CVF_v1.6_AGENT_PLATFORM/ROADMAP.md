# CVF v1.6 Agent Platform - Governance Integration Roadmap

## 🎯 Mục tiêu
Tích hợp CVF Core Rules (v1.0/v1.1) vào web platform, đảm bảo quality control cho AI outputs.

---

## Gap Coverage ✅

| Gap | Giải pháp | Phase |
|-----|-----------|-------|
| Phase Gates | Gate modal trước Phase C | P3 |
| Checklists | Load từ CVF v1.0/v1.1 | P3 |
| Quality Scoring | Agent đánh giá 0-100 | P2 |
| Decision Tracking | Decision log | P3 |
| Compliance Enforcement | Compliance checker | P3 |
| Accept/Reject/Retry | UI buttons | P2 |

---

## 3 Chế độ Governance

| Chế độ | Level | Tính năng |
|--------|-------|-----------|
| **Đơn giản** | Light | Phase indicator |
| **Có Quy tắc** | Medium | + Quality score + Accept/Reject |
| **CVF Full Mode** | Full | + Gates + Checklist + Decisions + Compliance |

---

## Phase 1: Agent Mode Detection ✅
- [x] Detect mode từ spec được gửi
- [x] Mode badge trên Agent header
- [x] System message hiển thị mode

## Phase 2: Quality & Accept/Reject ✅
- [x] `governance.ts` - quality functions
- [x] Quality Score badge (0-100 + color)
- [x] Accept/Retry/Reject buttons trên AI response

## Phase 3: Full CVF Mode ✅
- [x] `cvf-checklists.ts` - phase checklists  
- [x] PhaseGateModal - checklist + compliance score
- [x] Auto-detect phase từ response
- [x] Approve/Reject flow với system messages [ ] Compliance indicator

---

## Files

| File | Action | Description |
|------|--------|-------------|
| `AgentChat.tsx` | MODIFY | Mode detection, UI components |
| `ai-providers.ts` | MODIFY | System prompt per mode |
| `governance.ts` | NEW | Quality calculations |
| `cvf-checklists.ts` | NEW | Load CVF docs |
| `compliance.ts` | NEW | Compliance enforcement |
