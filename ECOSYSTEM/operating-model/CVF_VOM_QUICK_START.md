# CVF VOM Quick Start — Bắt đầu với CVF trong 10 phút

> **Đối tượng:** Non-coders, product builders, team leads
> **Thời gian đọc:** ~10 phút
> **Cập nhật:** 2026-03-09 (bản gốc); 2026-10-02 (chỉnh lại các cam kết về kiểm soát, phê duyệt và mức rủi ro)
> **Thuộc:** ECOSYSTEM/operating-model/ (L3 — Operating Model)

---

## 1. CVF là gì? (2 phút)

**CVF (Controlled Vibe Framework)** là bộ quy tắc giúp bạn **kiểm soát AI** khi AI làm việc cho bạn.

Hãy nghĩ CVF như **luật giao thông cho AI**:
- Bạn quyết định **đi đâu** (mục tiêu)
- CVF đặt luật và bằng chứng để AI **đi đúng đường** ở những điểm có kiểm soát (governance)
- Ở những bề mặt đã tích hợp CVF, khả năng chặn hoặc ghi lại việc **rẽ ra ngoài** khuôn khổ phụ thuộc control đã có và phạm vi được kiểm chứng của từng bề mặt. Ngoài các điểm đó, luật chỉ là quy trình bằng văn bản

### Bạn KHÔNG cần biết code

CVF được thiết kế để **người không biết lập trình** cũng có thể sử dụng. Bạn chỉ cần:

1. Biết mình muốn gì (Intent)
2. Thiết lập ranh giới cho AI (Policy)
3. Quan sát AI làm việc (Observation)
4. Phê duyệt kết quả (Audit)

---

## 2. Quy trình 4 bước (3 phút)

> Bốn bước dưới đây là cách nhìn rút gọn cho người không viết code. Chuỗi chuẩn của công việc có quản trị có **bảy quyết định** (INTAKE, DESIGN, SPEC, WORK ORDER, BUILD, REVIEW, FREEZE): xem [Governed Work Lifecycle](../../docs/reference/CVF_GOVERNED_WORK_LIFECYCLE_AND_DESIGN_CONTROL_STANDARD_2026-06-11.md) và [Quick Orientation](../../docs/guides/CVF_QUICK_ORIENTATION.md). Bốn bước không thay thế SPEC và WORK ORDER.

### Bước 1 — Nói cho AI biết bạn muốn gì

```
Ví dụ: "Tạo một trang web bán hàng đơn giản"
```

Đây là **Intent** — ý định của bạn. CVF yêu cầu làm rõ ý định trước khi bắt tay vào làm; bạn vẫn cần kiểm tra AI đã hiểu đúng điều bạn muốn.

### Bước 2 — Thiết lập ranh giới

Trước khi AI bắt đầu, bạn quyết định:

| Câu hỏi | Ví dụ trả lời |
|---|---|
| AI được làm gì? | Tạo code, viết nội dung |
| AI KHÔNG được làm gì? | Không gửi dữ liệu ra ngoài, không mua hosting |
| Mức rủi ro chấp nhận? | Xác định theo dữ liệu, hành động và môi trường; không mặc định thấp vì chỉ đọc/tạo file |
| Ai phê duyệt? | Bạn — tại các ranh giới cần phê duyệt (xem bước 4) |

### Bước 3 — AI thực thi theo khuôn khổ

AI làm việc theo cách nhìn **4 giai đoạn** này (chuỗi chuẩn đầy đủ có bảy quyết định):

```
Discovery  →  Design  →  Build  →  Review
(Tìm hiểu)   (Thiết kế)  (Xây dựng)  (Kiểm tra)
```

**Quy tắc cứng:** Trong công việc có quản trị, AI không được nhảy thẳng từ một yêu cầu rộng sang Build. Phải làm rõ yêu cầu và thiết kế trước; SPEC và WORK ORDER vẫn là các ranh giới bắt buộc.

### Bước 4 — Bạn kiểm tra và phê duyệt

Tại các ranh giới cần phê duyệt, bạn:
- Xem AI đã làm gì
- Chấp nhận hoặc yêu cầu sửa
- AI chỉ tiếp tục khi có thẩm quyền phù hợp

Trong phạm vi đã được cho phép, agent tiếp tục công việc và các sửa chữa liên quan mà không xin lại, miễn là mục tiêu, phạm vi file/hành động, mức rủi ro, loại tác động ra ngoài và người có quyền commit không đổi. Khi một trong các ranh giới đó đổi, cần đúng thẩm quyền trước khi tiếp tục. Bằng chứng đã được chấp nhận được dùng lại, không chạy lại từ đầu. Xem [Approval Continuity](../../governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md#governance-latency-and-approval-continuity).

---

## 3. Mức rủi ro — Hiểu trong 1 phút

Mức rủi ro (R0 đến R3) được phân loại **theo ngữ cảnh của từng việc**, không theo số file hay mức độ quen thuộc:

- **R0:** không ảnh hưởng production và không chạm vào bề mặt quản trị.
- **R1:** rủi ro thấp, đi theo quy trình chuẩn, không cần phê duyệt.
- **R2:** rủi ro nâng cao, cần người xem xét.
- **R3:** rủi ro nghiêm trọng, cần phê duyệt chính thức trước khi hành động.

Dữ liệu production, API bên ngoài, thay đổi bảo mật hoặc hành vi liên quan đến quản trị tối thiểu là R2. Đừng tự hạ mức rủi ro vì việc trông nhỏ hoặc quen thuộc. Định nghĩa đầy đủ nằm ở [mục Risk Classification](../../governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md#risk-classification); trang này không gán mức rủi ro cho một việc cụ thể.

---

## 4. Bắt đầu ngay (3 phút)

### Cách 1 — Dùng Web UI (dễ nhất)

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install && npm run dev
```

Mở http://localhost:3000 — giao diện trực quan, hỗ trợ tiếng Việt.

### Cách 2 — Dùng với AI IDE (Cursor, Windsurf, VS Code)

1. Clone CVF vào workspace:
   ```
   D:\MyWorkspace\
   ├── .Controlled-Vibe-Framework-CVF\   ← CVF (governance)
   └── MyProject\                         ← Project của bạn
   ```

2. Khi bắt đầu phiên AI, nói: *"Đọc CVF rules trước khi làm việc"*

3. Đây chỉ là yêu cầu bằng văn bản: nó giúp AI làm theo quy trình, nhưng không có nghĩa CVF chặn hay ghi lại mọi thao tác của phiên đó. Kiểm soát có thực thi nằm ở những bề mặt đã tích hợp CVF. Xem thêm [GET_STARTED](../../docs/GET_STARTED.md).

### Cách 3 — Chỉ đọc tài liệu (không cài gì)

Đọc theo thứ tự:
1. [Quick Orientation](../../docs/guides/CVF_QUICK_ORIENTATION.md) — Hiểu CVF trong 15 phút
2. [Builder Model](CVF_BUILDER_MODEL.md) — Cách xây dựng hệ thống AI với CVF
3. [Thư viện kỹ năng](../../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) — Thư viện kỹ năng sẵn có

---

## 5. Ví dụ minh họa (chưa chạy, dữ liệu giả)

> Đây là minh họa ý tưởng với dữ liệu giả, không phải mô tả một lần chạy thật và không phải tư vấn tài chính.

### Scenario: Bạn muốn AI tạo báo cáo tài chính

**Không có kiểm soát:**
```
Bạn: "Tạo báo cáo tài chính"
AI: *tự ý truy cập dữ liệu, tự ý format, tự ý gửi email*
→ Rủi ro: AI có thể gửi sai dữ liệu cho sai người
```

**Có quy trình CVF (minh họa):**
```
Bạn: "Tạo báo cáo tài chính từ bảng dữ liệu giả này"

Discovery: AI hỏi → loại báo cáo? kỳ nào? cho ai?
Design:    AI đề xuất → cấu trúc, nguồn dữ liệu, format
  → Bạn phê duyệt
Build:     AI tạo file báo cáo từ dữ liệu giả bạn đưa; mức rủi ro xác định theo ngữ cảnh thực tế
Review:    Bạn xem → chấp nhận hoặc yêu cầu sửa
  → AI không tự gửi email: gửi ra ngoài là tác động ngoài, cần được cho phép riêng
```

---

## 6. Governance Primitives — 4 trụ cột

Mọi thứ trong CVF đều xoay quanh 4 trụ cột:

```
Policy     →  Quy tắc AI phải tuân thủ
Identity   →  AI nào đang làm, quyền gì
Execution  →  AI thực thi trong khuôn khổ
Audit      →  Ghi vết các hành động trong phạm vi control đã tích hợp
```

Bạn không cần nhớ chi tiết các trụ cột. Khả năng thực thi và ghi vết phụ thuộc control đã tích hợp và bằng chứng của từng bề mặt; không suy ra mọi hành động đều được chặn hoặc ghi lại. Ở nơi khác, chúng chỉ là quy trình bằng văn bản. Bạn cần:
- Thiết lập Policy (ranh giới)
- Kiểm tra Audit (kết quả)

---

## 7. Đi đâu tiếp?

| Bạn muốn gì? | Đọc gì? |
|---|---|
| Hiểu CVF sâu hơn | [Quick Orientation](../../docs/guides/CVF_QUICK_ORIENTATION.md) |
| Cách agent hoạt động (cho dev teams) | [Agent Operating Model](CVF_AGENT_OPERATING_MODEL.md) |
| Cách xây dựng hệ thống (cho builders) | [Builder Model](CVF_BUILDER_MODEL.md) |
| Kiến trúc tổng thể | [CVF Core Knowledge Base](../../docs/CVF_CORE_KNOWLEDGE_BASE.md) |
| Roadmap phát triển | [Unified Roadmap 2026](../strategy/CVF_UNIFIED_ROADMAP_2026.md) |
| Tư tưởng & nguyên lý | [Doctrine](../doctrine/) |

---

> **Nguyên tắc vàng:** Bạn không cần hiểu hết CVF để bắt đầu. Bắt đầu nhỏ, học dần, mở rộng khi sẵn sàng.
