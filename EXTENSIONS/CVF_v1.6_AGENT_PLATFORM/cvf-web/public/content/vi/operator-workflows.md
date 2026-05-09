# Workflow cho Operator — 10 Mẫu Kinh doanh có Governance

**Thời gian:** 20 phút  
**Trình độ:** Người mới → Trung cấp (không cần code)  
**Yêu cầu:** [Bắt đầu](getting-started), hiểu cơ bản về mức rủi ro CVF  
**Bạn sẽ học:** Cách chạy workflow tự động hóa kinh doanh với CVF governance — verification gates, chấm điểm độ tin cậy, và kiểm soát con người trong vòng lặp

---

## Tư duy Operator

CVF được xây cho developers. Nhưng cùng nguyên tắc governance — **phân loại rủi ro, verification gates, bằng-chứng-trước-tuyên-bố** — áp dụng hoàn hảo cho vận hành kinh doanh.

Tutorial này cung cấp **10 mẫu prompt sẵn dùng** cho Sales, Marketing, Product, Ops, Finance, và Strategy — mỗi mẫu được bọc trong CVF governance.

### CVF Thêm Gì (Mà AI Thô Không Có)

| AI Thô | CVF Governance |
|--------|---------------|
| "Đây là deals của bạn" | "Đây là deals. Tổng: 47. CRM dashboard: 47. ✅ Đã xác minh." |
| "Tôi đã soạn 5 email" | "5 bản nháp. Tin cậy: 3 Cao, 2 Trung bình. ⚠️ Cần duyệt trước khi gửi." |
| "Dự báo: $2.1M" | "Dự báo: $2.1M. Nguồn: 23 deals, 8 cũ. ⚠️ 3 ước tính đã dùng." |

---

## Bắt đầu nhanh: Chọn Workflow

| # | Workflow | Cho ai | Rủi ro |
|---|---------|--------|--------|
| 1 | [Quản lý Pipeline](#workflow-1) | Sales | R2 |
| 2 | [Tìm kiếm Prospect](#workflow-2) | Sales | R2 |
| 3 | [Giám sát Chi phí QC](#workflow-3) | Marketing | R2 |
| 4 | [Phân phối Nội dung](#workflow-4) | Marketing | R1 |
| 5 | [Tiếng nói Khách hàng](#workflow-5) | Support | R2 |
| 6 | [Báo cáo SP hàng tuần](#workflow-6) | Product | R2 |
| 7 | [Phẫu thuật Quy trình](#workflow-7) | Vận hành | R2 |
| 8 | [Tối ưu Lịch họp](#workflow-8) | Tất cả | R2 |
| 9 | [Phân tích Tài chính](#workflow-9) | Finance | R2 |
| 10 | [Tình báo Cạnh tranh](#workflow-10) | Strategy | R3 |

---

## Vận hành Doanh thu

### Workflow 1: Quản lý Pipeline {#workflow-1}
**Rủi ro:** R2 | **Kết nối:** CRM (HubSpot/Salesforce)

**Copy prompt này:**
```
Truy cập [CRM]. Lấy tất cả deals đang hoạt động gán cho tôi
với ngày đóng trong quý hiện tại.

1. Tạo bảng: Tên Deal, Số tiền, Giai đoạn, Ngày Hoạt động Cuối
2. Đánh dấu deal >$[ngưỡng] không hoạt động 7+ ngày
3. Dự báo: có thể đóng tháng này vs. chuyển sang quý sau

XÁC MINH (bắt buộc):
- Ghi tổng số deals. Đối chiếu với CRM dashboard.
- Báo cáo bất kỳ sai lệch nào giữa số đếm và dashboard.
- Đánh dấu deals cũ rõ ràng với ⚠️
```

**Tại sao bước xác minh quan trọng:** AI có thể bỏ sót hoặc đếm trùng deals. Đối chiếu bắt lỗi trước khi ảnh hưởng dự báo.

---

### Workflow 2: Tìm kiếm Prospect {#workflow-2}
**Rủi ro:** R2 | **Kết nối:** Tìm kiếm Web

**Copy prompt này:**
```
Chạy chiến dịch tìm prospect theo tín hiệu:

1. Tìm công ty tương tác với [Đối thủ]
2. Lọc theo ICP: [ngành], [số NV], [khu vực]
3. Phân tích top 5: tech stack qua tin tuyển dụng
4. Soạn email cá nhân cho VP [Phòng ban]

ĐỊNH DẠNG — Bảng với cột:
Công ty | Tín hiệu | Tech Stack | Email Nháp | Độ Tin Cậy

GOVERNANCE:
- Tin cậy: Cao (bằng chứng trực tiếp) / TB (suy luận) / Thấp (phỏng đoán)
- KHÔNG tự gửi. Tất cả email cần tôi duyệt.
- Đánh dấu công ty nào dữ liệu >30 ngày.
```

---

### Workflow 3: Giám sát Chi phí QC {#workflow-3}
**Rủi ro:** R2 | **Kết nối:** Upload CSV

**Copy prompt này:**
```
Phân tích báo cáo Chi phí QC (Google Ads + Meta):

1. So CPA hôm qua với trung bình 7 ngày
2. Đánh dấu chiến dịch CPA tăng >20% qua đêm
3. Xác định top 3 creative theo ROAS
4. Format dạng Slack cho kênh #marketing-team

KIỂM TRA DỮ LIỆU:
- Hiện tổng chi phí → tôi đối chiếu với tài khoản
- Hiện phạm vi ngày xử lý → xác nhận đầy đủ
- Đánh dấu chiến dịch hoặc dữ liệu còn thiếu với ⚠️
```

---

### Workflow 4: Phân phối Nội dung {#workflow-4}
**Rủi ro:** R1 (chỉ đọc + chuyển đổi — không hành động bên ngoài)

**Copy prompt này:**
```
Đọc nội dung này: [dán bài viết hoặc URL]

Tạo tài sản phân phối:
1. LinkedIn: Framework PAS, tối đa 1200 ký tự
2. Twitter/X: Thread 6 tweet, câu ngắn gọn
3. Newsletter: 150 từ teaser thu hút click
4. Slack: 1 câu thông báo nội bộ

KIỂM TRA CHẤT LƯỢNG:
- Mỗi bài phải tham chiếu chính xác nội dung nguồn
- Không bịa số liệu hoặc trích dẫn
- Giữ giọng thương hiệu nhất quán trên cả 4 format
```

---

## Sản phẩm & Vận hành

### Workflow 5: Tiếng nói Khách hàng {#workflow-5}
**Rủi ro:** R2 | **Kết nối:** Intercom/Zendesk

**Copy prompt này:**
```
Truy cập [Hệ thống Ticket]. Lấy 50 ticket chưa gán gần nhất.

1. Phân loại:
   🔴 Nghiêm trọng (thanh toán, sự cố)
   🟡 Cao (báo lỗi)
   🟢 Thường (câu hỏi how-to)

2. Thường: Soạn phản hồi + link bài Help Center
3. Nghiêm trọng: Tóm tắt + đề xuất kỹ sư theo tính năng

GOVERNANCE:
- Không bao giờ tự gửi — chỉ soạn nháp
- Đánh dấu ticket đề cập pháp lý/tuân thủ/bảo mật
- Ticket enterprise tier → thông báo account manager
- Hiện tổng phân loại để tôi xác minh
```

---

### Workflow 6: Báo cáo Sản phẩm Hàng tuần {#workflow-6}
**Rủi ro:** R2 | **Kết nối:** Jira + Notion

**Copy prompt này:**
```
Viết Báo cáo Sản phẩm Hàng tuần:

1. Jira: Tóm tắt ticket chuyển sang 'Done' tuần này tại [Dự án]
2. Notion: Đọc [Ghi chú họp] của [Ngày]
3. Kết hợp thành báo cáo exec:
   - ✅ Đã ship (kèm ticket ID)
   - 🚧 Đang bị chặn (kèm người phụ trách)
   - ⚠️ Rủi ro timeline

XÁC MINH:
- Ghi tổng ticket 'Done' từ Jira
- Đối chiếu: danh sách shipped có khớp số đó?
- Đánh dấu ticket chuyển Done mà không có QA sign-off
```

---

### Workflow 7: Phẫu thuật Quy trình {#workflow-7}
**Rủi ro:** R2 | **Kết nối:** Upload File (ngữ cảnh lớn)

**Copy prompt này:**
```
Upload: [N] bản SOP PDF + [M] tháng Báo cáo Sự cố

XÁC MINH NGỮ CẢNH (chạy trước):
- Xác nhận tổng tài liệu đã tải: [số mong đợi]
- Xác nhận phạm vi ngày dữ liệu sự cố
- Báo bất kỳ tài liệu lỗi hoặc không đọc được

PHÂN TÍCH:
1. Vẽ quy trình lý thuyết từ SOPs
2. So sánh với lỗi thực tế trong báo cáo sự cố
3. Xác định bước gây tắc nghẽn cụ thể
4. Viết lại phần SOP đó để sửa vấn đề

OUTPUT:
- So sánh Trước/Sau phần SOP
- Trích dẫn ID sự cố cụ thể cho mỗi đề xuất
- Độ tin cậy: phát hiện nào dựa trên dữ liệu vs. suy luận
```

---

### Workflow 8: Tối ưu Lịch họp {#workflow-8}
**Rủi ro:** R2 | **Kết nối:** Google Calendar

**Copy prompt này:**
```
Lên lịch họp [thời lượng]: [Tiêu đề]
Người tham gia: [Tên (múi giờ)] × N

1. Kiểm tra tất cả lịch tuần sau
2. Tìm slot ít ảnh hưởng giờ nghỉ nhất
3. Đề xuất 3 lựa chọn tốt nhất theo điểm công bằng

KHÔNG gửi lời mời.
Đề xuất → Tôi chọn → rồi soạn invite.
Chương trình họp đề xuất: [chương trình của bạn]
```

---

## Tài chính & Chiến lược

### Workflow 9: Phân tích Tài chính {#workflow-9}
**Rủi ro:** R2 | **Kết nối:** Dữ liệu Tài chính / Upload File

**Copy prompt này:**
```
GIAI ĐOẠN 1 — TRUY XUẤT:
Lấy [N] quý gần nhất của báo cáo [Công ty/Mã chứng khoán]

GIAI ĐOẠN 2 — PHÂN TÍCH:
- Tăng trưởng YoY của [Mảng kinh doanh]
- Xu hướng Biên lợi nhuận vận hành vs 2 đối thủ hàng đầu
- Yếu tố Rủi ro mới trong báo cáo gần nhất (so năm trước)

GIAI ĐOẠN 3 — TẠO:
- Bản ghi nhớ Đầu tư với Luận điểm + Kịch bản Xấu

GOVERNANCE BẮT BUỘC:
- Trích dẫn nguồn chính xác cho mọi dữ liệu
- Đánh dấu mọi chỉ số cần ước tính với ⚠️
- Ghi disclaimer: "Phân tích tạo bởi AI. Không phải tư vấn
  đầu tư. Xác minh tất cả số liệu độc lập."
```

---

### Workflow 10: Tình báo Cạnh tranh {#workflow-10}
**Rủi ro:** R3 (đa agent — bắt buộc review thủ công)

**Copy prompt này:**
```
Phân tích cạnh tranh: [Thị trường/Ngành]

Tạo 3 agent nghiên cứu song song:
• Agent A (Giá): Bản đồ mức giá của [3 đối thủ]
• Agent B (Cảm nhận): Pain points trên Reddit/Twitter, 30 ngày
• Agent C (Tính năng): Release notes, 90 ngày

GOVERNANCE R3 (bắt buộc):
1. Hiện báo cáo từng agent RIÊNG BIỆT trước
2. Mỗi báo cáo phải trích dẫn nguồn với URL
3. Tôi review từng báo cáo ← BƯỚC BẮT BUỘC
4. Chỉ sau đó mới tổng hợp
5. Đánh dấu: ✅ Đã xác minh | 🟡 Suy luận | 🔴 Phỏng đoán

TỔNG HỢP: Ma trận Cơ hội — khoảng trống thị trường ở đâu?
```

---

## Checklist Xác minh cho Operator

Dùng checklist này **trước khi hành động theo bất kỳ output AI nào**:

```
□ ĐẦY ĐỦ DỮ LIỆU — AI có xử lý hết records mong đợi?
□ KIỂM TRA TỔNG — Tổng có khớp dashboard hệ thống nguồn?
□ TRÍCH DẪN NGUỒN — Có records/URLs cụ thể được trích dẫn?
□ MỨC TIN CẬY — Mỗi tuyên bố có được đánh dấu tin cậy?
□ KIỂM TRA THIÊN LỆCH — AI có đang tối ưu cho điều tôi muốn?
□ ĐỘ MỚI — Dữ liệu có cập nhật (kiểm tra ngày)?
□ LEO THANG — Output này có đụng pháp lý/tài chính/enterprise?
```

---

## Tiếp theo là gì?

- Xem đặc tả governance đầy đủ: [AGT-034 Operator Workflow Orchestrator](../../../governance/skill-library/registry/agent-skills/AGT-034_OPERATOR_WORKFLOW_ORCHESTRATOR.gov.md)
- Duyệt tất cả 34 kỹ năng: [Danh mục Kỹ năng Agent](agent-skills-catalog)
- Tìm hiểu mô hình rủi ro CVF: [Mô hình Rủi ro](risk-model)
