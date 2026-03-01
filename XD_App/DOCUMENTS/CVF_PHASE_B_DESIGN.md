## 📐 PHASE B: Kế hoạch Thiết kế

### 1. Hướng Giải pháp
- Xây desktop app local-first bằng Electron để chạy Windows ổn định, không phụ thuộc internet.
- Dùng SQLite nhúng trực tiếp để đảm bảo offline 100%.
- Tách service theo 3 domain (`production`, `commercial`, `hr`) + `report`, `audit` để dễ mở rộng web export.
- Renderer dùng form + bảng dữ liệu cho thao tác vận hành hàng ngày.

### 2. Quyết định Kỹ thuật đã đưa ra
| Quyết định | Lựa chọn | Lý do |
|------------|----------|-------|
| Desktop runtime | Electron | Dễ đóng gói Windows, UI linh hoạt, local DB tốt |
| Local database | SQLite + better-sqlite3 | Nhanh, đơn giản, không cần server |
| Excel import | exceljs | Parse file `.xlsx` trực tiếp offline |
| UI architecture | Multi-tab single window | Tương thích workflow 3 phòng ban |
| Payroll engine | Rule-based service trong backend | Minh bạch logic, dễ audit |
| Audit log | Table `audit_logs` | Theo dõi đầy đủ thao tác C/U/D và job tính toán |

### 3. Kế hoạch Thực hiện
- Bước 1: Khởi tạo cấu trúc app và IPC bridge.
- Bước 2: Thiết kế schema + migration SQLite.
- Bước 3: Build service module Khai thác / Thương vụ / Nhân sự.
- Bước 4: Build engine tính lương + đối chiếu.
- Bước 5: Build UI dark mode và binding thao tác.
- Bước 6: Viết tài liệu vận hành + đóng gói.

### 4. Deliverables dự kiến
- [x] Runtime desktop app độc lập
- [x] Database schema + migration
- [x] 3 module nhập liệu nghiệp vụ
- [x] Đối chiếu sản lượng + dashboard báo cáo
- [x] Tính lương theo 3 cơ chế
- [x] Audit log
- [x] Hướng dẫn setup + packaging

### 5. Rủi ro tiềm ẩn
- Rủi ro 1: Mẫu Excel đầu vào không đồng nhất.
Cách giảm thiểu: Hỗ trợ map header linh hoạt + bỏ qua dòng lỗi.
- Rủi ro 2: Sai lệch logic lương thực tế doanh nghiệp.
Cách giảm thiểu: Tách payroll config, cho phép điều chỉnh trong phase kế tiếp.
- Rủi ro 3: Dữ liệu đơn máy.
Cách giảm thiểu: Thiết kế module service tách lớp để mở rộng sync/web export.

### 6. Skill Preflight Gate (Pilot 2026-03-01)
- [x] Da xac dinh skill dung cho Build action.
- [x] Skill da co mapping record hop le.
- [x] Skill phu hop Phase Build va Risk R1.
- [x] Da co preflight declaration truoc khi cap nhat artifact.
- Preflight evidence: `XD_App/DOCUMENTS/SKILL_PREFLIGHT_RECORD.md` (record `XD-SPF-001`).

---
⏸️ **CHECKPOINT B**: Theo chỉ đạo "không can thiệp", checkpoint được auto-approved để chuyển thẳng Build.
