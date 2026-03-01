## 🔨 PHASE C: Output Build

### Skill Preflight Declaration
"Skill Preflight PASS.
Using skill: CVF_CORE_SKILL_PREFLIGHT_GOVERNANCE.
Mapped record: governance/toolkit/03_CONTROL/CVF_CORE_SKILL_PREFLIGHT_GOVERNANCE.mapping.md.
Phase: Build. Risk: R1.
Execution allowed under CVF."

Preflight trace:
- `XD_App/DOCUMENTS/SKILL_PREFLIGHT_RECORD.md` (record `XD-SPF-001`)

### Deliverable 1: Desktop Runtime & Core Infrastructure
- `XD_App/package.json`
- `XD_App/main.js`
- `XD_App/preload.js`
- `XD_App/src/db/client.js`
- `XD_App/src/db/migrations.js`

Kết quả:
- Tạo app Electron chạy local.
- Khởi tạo SQLite + migration tự động khi mở app.
- Tạo IPC boundary an toàn (contextIsolation).

### Deliverable 2: Nghiệp vụ Khai thác
- `XD_App/src/services/productionService.js`
- UI form + bảng trong `XD_App/renderer/*`

Kết quả:
- Nhập tay sản lượng theo ngày.
- Import Excel (`.xlsx`) với map cột linh hoạt.
- Ghi audit cho create/import.

### Deliverable 3: Nghiệp vụ Thương vụ
- `XD_App/src/services/commercialService.js`
- UI hợp đồng + xác nhận thanh toán

Kết quả:
- Quản lý hợp đồng đơn giá cố định.
- Xác nhận sản lượng thanh toán theo hợp đồng.
- Tự tính thành tiền nếu không nhập tay.

### Deliverable 4: Nghiệp vụ Nhân sự & Lương
- `XD_App/src/services/hrService.js`
- UI nhân sự, chấm công, bảng lương

Kết quả:
- Quản lý danh mục nhân sự theo nhóm DRIVER/TEAM/INDIRECT.
- Upsert chấm công theo ngày.
- Tính lương tháng theo quy tắc:
  - Driver: theo ngày công
  - Team: chia pool theo hệ số * ngày công
  - Indirect: lương cố định

### Deliverable 5: Đối chiếu, Dashboard, Audit
- `XD_App/src/services/reportService.js`
- `XD_App/src/services/auditService.js`
- Dashboard + Report + Audit tab trong renderer

Kết quả:
- So sánh Khai thác vs Thương vụ theo kỳ tháng.
- Dashboard KPI cho giám đốc.
- Log audit đầy đủ hành động chính.

### Deliverable 6: Tài liệu kỹ thuật
- `XD_App/README.md`
- `XD_App/DOCUMENTS/ARCHITECTURE.md`
- `XD_App/DOCUMENTS/DATABASE_SCHEMA.md`

### Ghi chú Implementation
- Chọn `better-sqlite3` để đảm bảo tốc độ truy vấn cục bộ.
- Dữ liệu lưu ở `userData` của Electron nên app portable, không phụ thuộc repo.
- Kiến trúc service-first để sẵn đường mở rộng web export.

---
✅ Build hoàn thành. Chuyển sang Review phase.
