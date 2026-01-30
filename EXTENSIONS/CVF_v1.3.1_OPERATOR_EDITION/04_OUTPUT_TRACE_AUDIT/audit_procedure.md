# 🔍 Audit Procedure

**CVF v1.3.1 – Operator Edition**

Quy trình audit chuẩn — hoàn thành trong ≤5 phút.

---

## Nguyên tắc Audit

Audit phải:
- ⚡ **Nhanh** — không quá 5 phút
- 🧊 **Lạnh** — không cảm tính
- 🚫 **Không tranh luận** — không hỏi lại AI

> Operator không hỏi lại AI sau audit.

---

## Trình tự Audit chuẩn

### Step 1 — Kiểm tra Output

| Câu hỏi | Kết quả |
|---------|---------|
| Đúng format? | YES/NO |
| Đủ field bắt buộc? | YES/NO |
| Có yêu cầu can thiệp? | YES/NO |

❌ Bất kỳ NO → **Fail (Execution Failure)**

---

### Step 2 — Kiểm tra Trace

| Câu hỏi | Kết quả |
|---------|---------|
| Có đủ 3 phần? | YES/NO |
| Có lan man/over-explain? | YES/NO |
| Có tuyên bố boundary? | YES/NO |

❌ Không đủ → **Fail (Trace Failure)**

---

### Step 3 — Boundary Check

| Câu hỏi | Kết quả |
|---------|---------|
| Có dấu hiệu vượt scope? | YES/NO |
| Có giả định ngầm không khai báo? | YES/NO |
| Có đổ lỗi cho input? | YES/NO |

❌ Có bất kỳ → **Fail (Boundary Violation)**

---

## Audit Result

Audit chỉ có **2 kết quả**:

| Result | Ý nghĩa |
|--------|---------|
| ✅ **PASS** | Output + Trace + Boundary đều OK |
| ❌ **FAIL** | Có ít nhất 1 violation |

> Không có "tạm chấp nhận".  
> Không có "ổn rồi, dùng được".

---

## Ghi nhận Audit

Audit log chỉ cần:

```
timestamp: 2026-01-30T17:35:00
input_version: v1.0
result: PASS | FAIL
failure_type: F1 | F2 | F3 | F4 (nếu FAIL)
```

Không ghi nhận:
- Cảm xúc
- Nhận xét cá nhân
- "Có thể tốt hơn nếu..."

---

## Checklist nhanh (1 phút)

- [ ] Input đúng input_spec_minimal
- [ ] Không có can thiệp ngoài scope
- [ ] Output đầy đủ 3 phần bắt buộc
- [ ] Không vi phạm execution rules
- [ ] Có thể tái lặp (replayable)

---

*Kết thúc Audit Procedure.*
