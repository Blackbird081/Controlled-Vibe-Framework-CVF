# CVF Integration Roadmap — AI Safety Runtime cho Non-Coder

> **Ngày tạo:** 24/02/2026
> **Cập nhật lần cuối:** 25/02/2026
> **Trạng thái:** ✅ Sprint 6 hoàn tất (6/6 Sprint hoàn tất)
> **Mục tiêu:** Tích hợp 3 module mới vào CVF gốc, đúng vị trí kiến trúc
> **Chiến lược:** CVF = AI Safety Runtime chạy âm thầm bảo vệ Non-Coder
> **Quy tắc:** Không push GitHub cho đến khi được sự đồng ý

---

## Quyết Định Đã Xác Nhận

- ✅ Rename 3 folder vào `EXTENSIONS/` theo convention `CVF_vX.Y_DESCRIPTOR`
- ✅ Sprint order giữ nguyên (1→2→3→4→5)
- ✅ Chuyển sang ngôn ngữ non-coder cho risk levels (An toàn / Cần chú ý / Cần duyệt / Nguy hiểm)
- ✅ Version naming theo đúng quy tắc core: v1.7 → v1.7.1 → v1.7.2
- ✅ Tạm dừng push GitHub cho đến khi tái cấu trúc hoàn tất
- ✅ Deep Integration: tận dụng tối đa Intelligence + Safety Runtime logic trong Web UI

---

## Kiến Trúc Sau Tích Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 4: SAFETY UI — Non-Coder Dashboard                    │
│  → EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD/                  │
│  🟢An toàn  🟡Cần chú ý  🟠Cần duyệt  🔴Nguy hiểm        │
├──────────────────────────────────────────────────────────────┤
│  Layer 3: PLATFORM — v1.6 Web UI + Agent Chat                │
│  → EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/ (đã có)              │
│  → EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ (đã có)         │
│  🆕 + Safety Status lib + Prompt Sanitizer + Entropy Guard  │
├──────────────────────────────────────────────────────────────┤
│  Layer 2.5: SAFETY RUNTIME — Policy Enforcement              │
│  → EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/                    │
│  Policy lifecycle + Auth + Audit — chạy âm thầm             │
├──────────────────────────────────────────────────────────────┤
│  Layer 2: INTELLIGENCE — Agent Behavior Control              │
│  → EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE/             │
│  Reasoning gate + Entropy guard + Prompt sanitizer           │
├──────────────────────────────────────────────────────────────┤
│  Layer 1: CORE — v1.0/v1.1 (Không đổi)                      │
│  Principles + 141 Skills + R0-R3                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 21 Điểm Tích Hợp — Trạng Thái

| # | Điểm | Sprint | Trạng thái |
|:-:|-------|:------:|:----------:|
| 1 | `ExploratoryStrategy.hardStopAtR3: false` → `true` | S1 | ✅ |
| 2 | Dead code cleanup trong modules cũ | S1 | ✅ |
| 3 | Rename folder theo convention `CVF_vX.Y_DESCRIPTOR` | S1 | ✅ |
| 4 | `dev.db` + `node_modules/` vào `.gitignore` | S1 | ✅ |
| 5 | 10 test files, 138 tests cho Intelligence | S2 | ✅ |
| 6 | TypeScript compile verified | S2 | ✅ |
| 7 | Version theo quy tắc core: v1.7 / v1.7.1 / v1.7.2 | S3 | ✅ |
| 8 | Non-Coder risk labels (VI + EN) | S3 | ✅ |
| 9 | README gốc cập nhật 5-layer architecture | S3 | ✅ |
| 10 | `CVF_LITE.md` + `START_HERE.md` dọn stale content | S3 | ✅ |
| 11 | Integration test cross-module (risk.bridge) | S4 | ✅ |
| 12 | CI workflow cho 3 module mới | S4 | ✅ |
| 13 | Non-coder: i18n + onboarding + safety badge | S5 | ✅ |
| 14 | `safety-status.ts` — port core logic vào Web UI | S6 | ✅ |
| 15 | `/safety` page — Safety Dashboard trong Web UI | S6 | ✅ |
| 16 | Sidebar nav + Footer SafetyBadge | S6 | ✅ |
| 17 | AgentChat: prompt sanitization trước khi gửi AI | S6 | ✅ |
| 18 | ResultViewer: entropy guard + anomaly detection trên output | S6 | ✅ |
| 19 | GovernanceBar: policy engine enforcement (ALLOW/ESCALATE/BLOCK) | S6 | ✅ |
| 20 | governance-context.ts: system prompt hardening | S6 | ✅ |
| 21 | i18n: safety keys (VI + EN) | S6 | ✅ |

---

## Sprint 1 — Critical Fixes ✅

### 1.1 Fix `hardStopAtR3`
- File: `CVF_v1.7.2_SAFETY_DASHBOARD/lib/strategy/governanceStrategy.config.ts`
- `ExploratoryStrategy.hardStopAtR3: false` → `true`
- CVF Doctrine: "R3 = hard BLOCK, always. No exception."

### 1.2 Rename & Move vào EXTENSIONS/
```
cvf/                                     → EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/
cvf v1.6 plus/                           → EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD/
CVF – Controlled Intelligence Extension/ → EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE/
```

### 1.3 Gitignore cleanup
- Thêm `dev.db`, `*.db-journal` vào `.gitignore`
- Xóa `node_modules/` khỏi 3 modules mới

---

## Sprint 2 — Test Coverage cho Intelligence ✅

### 2.1 TypeScript compile verified
### 2.2 Test cho 8 file critical + risk labels

| File | Test cases | Kết quả |
|------|-----------|:-------:|
| `policy.engine.ts` | ALLOW/ESCALATE/BLOCK thresholds | ✅ |
| `risk.mapping.ts` | R0-R3 ↔ riskScore, round-trip | ✅ |
| `role.mapping.ts` | Phase ↔ AgentRole, blocked checks | ✅ |
| `transition.validator.ts` | Valid + blocked transitions | ✅ |
| `entropy.guard.ts` | Variance calc + custom thresholds | ✅ |
| `prompt.sanitizer.ts` | CRITICAL/HIGH/MEDIUM injection patterns | ✅ |
| `recursion.guard.ts` | Depth/repetition/oscillation/locking | ✅ |
| `anomaly.detector.ts` | NORMAL → STRICT → LOCKDOWN | ✅ |
| `risk.labels.ts` | Non-coder labels VI/EN + formatting | ✅ |

---

## Sprint 3 — Docs & Version Alignment ✅

### 3.1 Version theo quy tắc CVF core

| Module | Folder Name | Version |
|--------|------------|:-------:|
| 🧠 Intelligence | `CVF_v1.7_CONTROLLED_INTELLIGENCE` | v1.7 |
| ⚙️ Safety Runtime | `CVF_v1.7.1_SAFETY_RUNTIME` | v1.7.1 |
| 🛡️ Safety Dashboard | `CVF_v1.7.2_SAFETY_DASHBOARD` | v1.7.2 |

> Convention: `CVF_vX.Y_DESCRIPTOR` — Extensions KHÔNG có version độc lập.

### 3.2 Risk level mapping cho Non-Coder
| Internal | Non-Coder Label (VI) | Non-Coder Label (EN) |
|----------|---------------------|---------------------|
| R0 | 🟢 An toàn | 🟢 Safe |
| R1 | 🟡 Cần chú ý | 🟡 Attention |
| R2 | 🟠 Cần duyệt | 🟠 Review Required |
| R3 | 🔴 Nguy hiểm | 🔴 Dangerous |

### 3.3 Dọn root files
- `CVF_LITE.md` — xóa stale content, giữ redirect → `docs/GET_STARTED.md`
- `START_HERE.md` — xóa stale content, giữ redirect → `docs/GET_STARTED.md`

### 3.4 Update README gốc
- 5-layer architecture diagram
- Version Guide cập nhật v1.7 / v1.7.1 / v1.7.2
- `VERSIONING.md` thêm 3 versions mới

---

## Sprint 4 — Integration & CI ✅

### 4.1 Integration test cross-module
- `integration/risk.bridge.ts` — Bridge giữa Safety Runtime (LOW/MEDIUM/HIGH/CRITICAL) ↔ Intelligence (R0-R3)
- `integration/risk.bridge.test.ts` — 19 tests end-to-end

### 4.2 CI workflow
- `.github/workflows/cvf-extensions-ci.yml`
- Trigger: push/PR vào `EXTENSIONS/CVF_v1.7*`

---

## Sprint 5 — Non-Coder Safety Alignment ✅

### 5.1 Dashboard i18n (VI + EN)
### 5.2 Onboarding flow — 3 bước cho non-coders
### 5.3 Safety badge — "AI đang được kiểm soát bởi CVF"

---

## Sprint 6 — Deep Integration: Safety Logic → Web UI ✅

> **Mục tiêu:** Tận dụng tối đa logic từ Intelligence + Safety Runtime để nâng cao chất lượng kiểm soát AI trên toàn bộ Web UI — không chỉ thêm trang mới mà THẤM vào mọi interaction.

### Part A — Safety Dashboard Page

#### 6.1 `src/lib/safety-status.ts` [NEW]
Port logic cốt lõi từ cả 2 backend module vào 1 file tự chứa:
- `riskToScore()` / `scoreToRisk()` — từ `risk.mapping.ts`
- `evaluatePolicy()` — từ `policy.engine.ts` → ALLOW/ESCALATE/BLOCK
- `sanitizePrompt()` — từ `prompt.sanitizer.ts`
- `checkEntropy()` — từ `entropy.guard.ts`
- `detectAnomaly()` — từ `anomaly.detector.ts`
- Risk labels (An toàn / Nguy hiểm) — từ `risk.labels.ts`

#### 6.2 `/safety` page [NEW]
- `src/app/(dashboard)/safety/page.tsx`
- Real-time risk status, 4-level risk cards, safety controls

#### 6.3 Sidebar + Footer [MODIFY]
- Thêm "🛡️ AI Safety" vào sidebar Governance group
- SafetyBadge (minimal) ở footer

### Part B — Deep Integration

#### 6.4 AgentChat — Prompt Sanitization [ENHANCE]
- Gọi `sanitizePrompt()` trước khi gửi prompt tới AI
- Hiện "🛡️ Prompt đã được kiểm tra" indicator
- Policy check: nếu risk ≥ R3 → chặn, hiện cảnh báo

#### 6.5 ResultViewer — Output Quality [ENHANCE]
- Gọi `checkEntropy()` phát hiện output bất thường
- Gọi `detectAnomaly()` phát hiện patterns nguy hiểm
- Hiện SafetyScore badge: 🟢/🟡/🟠/🔴 trên mỗi output

#### 6.6 GovernanceBar — Policy Engine [ENHANCE]
- Dùng `evaluatePolicy()` thay vì if/else đơn giản
- R3 → hard block + modal "Cần sự phê duyệt"

#### 6.7 governance-context.ts — Prompt Hardening [ENHANCE]
- Inject safety rules vào system prompt
- "KHÔNG vi phạm ngưỡng rủi ro R3"

#### 6.8 i18n — Safety keys [MODIFY]
- Thêm safety.* keys cho VI + EN

---

## Kết Quả Tổng Hợp

```
Sprint 1-5:  10 files / 138+ tests — ALL PASS
Sprint 6:    ✅ Hoàn tất — 8 điểm tích hợp, 2 file mới, 6 file sửa
CI:          cvf-extensions-ci.yml active
Versions:    v1.7 / v1.7.1 / v1.7.2 — đúng convention
Build:       ✅ Next.js 16.1.6 compiled + TypeScript clean
GitHub:      🔒 LOCKED — chưa push
```
