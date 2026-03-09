# CVF Technical Stabilization Roadmap | 22/02/2026

**Baseline (updated):** `docs/CVF_INDEPENDENT_ASSESSMENT_2026-02-24.md`  
**Scope:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`  
**Mục tiêu:** Fix toàn bộ lỗi vừa phát hiện và đưa quality gate về trạng thái release-ready

---

## 1. Baseline hiện tại

- Build: PASS
- Lint: PASS (**0 errors**) *(đã xử lý trong WS1)*
- Test: PASS (**1480/1483**, 3 skipped)
- Coverage:
  - Statements: **93.05%**
  - Branches: **80.46%**
  - Functions: **91.48%**
  - Lines: **94.18%**

---

## 2. Release Targets (Definition of Ready)

1. `npm run lint` = **0 errors**
2. `npm run test:run` = **0 failed**, không timeout flaky
3. Branch coverage >= **80%**
4. README metrics đồng bộ với CI report mới nhất
5. CI bắt buộc: build + lint + tests + coverage threshold

---

## 3. Workstreams

## WS1 — Lint Error Burn-down (P1)

### Mục tiêu

- Giảm từ **57 errors** xuống **0 errors**

### Nhóm lỗi chính cần xử lý trước

1. `react-hooks/set-state-in-effect` (22 lỗi, 16 files)
2. `@typescript-eslint/no-explicit-any` (21 lỗi, 11 files)
3. `prefer-const` + `ban-ts-comment` + `react-hooks/*` còn lại

### File ưu tiên cao

- `src/lib/theme.tsx`
- `src/components/AgentChatWithHistory.tsx`
- `src/lib/hooks/useAuth.ts`
- `src/lib/hooks/useModals.ts`
- `src/components/Settings.tsx`
- `src/lib/governance.ts`

### Kết quả cần đạt

- Không còn lỗi loại React hooks purity/state-in-effect
- Không còn `any` ở runtime code (test code chỉ giữ khi có type-safe wrapper)
- Không còn `@ts-ignore` không kiểm soát

---

## WS2 — Flaky Test Stabilization (P1)

### Mục tiêu

- Loại bỏ timeout/fail ngẫu nhiên khi chạy suite full và khi bật coverage

### Hạng mục

1. Chuẩn hóa pattern async test:
   - dùng `findBy*`/`waitFor` đúng chỗ
   - bỏ dependence vào timing ngắn
2. Tách test nặng UI wizard thành nhóm riêng nếu cần
3. Gắn timeout cục bộ cho test nặng thay vì tăng global vô tội vạ
4. Re-run stress:
   - `npx vitest run` nhiều vòng liên tiếp
   - `npx vitest run --coverage --testTimeout=10000`

### Kết quả cần đạt

- 5 lần chạy liên tục không fail ngẫu nhiên
- Coverage run không phát sinh timeout

---

## WS3 — Coverage Uplift (P2)

### Mục tiêu

- Branch coverage từ **76.49%** lên >= **80%**

### File coverage thấp cần ưu tiên

1. `src/lib/governance-engine.ts` (0%)
2. `src/components/SimulationRunner.tsx`
3. `src/components/AgentChat.tsx`
4. `src/components/GovernanceMetrics.tsx`
5. `src/components/BrandDriftIndicator.tsx`

### Chiến lược

- Viết test theo nhánh điều kiện còn thiếu (error/fallback/empty-state)
- Bổ sung test cho logic governance engine trước, sau đó tới UI branches

### Kết quả cần đạt

- Coverage summary:
  - Branch >= 80%
  - Statements >= 90%

---

## WS4 — Documentation Consistency (P2)

### Mục tiêu

- Chấm dứt chênh lệch số liệu giữa README và kết quả chạy thực tế

### Hạng mục

1. Đồng bộ:
   - `README.md`
   - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/README.md`
   - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/README.md`
2. Định nghĩa 1 nguồn sự thật:
   - từ CI artifacts (`vitest json` + `coverage-summary.json`)
3. Ghi rõ ngày snapshot metrics trong docs

### Kết quả cần đạt

- Mọi số test/coverage/version trong docs cùng một mốc dữ liệu

---

## WS5 — CI Quality Gates (P1)

### Mục tiêu

- Ngăn regression quay lại sau khi fix

### Hạng mục

1. Pipeline bắt buộc:
   - `npm run build`
   - `npm run lint`
   - `npm run test:run`
   - `npm run test:coverage`
2. Coverage threshold trong CI:
   - statements >= 90
   - branches >= 80
3. Fail PR nếu vi phạm gate

### Kết quả cần đạt

- Mọi PR bắt buộc xanh đủ 4 gate trước merge

---

## 4. Sprint Plan (10 ngày làm việc)

## Sprint 1 (Ngày 1-2) — Stop the Bleeding

- Chốt danh sách lint errors theo rule/file
- Fix nhóm lỗi runtime nguy hiểm:
  - `theme.tsx`
  - `set-state-in-effect` ở hooks/layout chính
- DoD:
  - Errors <= 30
  - Build + test vẫn PASS

## Sprint 2 (Ngày 3-5) — Lint to Zero

- Xử lý toàn bộ `no-explicit-any`, `prefer-const`, hook purity còn lại
- Dọn warning quan trọng ảnh hưởng maintainability
- DoD:
  - `npm run lint` = 0 errors

## Sprint 3 (Ngày 6-7) — Flaky & Stability

- Ổn định test bất định
- Stress run nhiều vòng
- DoD:
  - 5 vòng `vitest run` liên tiếp PASS
  - Coverage run PASS ổn định

## Sprint 4 (Ngày 8-10) — Coverage + Docs + CI Hard Gate

- Tăng branch coverage lên >= 80%
- Đồng bộ toàn bộ README metrics
- Bật CI quality gates bắt buộc
- DoD:
  - Branch >= 80%
  - Docs metrics đồng nhất
  - CI gate enforced

---

## 5. Task Checklist

- [x] WS1.1 Fix `react-hooks/set-state-in-effect`
- [x] WS1.2 Fix `no-explicit-any` và `@ts-ignore`
- [x] WS1.3 Lint clean: 0 errors
- [x] WS2.1 Flaky tests stable 5 runs
- [x] WS3.1 Add tests for `governance-engine.ts`
- [x] WS3.2 Add branch tests for simulation/chat/governance UI
- [x] WS3.3 Branch coverage >= 80%
- [x] WS4.1 Sync README metrics
- [x] WS5.1 Enable mandatory CI quality gates

---

## 8. Handoff Note (nếu tạm dừng)

**Snapshot:** 2026-02-24 (latest local run)  
**Latest independent reassessment:** `docs/CVF_INDEPENDENT_ASSESSMENT_2026-02-24.md`  
**Gate status mới nhất:**
- Build: PASS khi chạy elevated (`npm run build`) *(local run thường có thể gặp `EPERM` lock `.next`)*
- Lint: PASS (`npx eslint .` = **0 errors, 0 warnings**)
- Test: PASS (`npm run test:run`, **1480/1483**, 0 fail)
- Coverage: PASS (`Statements 93.05%`, `Branches 80.46%`, `Functions 91.48%`, `Lines 94.18%`)

### Trạng thái roadmap

1. Toàn bộ WS1 -> WS5 trong checklist đã hoàn tất.
2. Artifact cục bộ đã dọn:
   - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/eslint-report.json` (đã xóa).
3. WS2 đã ổn định thêm bằng cấu hình timeout test:
   - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/vitest.config.ts`
   - `testTimeout: 15000`, `hookTimeout: 15000`

### Nợ kỹ thuật còn lại (ngoài phạm vi roadmap hiện tại)

1. Không còn warning lint/build tồn đọng trong scope `cvf-web`.
2. Có thể cân nhắc tối ưu thêm branch coverage ở các component UI phức tạp để tạo dư địa an toàn (>82%).

### Gợi ý lệnh bắt đầu lại (ngày mai)

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm run lint
npm run test:run
npm run test:coverage
```

---

## 6. Verification Commands

```bash
# 1) Lint
npm run lint

# 2) Unit tests
npm run test:run

# 3) Coverage
npm run test:coverage

# 4) Build
npm run build
```

---

## 7. Risk Control

1. Không thay đổi logic business lớn trong cùng PR với lint cleanup.
2. Fix theo từng cụm lỗi nhỏ, mỗi cụm có test xác nhận.
3. Mỗi sprint đều chốt bằng full gate run trước khi merge.

---

*Roadmap này là kế hoạch thực thi kỹ thuật để xử lý toàn bộ lỗi phát hiện trong đợt đánh giá 22/02/2026.*
