# Triết Lý Cốt Lõi

> *"Vibe là cần thiết — nhưng phải được kiểm soát."*

---

## Vấn Đề CVF Giải Quyết

AI có thể viết code. Nhưng ai quyết định **xây cái gì**, **xây như thế nào**, và **khi nào thì hoàn thành**?

Nếu không có cấu trúc:
- AI tự phát minh ra tính năng bạn không yêu cầu
- Phạm vi dự án âm thầm mở rộng
- "Nó chạy được" thay thế cho "nó đúng"
- Không ai có thể truy vết lý do đằng sau các quyết định
- Chất lượng phụ thuộc vào may rủi của prompt

CVF tồn tại vì **đầu ra AI tốt đòi hỏi đầu vào con người tốt**.

---

## 7 Nguyên Tắc

### 1. "Vibe là cần thiết — nhưng phải được kiểm soát"

Trực giác ("vibe") là một điểm khởi đầu hợp lệ. Bạn không cần viết bản đặc tả 50 trang trước khi hỏi AI bất cứ điều gì. Nhưng vibe không kiểm soát — bắn prompt mà không có mục đích, chấp nhận bất cứ thứ gì trả về — dẫn đến sản phẩm sai.

**CVF cho phép vibe tồn tại. CVF không để vibe đưa ra quyết định.**

### 2. "Kết quả > Code"

Điều quan trọng là **sản phẩm làm được gì**, chứ không phải code trông như thế nào. Mọi quyết định kỹ thuật — ngôn ngữ, framework, kiến trúc — đều là phương tiện để đạt kết quả, không phải mục tiêu tự thân.

Một script 50 dòng giải quyết được vấn đề tốt hơn một giải pháp "enterprise-grade" 500 dòng thiết kế quá mức.

### 3. "Quyết định là công dân hạng nhất"

Mọi quyết định quan trọng phải được **ghi lại**. Không phải trên Slack. Không phải trong đầu ai đó. Trong Nhật ký Quyết định (Decision Log) với:
- Quyết định gì
- Tại sao (lý do)
- Các phương án thay thế đã xem xét
- Ai đưa ra quyết định

Điều này ngăn chặn cuộc trò chuyện "tại sao mình xây nó kiểu này?" sau 3 tháng.

### 4. "Kiểm soát bằng cấu trúc, không phải quản lý vi mô"

CVF KHÔNG phải là về việc review từng dòng code AI. Mà là về:
- Các phase rõ ràng với tiêu chí đầu vào/đầu ra xác định
- Các cổng phase bắt lỗi sớm
- Danh sách kiểm tra (checklist) giúp chất lượng có thể đánh giá được

Ví von: một cây cầu có lan can. Bạn có thể lái tự do trong làn đường. Không có lan can, bạn rơi xuống.

### 5. "AI là người thực thi, không phải người ra quyết định"

AI thực thi trong ngữ cảnh bạn cung cấp. AI không:
- Đặt mục tiêu dự án
- Định nghĩa "hoàn thành" nghĩa là gì
- Chọn kiến trúc mà không có định hướng
- Quyết định phạm vi

Mọi quyết định đến từ con người. AI triển khai các quyết định đó.

### 6. "Người dùng không cần giỏi coding"

CVF được thiết kế cho **bất kỳ ai chịu trách nhiệm về sản phẩm**: product owner, quản lý, chuyên gia lĩnh vực, QA tester, founder. Bạn cần:
- Biết bạn muốn gì (ý định)
- Nhận ra khi đầu ra sai (review)

Bạn không cần:
- Viết code
- Hiểu thuật toán
- Debug stack trace

### 7. "Kỷ luật tạo điều kiện cho sáng tạo bền vững"

Tự do tuyệt đối dẫn đến hỗn loạn. Một nhạc sĩ luyện gam để có thể ứng tấu jazz. Một nhà văn tuân theo cấu trúc câu chuyện để có thể gây bất ngờ cho người đọc.

Kỷ luật của CVF (phase, spec, checklist) tạo không gian cho sáng tạo. Không có nó, bạn dành thời gian chữa cháy thay vì xây dựng.

---

## Các Nguyên Tắc Thể Hiện Trong Thực Tế Như Thế Nào

| Nguyên tắc | Trong CVF | Ví dụ |
|-----------|--------|---------|
| Vibe + Kiểm soát | Phase A nắm bắt ý định; Phase B cấu trúc hóa | Viết ý tưởng ra → rồi thiết kế nó |
| Kết quả > Code | Tiêu chí chấp nhận định nghĩa thành công, không phải chất lượng code | "Người dùng đăng nhập được không?" chứ không phải "Module auth có sạch không?" |
| Quyết định được ghi lại | Decision Log + Action Unit trace | `DEC-001: Dùng SQLite vì...` |
| Cấu trúc, không vi mô | Cổng phase + checklist | Checklist: `[x] Đáp ứng spec` |
| AI = người thực thi | AI nhận spec đã đóng băng, không thể mở rộng phạm vi | "Làm theo thiết kế này. Không thêm tính năng." |
| Không cần biết code | Skill form hướng dẫn đầu vào; không cần code | Điền form → nhận đầu ra có cấu trúc |
| Kỷ luật = sáng tạo | Các phase giải phóng bạn khỏi "tiếp theo làm gì?" | Lộ trình rõ ràng: Khám phá → Thiết kế → Xây dựng → Review |

---

## CVF KHÔNG Phải Là Gì

| CVF là | CVF không phải |
|--------|-----------|
| Framework quản trị công việc AI | Một công cụ hoặc sản phẩm AI |
| Phase + governance + skill | Một phương pháp coding cụ thể |
| Linh hoạt (dùng những gì bạn cần) | Tất cả hoặc không gì cả |
| Cho bất kỳ công cụ AI nào (ChatGPT, Claude, Copilot) | Gắn với một nhà cung cấp AI |
| Cho mọi người (dev, PM, founder) | Chỉ dành cho lập trình viên |
| CC BY-NC-ND 4.0, mã nguồn mở | Độc quyền |

---

## CVF Tối Thiểu Khả Dụng

Nếu bạn chỉ lấy một thứ từ CVF, hãy lấy điều này:

1. **Viết ra bạn muốn gì** (Phase A — 5 phút)
2. **Kiểm tra kết quả** (Phase D — 5 phút)

Đó là 10 phút chi phí bổ sung giúp ngăn chặn hàng giờ làm lại.

Mọi thứ khác — Phase B, governance toolkit, skill library, web UI, risk model — là chiều sâu tùy chọn mà bạn thêm vào khi cần.

---

## Đọc Thêm

- Quy Trình 4 Phase — Cách các phase hoạt động
- Mô Hình Governance — Vai trò, quyền hạn, rủi ro
- Tuyên Ngôn CVF — Nền tảng triết học đầy đủ

---

*Cập nhật lần cuối: 15 tháng 2, 2026 | CVF v1.6*
