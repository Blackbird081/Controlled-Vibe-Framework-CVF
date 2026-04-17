# CVF Enterprise Admin Console Roadmap
*Date: 2026-04-18*

> **Mục tiêu:** Xây dựng một không gian quản trị "Kín" (Admin-only), đóng vai trò như một Control Plane chuyên nghiệp dành riêng cho Owner/Admin (CFO, CISO, System Architect).
> **Phạm vi bảo mật:** Toàn bộ route `/admin` sẽ được bảo vệ bởi middleware. Các Role như User, Manager, View-Only tuyệt đối không thấy menu này.

## Phase 1: Foundation & Security Boundary (Tuần 1)
Thiết lập móng nhà và cơ chế phân quyền bảo mật tuyệt đối cho phân hệ Admin.

- **1.1. Role-Based Access Control (RBAC):** Bổ sung thuộc tính `role: 'admin' | 'user'` vào hệ thống Authen.
- **1.2. Router Protection:** Viết Next.js Middleware chặn mọi truy cập trái phép vào router `/admin/*`. Nếu user bình thường cố tình gõ URL, sẽ bị reject mã `403 Forbidden` hoặc redirect về trang chủ.
- **1.3. UI Layout:** Thiết kế thanh Navigation riêng biệt (Admin Sidebar) chứa các mục: `FinOps Dashboard`, `MCP Tool Governance`, `Audit Logs`, `HITL Queue`. Thanh này chỉ render ra màn hình nếu Session xác nhận là Admin.

## Phase 2: Khối FinOps & Token Economics (Dành cho CFO) (Tuần 2)
Kiểm soát dòng tiền và định lượng hiệu năng của AI.

- **2.1. FinOps Dashboard UI:** Biểu đồ hiển thị tổng chi phí API (OpenAI, Anthropic, Supabase...) theo thời gian thực (Ngày/Tuần/Tháng).
- **2.2. Cost Center Breakdown:** Bảng phân bổ chi phí chi tiết: Token đang bị đốt nhiều nhất bởi User nào? Phòng ban nào? Skill/Template nào chạy tốn kém nhất?
- **2.3. Quota & Limits Engine (Hard/Soft Caps):** Giao diện thiết lập hạn mức. Admin thiết lập rules: "Phòng Marketing chỉ được đốt $100/tháng". Hệ thống sẽ auto-suspend quyền gọi LLM của phòng ban đó nếu chạm ngưỡng.

## Phase 3: Khối MCP Tool Governance & Security (Dành cho CISO/Architect) (Tuần 3)
Ngăn chặn Shadow AI và thiết lập ranh giới an toàn cho các hành động của Agent.

- **3.1. Tool Registry (Whitelist/Blacklist):** Giao diện liệt kê toàn bộ các MCP Tools hiện có trên hệ thống (DB_Query, Delete_File, Send_Email). Cho phép Admin Bật/Tắt quyền xài Tool đối với từng Role.
- **3.2. Real-time Audit Logs (Truy vết):** Bể chứa Log (Data Table) không thể xoá. Lưu lại toàn bộ lịch sử: User A -> Gọi Agent B -> Agent B gọi Tool C -> Kết quả trả về là D -> Tốn 500 tokens. Kèm chức năng Export CSV.
- **3.3. Human-In-The-Loop (HITL) Queue:** Giao diện phê duyệt. Các Tool được đánh dấu là "High Risk" (ví dụ: Update Database) sẽ bị chặn lại ở trạng thái Pending. Màn hình này cho phép Admin vào xem Payload và bấm "Approve" (Thực thi) hoặc "Reject" (Từ chối).

## Phase 4: Data Privacy & Guardrails (Tuần 4)
Hoàn thiện vỏ bọc Enterprise.

- **4.1. DLP Redaction Panel:** Giao diện cho phép Admin khai báo các "Regex nhạy cảm" (Mã số thẻ tín dụng, API Key, Mã nhân viên CVF). Middleware sẽ tự động che (mask) các đoạn text này trước khi gửi Prompt ra ngoài lên máy chủ LLM công cộng.
- **4.2. RAG Knowledge Partitioning:** Quản lý Vector DB Permissions. Ràng buộc Agent chỉ được tham chiếu các tài liệu nội bộ dựa trên cấp bậc của người hỏi.
