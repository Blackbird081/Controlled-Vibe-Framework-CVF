# 📄 Output Contract

**CVF v1.3.1 – Operator Edition**

---

## Mục tiêu

Xác định rõ **đầu ra hợp lệ** của CVF v1.3.1 cho operator: cái gì được coi là hoàn thành, cái gì là không hợp lệ.

---

## Output bắt buộc (Required)

Mọi execution CVF **phải** có 3 phần sau:

### 1. Final Result

- Câu trả lời/giải pháp cuối cùng theo đúng input contract
- Không chứa "còn phụ thuộc vào..."
- Không chứa "cần thêm thông tin..."

### 2. Assumption Summary

- Danh sách giả định AI đã tự đặt (nếu có)
- Nếu không có giả định: ghi rõ "Không có giả định ngoài input"

### 3. Constraint Compliance

- Xác nhận tuân thủ `00_SCOPE_AND_BOUNDARY`
- Tuyên bố không vượt quyền

---

## Output khuyến nghị (Optional)

| Field | Mục đích |
|-------|----------|
| **Reasoning Summary** | Tóm tắt logic (không chi tiết) |
| **Risk Note** | Nếu kết quả có vùng mơ hồ |
| **Alternative Paths** | Nếu có nhiều cách tiếp cận |

---

## Output KHÔNG hợp lệ

❌ **Thiếu kết quả cuối cùng**

- "Tôi cần thêm thông tin để..."

❌ **Lộ prompt nội bộ / chain-of-thought**

- Hiển thị reasoning chi tiết không được yêu cầu

❌ **Yêu cầu operator can thiệp giữa chừng**

- "Bạn có muốn tôi tiếp tục không?"

❌ **Đổ lỗi cho input**

- "Input không rõ ràng nên..."

---

## Ví dụ Output hợp lệ

```
## Final Result
[Kết quả cụ thể theo yêu cầu]

## Assumption Summary
- Giả định 1: ...
- Giả định 2: ...

## Constraint Compliance
✅ Tuân thủ SCOPE_AND_BOUNDARY
✅ Không vượt quyền
✅ Không mở rộng scope
```

---

## Quy tắc cuối

> Nếu output yêu cầu operator phải "hiểu thêm" để dùng được → output đã thất bại.

---

*Kết thúc Output Contract.*
