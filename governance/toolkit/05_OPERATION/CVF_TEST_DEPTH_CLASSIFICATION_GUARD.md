# CVF Test Depth Classification Guard

> **Loại:** Governance Guard (Mandatory khi report test metrics)
> **Trigger:** Bất kỳ báo cáo test count nào trong baseline review, assessment, release gate, hoặc conformance report.
> **Mục đích:** Phân loại tests theo depth để tăng độ tin cậy cho số liệu và giúp người đánh giá phân biệt được "test nhiều" vs "test có nghĩa".

---

## 1. Bốn tầng phân loại (Test Tiers)

| Tier | Tên | Ý nghĩa | Ví dụ |
|---|---|---|---|
| **T1** | **Structural** | Kiểm cấu trúc, schema, import, types, barrel export | `index.test.ts` (barrel), type shape check, import resolve |
| **T2** | **Behavioral** | Kiểm logic nghiệp vụ chính, happy path, state transition | `advanceStage()` success, policy PASS, state A→B |
| **T3** | **Boundary** | Kiểm edge case, error path, guard clause, rejection | null input, invalid state, overflow, skill revoked → blocked |
| **T4** | **Integration** | Kiểm cross-module, cross-extension, pipeline xuyên suốt | GovernanceExecutor pipeline, cross-extension conformance, remediation chain |

### Phân loại nhanh

```
Test chỉ check "import X thành công"?        → T1
Test check "function X trả kết quả đúng"?    → T2
Test check "function X reject input sai"?     → T3
Test check "X gọi Y gọi Z đúng thứ tự"?     → T4
```

---

## 2. Quy tắc báo cáo

### 2.1 Báo cáo test count phải kèm tier breakdown

**Đúng:**
```
Tests: 341/341 PASS
  T1 (Structural):   42  (12%)
  T2 (Behavioral):  148  (43%)
  T3 (Boundary):    98   (29%)
  T4 (Integration): 53   (16%)
  Meaningful (T2+T3+T4): 299/341 (88%)
```

**Sai:**
```
Tests: 341 PASS    ← không có breakdown, không biết depth
```

### 2.2 Chỉ số chính: "Meaningful Assertion Rate"

```
Meaningful Assertion Rate = (T2 + T3 + T4) / Total Tests × 100%
```

- **≥ 70%:** Healthy — phần lớn tests kiểm logic thật
- **50–69%:** Acceptable — nhưng nên bổ sung T3/T4
- **< 50%:** Cần review — quá nhiều structural tests, ít giá trị kiểm soát

### 2.3 T1 không nên vượt 30% tổng test count

- T1 có giá trị (đảm bảo exports, schemas đúng) nhưng không phải meaningful assertion
- Nếu T1 > 30%, cần đặt câu hỏi: "có đang pad test count không?"

---

## 3. Quy tắc áp dụng

### 3.1 Khi nào bắt buộc phân loại?

| Ngữ cảnh | Bắt buộc? |
|---|---|
| Baseline review / independent assessment | ✅ Bắt buộc |
| Release gate report | ✅ Bắt buộc |
| Conformance report (Wave 1+) | ✅ Đã tự động — conformance scenarios = T4 |
| PR / commit message | ❌ Không bắt buộc (recommended khi > 10 tests) |
| Incremental test log entry | 🟡 Recommended — ghi tier nếu biết |

### 3.2 Cách phân loại khi không chắc tier

1. Đọc assertion cuối cùng trong test
2. Nếu assertion chỉ check `toBeDefined()`, `toBeInstanceOf()`, `toHaveProperty()` → **T1**
3. Nếu assertion check giá trị cụ thể của output → **T2**
4. Nếu assertion check `toThrow()`, reject, error message, boundary value → **T3**
5. Nếu test setup gọi >= 2 modules/extensions để tạo input → **T4**

### 3.3 Conformance scenarios luôn là T4

Mọi scenario trong `CVF_CONFORMANCE_SCENARIOS.json` tự động thuộc T4 (Integration) vì chúng kiểm cross-extension behavior.

---

## 4. Ví dụ phân loại thực tế (CVF hiện tại)

| Module | T1 | T2 | T3 | T4 | Total |
|---|---:|---:|---:|---:|---:|
| CVF Core v3.0 | ~5 | ~25 | ~19 | 0 | 49 |
| Phase Governance v1.1.1 | ~3 | ~14 | ~8 | ~6 | 31 |
| Skill Governance v1.2.2 | ~2 | ~15 | ~12 | 0 | ~29 |
| Conformance Wave 1 | 0 | 0 | 0 | 84 | 84 |

> **Ghi chú:** Các con số ở bảng trên là ước lượng đại diện. Bản phân loại chính xác nên được thực hiện khi chạy full assessment.

---

## 5. Guard enforcement

### Pre-publish check

Trước khi publish bất kỳ assessment/review/report nào có test count:

```
[ ] Test count có kèm tier breakdown không?
[ ] Meaningful Assertion Rate có được tính không?
[ ] T1 ratio có vượt 30% không? Nếu có, đã giải thích chưa?
```

### Lưu ý

- Guard này **không yêu cầu chạy lại tests** — chỉ yêu cầu *phân loại* tests khi report
- Nếu chưa phân loại đủ chính xác, ghi rõ "estimated tier breakdown" và đánh dấu cần audit
- Guard này bổ sung cho `CVF_TEST_DOCUMENTATION_GUARD.md`, không thay thế

---

> **Cập nhật:** 2026-03-08
> **ADR:** Không cần ADR riêng — đây là governance guard bổ sung, không thay đổi kiến trúc.
