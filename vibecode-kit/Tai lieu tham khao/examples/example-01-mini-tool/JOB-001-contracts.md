# JOB JOB-001 – Contracts

## STEP 1 – Setup project structure và CLI skeleton

**Mục tiêu:**
- Tạo file `rename_images.py` với CLI interface cơ bản
- Có thể chạy `--help` và nhận path từ argument

**File liên quan:**
- `rename_images.py`

**Yêu cầu kỹ thuật:**
- Dùng `argparse` cho CLI
- Nhận 1 positional argument: `directory`
- Có option `--dry-run` để chỉ preview, không rename thật
- Validate directory tồn tại

**Tiêu chí nghiệm thu (GATE 1):**
- [x] Chạy `python rename_images.py --help` hiển thị usage
- [x] Chạy với path không tồn tại → báo lỗi rõ ràng
- [x] Chạy với path hợp lệ → không crash

---

## STEP 2 – Implement scan và filter logic

**Mục tiêu:**
- Scan thư mục và filter ra các file ảnh
- Log danh sách file tìm được

**File liên quan:**
- `rename_images.py`

**Yêu cầu kỹ thuật:**
- Dùng `pathlib.Path.glob()` để scan
- Filter extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` (case-insensitive)
- Chỉ lấy file, không lấy directory

**Tiêu chí nghiệm thu (GATE 2):**
- [x] Chạy với folder có 5 file ảnh → list ra đúng 5 file
- [x] Bỏ qua file không phải ảnh (.txt, .pdf)
- [x] Bỏ qua subfolder

---

## STEP 3 – Implement name transformation logic

**Mục tiêu:**
- Viết function chuyển đổi tên file theo quy tắc

**File liên quan:**
- `rename_images.py`

**Yêu cầu kỹ thuật:**
- Function: `normalize_name(filename: str) -> str`
- Chuyển lowercase
- Thay dấu cách → `-`
- Thay ký tự đặc biệt (không phải a-z, 0-9, -) → `-`
- Loại bỏ `-` ở đầu và cuối
- Gộp nhiều `-` liên tiếp thành 1

**Tiêu chí nghiệm thu (GATE 3):**
- [x] `"My Photo.jpg"` → `"my-photo.jpg"`
- [x] `"image@2x.png"` → `"image-2x.png"`
- [x] `"---test---.jpg"` → `"test.jpg"`

---

## STEP 4 – Implement rename và xử lý trùng tên

**Mục tiêu:**
- Thực hiện rename file
- Xử lý trường hợp trùng tên

**File liên quan:**
- `rename_images.py`

**Yêu cầu kỹ thuật:**
- Nếu tên mới đã tồn tại → thêm suffix `-1`, `-2`, ...
- Dùng `Path.rename()` để đổi tên
- Log: `✓ old_name → new_name`
- Nếu tên không đổi → skip, log `- filename (không đổi)`

**Tiêu chí nghiệm thu (GATE 4):**
- [x] Rename thành công các file
- [x] Không mất file
- [x] Xử lý đúng trùng tên

---

## STEP 5 – Implement dry-run mode và README

**Mục tiêu:**
- Hoàn thiện `--dry-run` mode
- Viết README hướng dẫn

**File liên quan:**
- `rename_images.py`
- `README.md`

**Yêu cầu kỹ thuật:**
- `--dry-run`: chỉ log preview, không rename thật
- README có:
  - Mô tả tool
  - Cách cài đặt (yêu cầu Python)
  - Cách sử dụng với ví dụ
  - Các option

**Tiêu chí nghiệm thu (GATE 5):**
- [x] `--dry-run` không thay đổi file thật
- [x] README đầy đủ thông tin
- [x] Chạy full flow thành công
