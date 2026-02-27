# Auto Documentation (Vietnamese)

> **Domain:** App Development
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

- [ ] App đã hoàn thành Phase D (Review) và sẵn sàng để ship
- [ ] App có thể khởi động bằng ≤ 3 bước

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Cuối Phase D (Review), trước khi bàn giao app cho người dùng
- Cần tạo file `HUONG_DAN.md` bằng tiếng Việt dễ hiểu
- Muốn có sẵn danh sách lỗi thường gặp và cách xử lý nhanh

**Không phù hợp khi:**
- App dành cho developer (dùng README.md kỹ thuật thay thế)
- App quá phức tạp cần tài liệu chuyên sâu (dùng AGT-016)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Builder, Reviewer |
| Allowed Phases | Review |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | Quick Start ≤ 3 phút, Common errors documented, Launch file verified |

---

## ⛔ Execution Constraints

- CẤM viết hướng dẫn cài đặt phức tạp (conda, virtualenv, Docker)
- PHẢI tạo file `HUONG_DAN.md` bằng tiếng Việt
- PHẢI có mục "3 phút để bắt đầu" (Quick Start)
- PHẢI có file `.bat` (Windows) hoặc lệnh tắt để User click là chạy

---

## ✅ Validation Hooks

- Check Quick Start có ≤ 5 bước, mỗi bước ≤ 1 câu
- Check có ít nhất 3 lỗi thường gặp với cách xử lý
- Check có file khởi động hoặc lệnh copy-paste
- Check toàn bộ tài liệu không có thuật ngữ kỹ thuật không giải thích

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-non_coder_workflow-05_auto_documentation_vn.md`
- UAT Objective: Tài liệu phải đủ để người không biết code tự chạy app thành công trong 5 phút

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Tên app** | Tên đầy đủ của app | ✅ | "FinanceTracker — Theo dõi chi tiêu gia đình" |
| **Cách khởi động** | Lệnh hoặc file để chạy app | ✅ | "Bấm đúp vào START.bat" hoặc "streamlit run app.py" |
| **Tính năng chính** | 3-5 tính năng người dùng hay dùng | ✅ | "1. Ghi chi tiêu 2. Xem báo cáo 3. Xuất Excel" |
| **Hệ điều hành** | Windows / Mac / Linux | ✅ | "Windows 10/11" |
| **Lỗi thường gặp** | Những lỗi thường xảy ra khi dùng | ❌ | "App không mở được, dữ liệu không lưu" |

---

## ✅ Expected Output

**File `HUONG_DAN.md` được tạo tự động:**

```markdown
# 📖 Hướng dẫn sử dụng — FinanceTracker

## ⚡ 3 phút để bắt đầu

1. **Mở app:** Bấm đúp vào file `START.bat` trong thư mục
2. **Đăng nhập:** Dùng tên đăng nhập mặc định: `admin` / mật khẩu: `1234`
3. **Ghi chi tiêu:** Bấm nút "➕ Ghi chi tiêu" màu xanh, điền số tiền và bấm Lưu

✅ Xong! App đã sẵn sàng.

---

## 🗺️ Các tính năng chính

### 1. Ghi chi tiêu
Bấm nút "➕ Ghi chi tiêu" → chọn danh mục → nhập số tiền → Lưu

### 2. Xem báo cáo tháng
Bấm "📊 Báo cáo" → chọn tháng → biểu đồ hiện ra tự động

### 3. Xuất ra Excel
Bấm "📥 Xuất Excel" → chọn thư mục lưu → bấm OK

---

## 🆘 Lỗi thường gặp và cách xử lý nhanh

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| App không mở được | Chưa cài Python | Chạy file `INSTALL.bat` trước |
| Dữ liệu không hiện | File database bị di chuyển | Kéo file `data.db` vào thư mục `data/` |
| Màn hình trắng | Trình duyệt cache cũ | Bấm Ctrl+Shift+R để tải lại |

---

## 📞 Liên hệ hỗ trợ
Nếu gặp vấn đề không có trong danh sách trên, chụp màn hình và liên hệ: [thông tin liên hệ]
```

---

## 🔍 Cách đánh giá

**Checklist Accept:**
- [ ] Quick Start có ≤ 5 bước, đủ để khởi động app
- [ ] Có ít nhất 3 lỗi thường gặp với hướng dẫn xử lý
- [ ] Không có thuật ngữ kỹ thuật chưa được giải thích
- [ ] File `HUONG_DAN.md` được tạo (không phải chỉ mô tả)

**Red flags (Reject):**
- ⚠️ Quick Start yêu cầu cài đặt conda/virtualenv/Docker
- ⚠️ Dùng từ "terminal", "command line", "pip install" mà không giải thích
- ⚠️ Không có hướng dẫn xử lý lỗi

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|-----------------|
| Quá kỹ thuật | Mỗi bước phải làm được mà không cần mở terminal |
| Thiếu lỗi thường gặp | Hỏi User: "Điều gì hay làm họ bối rối khi dùng app?" |
| Không có file khởi động | Luôn tạo `START.bat` (Windows) hoặc `start.sh` (Mac/Linux) |

---

## 💡 Tips

1. **Test với người thật** — Nhờ 1 người không biết code đọc và thử theo hướng dẫn
2. **Ảnh chụp màn hình** — Thêm screenshot vào Quick Start giúp 10x
3. **Số điện thoại / email hỗ trợ** — Luôn có kênh liên hệ cuối tài liệu
4. **Cập nhật định kỳ** — Khi thêm tính năng mới, cập nhật `HUONG_DAN.md` ngay

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Tên app: "StockCheck — Kiểm kho siêu thị"
Cách khởi động: "Bấm đúp START.bat"
Tính năng chính: "1. Quét mã vạch 2. Xem tồn kho 3. Nhập hàng"
Hệ điều hành: Windows 10
```

### Output mẫu: tạo ra: File `HUONG_DAN.md` với đủ 4 section
### Đánh giá:
- ✅ Quick Start 3 bước không cần terminal
- ✅ 3 lỗi thường gặp được ghi rõ
- ✅ File thực sự được tạo ra
- **Kết quả: ACCEPT**

---

## 🔗 Next Step

Sau khi có HUONG_DAN.md → [Portable Packaging](./06_portable_packaging.skill.md)

---

## 🔗 Related Skills — Kiểm tra UX trước khi viết tài liệu
- [Portable Packaging](./06_portable_packaging.skill.md) — Đóng gói app trước khi bàn giao

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-27 | Khởi tạo từ CVF-Compatible Skills intake |

---

*Auto Documentation (Vietnamese) — CVF v1.5.2 Non-coder Workflow Skill Library*
