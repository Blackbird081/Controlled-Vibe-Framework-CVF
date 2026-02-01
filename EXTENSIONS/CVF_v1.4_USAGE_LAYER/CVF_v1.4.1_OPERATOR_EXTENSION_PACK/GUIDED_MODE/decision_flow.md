# Decision Flow – Khi nào tiếp tục, khi nào dừng

**CVF v1.4.1 – Operator Extension Pack**

File này cung cấp luồng quyết định tối thiểu để operator không làm sai nhịp khi dùng CVF. Đây không phải workflow kỹ thuật, mà là **flow nhận thức**.

> Nếu bạn chưa đọc `guided_entry.md`, hãy đọc trước.

---

## 1. Nguyên tắc cốt lõi

**Operator chỉ ra quyết định ở các điểm cho phép.**

Mọi quyết định ngoài các điểm dưới đây đều bị xem là **can thiệp execution**.

---

## 2. Luồng chuẩn (Happy Flow)

```
┌─────────────────┐
│ Chuẩn bị Input  │  ← Operator quyết định ở đây
└────────┬────────┘
         ▼
┌─────────────────┐
│  Execute CVF    │  ← Không can thiệp
└────────┬────────┘
         ▼
┌─────────────────┐
│  Nhận Output    │
└────────┬────────┘
         ▼
┌─────────────────────────┐
│ Review theo Contract    │
└────────┬────────────────┘
         ▼
┌─────────────────┐
│ Accept / Reject │  ← Operator quyết định ở đây
└─────────────────┘
```

Operator chỉ được quyết định tại **2 điểm**:
1. **Trước khi Execute** — Khóa input
2. **Sau khi Review Output** — Accept hoặc Reject

---

## 3. Các điểm DỪNG BẮT BUỘC

### 🛑 Stop Point A – Input không chắc chắn

Nếu trong lúc viết input, bạn:
- Phải suy nghĩ lại quá nhiều lần
- Không chắc AI có được phép tự quyết hay không

→ **DỪNG.** Quay lại `02_INPUT_CONTRACT/`.

---

### 🛑 Stop Point B – Muốn can thiệp giữa chừng

Nếu trong lúc AI đang xử lý, bạn muốn:
- Thêm điều kiện
- Sửa yêu cầu
- "Giải thích thêm cho AI"

→ **DỪNG NGAY.** Execution đã bị phá.

---

### 🛑 Stop Point C – Output gây khó chịu nhưng đúng contract

Nếu output:
- ✅ Đúng format
- ✅ Đúng boundary
- ❌ Nhưng không giống mong muốn cá nhân

→ **KHÔNG sửa.** Đây là case **Expectation Drift**.

Tham chiếu: `SELF_CHECK/misuse_patterns.md`

---

## 4. Khi nào Retry được phép?

Retry **CHỈ được phép** khi:

| Điều kiện | Status |
|-----------|:------:|
| Input ban đầu đúng | ✅ |
| Execution không bị can thiệp | ✅ |
| Output vi phạm contract rõ ràng | ✅ |

Tham chiếu: `13_FAILURE_UX/retry_vs_reject_policy.md`

---

## 5. Khi nào BẮT BUỘC Reject?

Reject khi:
- ❌ Boundary bị vi phạm
- ❌ AI suy đoán ngoài scope
- ❌ Output thiếu phần bắt buộc

> **Reject ≠ thất bại hệ thống.**  
> Reject là cơ chế bảo vệ CVF.

---

## 6. Anti-pattern cần tránh

| Anti-pattern | Hậu quả |
|--------------|---------|
| Sửa output cho nhanh | Mất audit integrity |
| Prompt lại ngay | Che lỗi gốc |
| Đổ lỗi cho AI | Sai vai trò |

---

## 7. Decision Flow Summary

```
Input OK?
  ├── NO  → Stop, fix input
  └── YES → Execute
              ↓
        Output OK?
          ├── Contract violated → Reject + Log
          ├── Boundary violated → Reject + Log
          └── OK → Accept
```

---

> Nếu bạn phải nhìn decision_flow quá thường xuyên → hãy xem lại cách bạn chuẩn bị input.

---

*Thuộc CVF v1.4.1 Operator Extension Pack*