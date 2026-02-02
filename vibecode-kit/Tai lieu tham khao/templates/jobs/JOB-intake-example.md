# JOB JOB-EXAMPLE – Intake

## 1. Bối cảnh & Mục tiêu

**Bối cảnh:**
Hiện tại team có nhiều file ảnh trong thư mục `images/` với tên không theo quy chuẩn (có dấu cách, ký tự đặc biệt, viết hoa lẫn lộn). Điều này gây khó khăn khi deploy lên web server.

**Mục tiêu:**
Tạo một script Python để rename tất cả file ảnh theo format chuẩn: `lowercase-with-dashes.ext`

## 2. Phạm vi (Scope)

**Trong phạm vi:**
- Script xử lý các định dạng: .jpg, .jpeg, .png, .gif, .webp
- Chạy từ command line với tham số là đường dẫn thư mục
- Log ra màn hình các file đã đổi tên

**Ngoài phạm vi:**
- Không xử lý file trong subfolder (chỉ folder gốc)
- Không xử lý video
- Không có GUI

## 3. Đầu ra mong muốn (Deliverables)

| # | Deliverable | Mô tả |
|---|-------------|-------|
| 1 | `rename_images.py` | Script Python chạy được |
| 2 | README trong folder script | Hướng dẫn sử dụng |

## 4. Ràng buộc (Constraints)

**Kỹ thuật:**
- Python 3.8+
- Chỉ dùng thư viện chuẩn (os, pathlib, re)
- Không ghi đè file nếu tên mới đã tồn tại

**Thời gian:**
- Hoàn thành trong 1 ngày

**Nguồn lực:**
- 1 developer + Claude Code

## 5. Định nghĩa "xong" (Definition of Done)

- [ ] Script chạy không lỗi với folder test
- [ ] Tất cả file được rename đúng format
- [ ] Không mất file nào
- [ ] Có README hướng dẫn
