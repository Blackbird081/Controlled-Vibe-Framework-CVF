# VERSION COMPARISON — CVF v1.0 vs v1.1

## Tổng quan

| Tiêu chí | v1.0 | v1.1 |
|----------|------|------|
| **Mục đích** | Baseline tối giản | Kiểm soát chi tiết |
| **Đối tượng** | Người mới, project nhỏ | Project phức tạp, cần audit |
| **Triết lý** | Outcome > Code | Giữ nguyên |
| **Trạng thái** | FREEZE | FREEZE |

---

## Chi tiết so sánh

### 1. Ràng buộc Input/Output

| | v1.0 | v1.1 |
|-|------|------|
| Có spec chuẩn | ❌ | ✅ INPUT_SPEC, OUTPUT_SPEC |
| Field bắt buộc | ❌ | ✅ Objective, scope, constraint, acceptance |
| Validation checklist | ❌ | ✅ |
| Ví dụ mẫu | ❌ | ✅ .sample.md |

**Khi nào cần:** Task có nhiều stakeholder, cần review rõ ràng, tránh mơ hồ.

---

### 2. Phân vai Agent

| | v1.0 | v1.1 |
|-|------|------|
| Định nghĩa AI role | Chung ("executor") | 6 Archetype chi tiết |
| Allowed/Forbidden | ❌ | ✅ Per archetype |
| Stop conditions | ❌ | ✅ Per archetype |
| Lifecycle | ❌ | ✅ 6 trạng thái |

**6 Archetype v1.1:**
- Analysis: phân tích, tìm gap
- Decision: ra quyết định
- Planning: lập kế hoạch
- Execution: thực thi
- Supervisor: giám sát
- Exploration: ý tưởng

**Khi nào cần:** Multi-agent, cần ngăn AI vượt quyền, cần audit hành vi AI.

---

### 3. Command Taxonomy

| | v1.0 | v1.1 |
|-|------|------|
| Chuẩn hóa action | ❌ | ✅ 7 command |
| Binding Archetype | ❌ | ✅ |
| Artifact bắt buộc | ❌ | ✅ Per command |

**7 Command v1.1:**
- CVF:PROPOSE, CVF:DECIDE, CVF:FREEZE (Governance)
- CVF:DESIGN, CVF:REFINE (Design)
- CVF:EXECUTE (Execution)
- CVF:REVIEW, CVF:AUDIT (Audit)

**Khi nào cần:** Cần audit trail, cần trace action → artifact.

---

### 4. Execution & Trace

| | v1.0 | v1.1 |
|-|------|------|
| Execution flow | Phase-based (A→D) | Execution Spine + AU |
| Action Unit | ❌ | ✅ Template đầy đủ |
| Trace checklist | ❌ | ✅ |
| Ví dụ multi-agent | ❌ | ✅ |

**Execution Spine v1.1:**
```
INPUT CONTRACT → SCOPE FREEZE → ACTION UNIT → EXECUTION → OUTPUT + TRACE
```

**Khi nào cần:** Cần trace từng bước, cần rollback, cần audit.

---

### 5. Governance mở rộng

| | v1.0 | v1.1 |
|-|------|------|
| Preset Library | ❌ | ✅ Per archetype |
| Fast Track | ❌ | ✅ Task nhỏ < 2h |
| Extension Register | ❌ | ✅ |

**Khi nào cần:** Cần policy hành vi chi tiết, cần luồng nhanh cho task nhỏ.

---

## Ma trận lựa chọn

| Tình huống | Khuyến nghị |
|------------|-------------|
| Học vibe coding lần đầu | v1.0 |
| Project cá nhân, 1-2 người | v1.0 |
| MVP nhanh, không cần audit | v1.0 |
| Team > 3 người | v1.1 |
| Cần review formal | v1.1 |
| Multi-agent orchestration | v1.1 |
| Compliance/audit requirement | v1.1 |
| Task nhỏ trong project lớn | v1.1 (Fast Track) |

---

## Kết hợp v1.0 + v1.1

Có thể dùng v1.0 làm base và bật module v1.1 theo nhu cầu:

1. **Base v1.0**: phases, governance cơ bản
2. **+ INPUT/OUTPUT spec**: khi cần ràng buộc I/O
3. **+ Agent Archetype**: khi dùng multi-agent
4. **+ Command + Execution**: khi cần trace đầy đủ

Xem [MIGRATION_GUIDE.md](../v1.1/MIGRATION_GUIDE.md) để biết cách kết hợp.

---

## Điểm đánh giá (thang 10)

| Tiêu chí | v1.0 | v1.1 |
|----------|:----:|:----:|
| Dễ học | 9 | 7 |
| Dễ áp dụng | 9 | 7 |
| Kiểm soát AI | 6 | 9 |
| Trace/Audit | 5 | 9 |
| Ràng buộc I/O | 4 | 9 |
| Multi-agent | 4 | 9 |
| **Tổng** | **~7** | **~8.5** |

---

**Kết luận:** v1.0 cho đơn giản, v1.1 cho kiểm soát. Cả hai đều production-ready.
