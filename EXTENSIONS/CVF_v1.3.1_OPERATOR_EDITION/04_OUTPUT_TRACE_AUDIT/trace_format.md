# 📄 Trace Format Specification

**CVF v1.3.1 – Operator Edition**

---

## Mục tiêu

Định nghĩa cấu trúc trace tối thiểu để operator có thể audit nhanh trong ≤5 phút.

---

## Trace bắt buộc — 3 phần

### 1. Decision Summary

AI xác nhận:
- Input đã được hiểu theo đúng contract
- Không cần thêm thông tin

**Ví dụ:**
> "Objective và Output Contract được hiểu đầy đủ theo input đã cung cấp."

---

### 2. Execution Confirmation

AI xác nhận:
- Execution đã hoàn tất
- Output được sinh ra chỉ dựa trên input
- Không có can thiệp từ Operator

**Ví dụ:**
> "Execution được thực hiện không có can thiệp từ Operator."

---

### 3. Boundary Declaration

AI tuyên bố:
- Không mở rộng scope
- Không thêm giả định (hoặc liệt kê nếu có)
- Không vượt quyền

**Ví dụ:**
> "Không có giả định ngoài input contract được sử dụng."

---

## Trace tối thiểu (cho audit log)

| Field | Mô tả |
|-------|-------|
| `timestamp` | Thời điểm execution |
| `input_hash` | Hash của input (để verify) |
| `output_hash` | Hash của output (để verify) |
| `failure_code` | Mã lỗi nếu có (F1, F2, F3, F4) |

---

## Trace KHÔNG được chứa

❌ Chiến thuật chi tiết  
❌ Logic reasoning dài  
❌ Lời khuyên cho operator  
❌ Gợi ý cải tiến  
❌ Giải thích "tại sao chọn cách này"  

---

## Quy tắc đọc Trace

1. Kiểm tra input/output hash (nếu có)
2. So khớp failure code
3. Đối chiếu audit checklist

> Nếu bạn phải đọc kỹ trace để "hiểu xem AI có làm đúng không" → trace đã thất bại.

---

*Kết thúc Trace Format.*
