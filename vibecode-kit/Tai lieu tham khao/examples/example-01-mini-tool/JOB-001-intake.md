# JOB JOB-001 – Intake

## 1. Bối cảnh & Mục tiêu

**Bối cảnh:**
Team có nhiều file ảnh trong thư mục `images/` với tên không theo quy chuẩn:
- Có dấu cách: `My Photo.jpg`
- Ký tự đặc biệt: `image@2x.png`
- Viết hoa lẫn lộn: `BannerHero.PNG`

Điều này gây lỗi khi deploy lên web server.

**Mục tiêu:**
Tạo script Python để rename tất cả file ảnh theo format chuẩn: `lowercase-with-dashes.ext`

## 2. Phạm vi (Scope)

**Trong phạm vi:**
- Xử lý các định dạng: .jpg, .jpeg, .png, .gif, .webp
- Chạy từ CLI với tham số là đường dẫn thư mục
- Log ra màn hình các file đã đổi tên
- Xử lý trùng tên (thêm suffix `-1`, `-2`, ...)

**Ngoài phạm vi:**
- Không xử lý subfolder (chỉ folder gốc)
- Không xử lý video
- Không có GUI

## 3. Đầu ra mong muốn (Deliverables)

| # | Deliverable | Mô tả |
|---|-------------|-------|
| 1 | `rename_images.py` | Script Python chạy được |
| 2 | `README.md` | Hướng dẫn sử dụng trong folder script |

## 4. Ràng buộc (Constraints)

**Kỹ thuật:**
- Python 3.8+
- Chỉ dùng thư viện chuẩn (os, pathlib, re, argparse)
- Không ghi đè file nếu tên mới đã tồn tại

**Thời gian:**
- Hoàn thành trong 1 session

**Nguồn lực:**
- 1 developer + Claude Code

## 5. Định nghĩa "xong" (Definition of Done)

- [x] Script chạy không lỗi với folder test
- [x] Tất cả file được rename đúng format
- [x] Không mất file nào
- [x] Có README hướng dẫn
