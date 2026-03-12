# CVF Enterprise Implementation Plan (Task 8.6)

Đây là tài liệu đặc tả và kế hoạch triển khai cụ thể cho **Task 8.6 - Enterprise Features**.
Mục tiêu: Đưa CVF từ một công cụ cá nhân / nội bộ thành một giải pháp Governance cấp doanh nghiệp với đầy đủ phân quyền và luồng phê duyệt.

Date: 2026-03-12
Status: IN PROGRESS

---

## 1. Thành phần Cốt lõi (Backend Logic đã hoàn thành)
Phần lõi xử lý logic đã được implement tại `CVF_GUARD_CONTRACT/src/enterprise/enterprise.ts`:
- **Team Roles (RBAC)**: Định nghĩa 5 vai trò (`owner`, `admin`, `developer`, `reviewer`, `viewer`) kèm theo quyền hạn (Allowed Phases, Max Risk Level).
- **Approval Workflow Engine**: Quản lý các request bị `ESCALATE`. Hỗ trợ luồng `createRequest`, `approve`, `reject`, `expire` (time-out sau 24h).
- **Compliance Reporter**: Tự động generate báo cáo tuân thủ từ các Guard Results, tính điểm Compliance Score (0-100).

---

## 2. Kế hoạch Triển khai Frontend & Integration (Các bước tiếp theo)

Để hệ thống Enterprise hoạt động hoàn chỉnh, chúng ta cần triển khai 3 hạng mục lớn trên `cvf-web`:

### Giai đoạn 1: Authentication & SSO (Single Sign-On)
Hiện tại CVF đang login bằng `admin/admin123` giả lập. 
**Kế hoạch tích hợp:**
1. Thư viện: Cài đặt **NextAuth.js (Auth.js)**.
2. Providers:
   - **Google Workspace** (OAuth2) cho login nội bộ công ty.
   - **GitHub** (OAuth2) cho team dev.
   - **Credentials** (fallback) cho MOCK login environment.
3. Cấp quyền: Setup role default là `developer` (hoặc `viewer`).

### Giai đoạn 2: User Interface cho Team Roles & Approvals
Cần xây dựng 3 màn hình mới trên Web UI:
1. **Admin Dashboard (`/admin/team`)**:
   - Quản lý danh sách thành viên.
   - Gán Role (Admin chuyển đổi User A từ `viewer` lên `developer`).
2. **Approval Inbox (`/approvals`)**:
   - Dành cho `owner` và `admin`.
   - Hiển thị danh sách các ticket bị `ESCALATE`.
   - Nút `[Approve]` và `[Reject]` kèm lý do.
3. **Compliance Reports (`/reports/compliance`)**:
   - Dashboard hiển thị biểu đồ Risk Distribution.
   - Điểm số sức khỏe dự án (Compliance Score).

### Giai đoạn 3: Wiring Guard Engine với RBAC
Update middleware / API execute để lấy thông tin User từ session:
1. Đọc Session từ NextAuth.
2. Fetch Role hiện tại của User.
3. Pass vào `GuardRequestContext.role = User.Role`.
4. Run check Role. Nếu vượt quá quyền hạn (Vd: Dev gọi R3) → báo Guard Engine kích hoạt ESCALATE.

---

## 3. Kiến trúc Luồng Phê Duyệt (Approval Flow)

\`\`\`mermaid
sequenceDiagram
    participant Dev as Developer (Role: Dev)
    participant UI as CVF Web UI
    participant Guard as CVF Guard Engine
    participant Admin as Admin/Owner
    
    Dev->>UI: Request Action (Risk: R3)
    UI->>Guard: evaluate(phase, R3, role=dev)
    Guard-->>UI: Result: ESCALATE (Dev max risk is R2)
    UI->>Guard: createApprovalRequest()
    UI-->>Dev: Show "Waiting for Admin Approval"
    
    Note over Admin, UI: Admin logs in later
    Admin->>UI: View /approvals inbox
    Admin->>Guard: approve(requestId)
    
    Guard-->>UI: Approval Granted
    UI->>Dev: Action executed successfully
\`\`\`
