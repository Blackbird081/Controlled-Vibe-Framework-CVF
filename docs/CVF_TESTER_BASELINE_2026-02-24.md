# CVF Tester Baseline Snapshot | 25/02/2026

**Vai trò:** Independent Tester  
**Ngày snapshot chạy test thực tế:** 25/02/2026  
**Mục đích:** Lưu mốc đối chiếu cố định cho các đợt đánh giá/fix tiếp theo.

---

## 1. Đánh giá tổng quan

- **Mức độ hoàn thiện:** **9.4/10**
- **Mức sẵn sàng:** **Release Candidate**
- **Kết luận tester:** Không còn blocker chức năng trong phạm vi đã kiểm chứng; còn rủi ro vận hành local mức thấp liên quan lock file `.next` trên Windows.

---

## 2. Kết quả quality gate (snapshot này)

### 2.1 `cvf-web` (`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`)

1. Lint: **PASS**
   - `npm run lint`
   - Kết quả: `0 errors`, `0 warnings`
2. Test run: **PASS**
   - `npm run test:run`
   - Test suites: `372/372` pass
   - Tests: `1480/1483` pass, `0` fail, `3` skipped
3. Coverage: **PASS**
   - `npm run test:coverage`
   - Statements: **93.01%**
   - Branches: **80.46%**
   - Functions: **91.33%**
   - Lines: **94.16%**
4. Build:
   - `npm run build` (run thường): có thể fail `EPERM unlink .next/app-path-routes-manifest.json`
   - `npm run build` (elevated): **PASS**

### 2.2 Extension modules

1. `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE`: **PASS** (`138/138`)
2. `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME`: **PASS** (`97/97`)
3. `EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD`: **PASS** (`49/49`)

---

## 3. Rủi ro còn lại để theo dõi

1. **R1 - Build local lock `.next` (Windows)**
   - Mức độ: thấp
   - Ảnh hưởng: làm nhiễu xác minh local, không phải lỗi logic sản phẩm.
2. **R2 - stderr noise trong test logs**
   - Mức độ: thấp
   - Ảnh hưởng: log CI khó đọc hơn, không làm fail test.

---

## 4. Chuẩn đối chiếu cho lần sau

Khi chạy lại đánh giá, so sánh trực tiếp với snapshot này theo 5 chỉ số:
1. `lint errors/warnings`
2. `test pass/fail/skipped`
3. `coverage (statements/branches/functions/lines)`
4. `build pass rate (normal vs elevated)`
5. `extension smoke tests (138/97/49)`

