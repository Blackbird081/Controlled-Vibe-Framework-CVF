# JOB JOB-001 – Blueprint

## 1. Tóm tắt

Tạo một CLI tool bằng Python để chuẩn hóa tên file ảnh trong một thư mục:
- Chuyển tất cả thành lowercase
- Thay dấu cách và ký tự đặc biệt bằng dấu gạch ngang `-`
- Giữ nguyên extension

## 2. Luồng chính (Main Flow)

```
[User chạy script] → [Scan folder] → [Filter image files] → [Generate new names] → [Rename files] → [Log kết quả]
```

**Chi tiết:**
1. User chạy: `python rename_images.py /path/to/images`
2. Script scan folder, lấy danh sách file ảnh (.jpg, .png, .gif, .webp)
3. Với mỗi file:
   - Lấy tên file (không có extension)
   - Chuyển thành lowercase
   - Thay dấu cách → `-`
   - Thay ký tự đặc biệt → `-`
   - Loại bỏ `-` thừa (đầu, cuối, liên tiếp)
4. Kiểm tra trùng tên → thêm suffix nếu cần
5. Thực hiện rename
6. Log ra màn hình: `old_name → new_name`

## 3. Thành phần & File liên quan

| Thành phần | Mô tả | File/Path |
|------------|-------|-----------|
| Main script | Logic rename | `rename_images.py` |
| README | Hướng dẫn sử dụng | `README.md` |

## 4. Rủi ro & Giả định

**Rủi ro:**
| Rủi ro | Mức độ | Cách giảm thiểu |
|--------|--------|-----------------|
| Trùng tên sau rename | Trung bình | Thêm suffix `-1`, `-2` |
| File đang được dùng | Thấp | Báo lỗi, skip, tiếp tục |

**Giả định:**
- User có quyền write trong thư mục
- Tên file không quá dài (< 255 ký tự)

## 5. Ghi chú thêm

- Sử dụng `pathlib` thay vì `os.path` để code clean hơn
- Dùng `argparse` cho CLI interface
