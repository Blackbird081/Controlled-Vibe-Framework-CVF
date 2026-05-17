I️ Mục tiêu

Workflow này đảm bảo:

Không có AI “tự phát”

Risk được phân loại trước khi dùng

Có người chịu trách nhiệm

Có Self-UAT trước production

Có audit trail

II️ Luồng tổng thể
Employee Request
      ↓
Risk Classification
      ↓
Approval Level Decision
      ↓
Registry Entry
      ↓
Self-UAT
      ↓
Certification Status Update
      ↓
Operational Use
      ↓
Monitoring / Audit

III Chi tiết từng bước
🟢 STEP 1 – AI REQUEST SUBMISSION

Người đề xuất (Requester) điền form:

Thông tin bắt buộc:

Mục đích sử dụng

Phòng ban

Dữ liệu sử dụng (có nhạy cảm không?)

Có tác động khách hàng không?

Có tự động hóa không?

Tần suất sử dụng

Kết quả:

→ Chuyển sang Risk Classification

🟡 STEP 2 – RISK CLASSIFICATION

Dựa vào Risk Matrix:
| Câu hỏi               | Nếu YES  |
| --------------------- | -------- |
| Ảnh hưởng chi phí?    | ≥ HIGH   |
| Ảnh hưởng khách hàng? | ≥ HIGH   |
| Có yếu tố pháp lý?    | CRITICAL |
| Chỉ phân tích nội bộ? | LOW      |
🟠 STEP 3 – APPROVAL

Theo risk level:

LOW → Owner
MEDIUM → Owner + IT
HIGH → Department Manager
CRITICAL → Executive

Sau khi approved:

→ Tạo Agent ID

🔵 STEP 4 – REGISTRY ENTRY

Thêm vào:

CVF_AGENT_REGISTRY.md

Ghi:

Agent ID

Owner

Risk

Approved phases

Approved skills

Certification = DRAFT

🟣 STEP 5 – SELF-UAT

Chạy theo:

CVF_SELF_UAT_PROTOCOL.md

Nếu:

PASS → chuyển trạng thái
FAIL → quay lại chỉnh sửa

🔴 STEP 6 – CERTIFICATION UPDATE

Cập nhật:

CVF_CERTIFICATION_STATUS.md

DRAFT → APPROVED_INTERNAL

🟢 STEP 7 – OPERATIONAL USE

Agent được phép hoạt động trong:

Phạm vi đã duyệt

Risk đã khai báo

Skill đã đăng ký

🔍 STEP 8 – MONITORING

Theo:

Audit 6 tháng

Hoặc khi có incident

IV️ Decision Control Points (Quan trọng nhất)

Workflow có 3 “gates”:

1️⃣ Risk Gate
2️⃣ Approval Gate
3️⃣ Self-UAT Gate

Không vượt qua đủ 3 gate → không được dùng.

V️ Trạng thái Agent (State Model)
REQUESTED
    ↓
UNDER_REVIEW
    ↓
DRAFT
    ↓
SELF_UAT
    ↓
APPROVED_INTERNAL
    ↓
SUSPENDED (if incident)

VI️ Tối ưu cho công ty logistics

Ví dụ áp dụng:

AI phân tích báo giá container → HIGH

AI hỗ trợ viết email nội bộ → LOW

AI hỗ trợ tính toán phí phạt hợp đồng → CRITICAL

Workflow đảm bảo:

Không có ai tự ý dùng AI để ra quyết định giá.

VII️ Đề xuất thực tế

Đừng làm phức tạp.

Bạn có thể triển khai bằng:

Google Form → Approval → cập nhật file markdown

Hoặc Notion database

Hoặc Excel + Git repo

Không cần hệ thống lớn ngay.

🎯 Tóm lại

Workflow này đảm bảo:

AI có người chịu trách nhiệm

Risk được phân loại

Không có lạm quyền

Có kiểm soát trước khi hoạt động