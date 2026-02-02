# Hướng Dẫn Nhanh - Vibecode Kit v2.0

## Bạn cần gì?

- ChatGPT (GPT-4) - làm "Ông Thầu" (thiết kế)
- Claude Code hoặc Cursor - làm "Ông Thợ" (viết code)

---

## 3 Bước Duy Nhất

### Bước 1: Giao việc cho Thầu

Mở file `10_PROMPTS/01_master_prompt_architect.txt`, copy toàn bộ và dán vào ChatGPT.

Sau đó nói với ChatGPT:

```
Tôi muốn làm [MÔ TẢ DỰ ÁN CỦA BẠN]
```

Ví dụ:
- "Tôi muốn làm landing page bán khóa học online"
- "Tôi muốn làm dashboard quản lý đơn hàng"
- "Tôi muốn làm portfolio cá nhân"

### Bước 2: Duyệt Blueprint

ChatGPT sẽ đưa ra Blueprint (bản thiết kế) và Contracts (hợp đồng).

- Đọc qua xem có đúng ý không
- Nếu cần sửa, nói: "Sửa phần X thành Y"
- Nếu OK, nói: "Duyệt, cho tôi lệnh bài"

### Bước 3: Chuyển lệnh cho Thợ

Copy "Lệnh bài" từ ChatGPT và dán vào Claude Code/Cursor.

Thợ sẽ viết code. Xong!

---

## Mẹo Quan Trọng

| Sai | Đúng |
|-----|------|
| "Làm cho tôi cái web đẹp" | "Làm landing page bán giày, có hero section, testimonials, pricing" |
| "Sửa lỗi" | "Nút Buy Now không click được" |
| "Làm lại" | "Đổi màu nền từ trắng sang xanh nhạt" |

---

## Loại Sản Phẩm Hỗ Trợ

- `landing` - Trang đích, bán hàng
- `dashboard` - Bảng điều khiển
- `docs` - Tài liệu hướng dẫn
- `saas` - Ứng dụng SaaS
- `branding` - Portfolio, thương hiệu
- `app` - Ứng dụng web
- `ui` - Thư viện component

---

## Khi Gặp Lỗi

1. **Code lỗi?** → Copy lỗi, dán cho Thợ (Claude), nói "Sửa lỗi này"
2. **Không đúng ý?** → Quay lại Thầu (ChatGPT), nói "Tôi muốn thay đổi..."
3. **Muốn thêm tính năng?** → Nói với Thầu, lấy lệnh bài mới

---

## Ví Dụ Thực Tế

**Bạn:** "Tôi muốn làm landing page cho tiệm cà phê, có menu, giờ mở cửa, và form đặt bàn"

**Thầu (ChatGPT):** Đưa ra Blueprint với 5 sections: Hero, Menu, Hours, Booking Form, Footer

**Bạn:** "OK, cho lệnh bài"

**Thầu:** Đưa Coder Pack

**Bạn:** Copy dán vào Claude Code

**Thợ (Claude):** Viết code hoàn chỉnh

**Xong!**

---

*Vibecode Kit v2.0 - Biến AI thành đội ngũ của bạn*
