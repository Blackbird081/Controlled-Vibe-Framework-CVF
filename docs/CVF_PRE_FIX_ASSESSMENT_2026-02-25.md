# CVF Pre-Fix Assessment Snapshot | 25/02/2026

**Mục đích:** Lưu trạng thái đánh giá độc lập trước khi tiến hành fix.  
**Thời điểm snapshot:** 25/02/2026

---

## 1. Findings theo mức độ ưu tiên

### P1

1. Prompt sanitize chưa áp dụng vào payload gửi chat
- File: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/AgentChat.tsx`
- Hiện tại chỉ check `blocked`, nhưng chưa gửi `result.sanitized`.

2. Safety Dashboard test mâu thuẫn với policy mới
- Config: `EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD/lib/strategy/governanceStrategy.config.ts` đã để `hardStopAtR3: true`.
- Test cũ vẫn expect `hardStop=false`:
  `EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD/__tests__/governanceStrategy.engine.test.ts`.

3. CI workflow đang nuốt lỗi test/build
- File: `.github/workflows/cvf-extensions-ci.yml`
- Có `|| true` ở job Safety Dashboard, làm mất tác dụng quality gate.

### P2

4. Sai link tài liệu tới Safety Dashboard
- Files: `START_HERE.md`, `CVF_LITE.md`
- Đang trỏ `EXTENSIONS/cvf-safety-dashboard/` (không tồn tại).
- Folder đúng: `EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD/`.

5. Mốc ngày trong roadmap lệch tương đối
- File: `docs/CVF_INTEGRATION_ROADMAP_2026-02-24.md`
- Đang ghi cập nhật 25/02/2026 trong khi snapshot hiện tại là 24/02/2026.

### P3

6. Lint warnings chưa dọn hết
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ResultViewer.tsx` (`useMemo` unused)
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/Sidebar.tsx` (`getSafetyStatus` unused)

---

## 2. Verification snapshot

- `cvf-web`:
  - Lint: PASS (0 errors, 2 warnings)
  - Focused tests: PASS (110/110)
  - Build: PASS khi chạy elevated (môi trường local có rủi ro lock file)

- `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE`:
  - Tests: PASS (138/138)

- `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME`:
  - Tests: PASS (97/97)

- `EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD`:
  - Tests: FAIL (48/49, fail 1 case ở Exploratory R3 hardStop expectation)

---

## 3. Trạng thái

Snapshot này được chốt trước khi sửa lỗi để làm mốc đối chiếu trước/sau.
