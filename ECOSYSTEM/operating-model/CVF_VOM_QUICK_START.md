# CVF VOM Quick Start — Bắt đầu với CVF trong 10 phút

> **Đối tượng:** Non-coders, product builders, team leads
> **Thời gian đọc:** ~10 phút
> **Cập nhật:** 2026-03-09
> **Thuộc:** ECOSYSTEM/operating-model/ (L3 — Operating Model)

---

## 1. CVF là gì? (2 phút)

**CVF (Controlled Vibe Framework)** là bộ quy tắc giúp bạn **kiểm soát AI** khi AI làm việc cho bạn.

Hãy nghĩ CVF như **luật giao thông cho AI**:
- Bạn quyết định **đi đâu** (mục tiêu)
- CVF đảm bảo AI **đi đúng đường** (governance)
- AI **không được tự ý rẽ** ngoài khuôn khổ (policy enforcement)

### Bạn KHÔNG cần biết code

CVF được thiết kế để **người không biết lập trình** cũng có thể sử dụng. Bạn chỉ cần:

1. Biết mình muốn gì (Intent)
2. Thiết lập ranh giới cho AI (Policy)
3. Quan sát AI làm việc (Observation)
4. Phê duyệt kết quả (Audit)

---

## 2. Quy trình 4 bước (3 phút)

### Bước 1 — Nói cho AI biết bạn muốn gì

```
Ví dụ: "Tạo một trang web bán hàng đơn giản"
```

Đây là **Intent** — ý định của bạn. CVF sẽ đảm bảo AI hiểu đúng trước khi bắt tay vào làm.

### Bước 2 — Thiết lập ranh giới

Trước khi AI bắt đầu, bạn quyết định:

| Câu hỏi | Ví dụ trả lời |
|---|---|
| AI được làm gì? | Tạo code, viết nội dung |
| AI KHÔNG được làm gì? | Không gửi dữ liệu ra ngoài, không mua hosting |
| Mức rủi ro chấp nhận? | Thấp (chỉ đọc/tạo file) |
| Ai phê duyệt? | Bạn — sau mỗi bước |

### Bước 3 — AI thực thi theo khuôn khổ

AI làm việc theo **4 giai đoạn bắt buộc**:

```
Discovery  →  Design  →  Build  →  Review
(Tìm hiểu)   (Thiết kế)  (Xây dựng)  (Kiểm tra)
```

**Quy tắc cứng:** AI không được nhảy bước. Phải hoàn thành Discovery trước khi sang Design.

### Bước 4 — Bạn kiểm tra và phê duyệt

Sau mỗi giai đoạn, bạn:
- Xem AI đã làm gì
- Chấp nhận hoặc yêu cầu sửa
- AI chỉ tiếp tục khi bạn đồng ý

---

## 3. Mức rủi ro — Hiểu trong 1 phút

| Mức | Tên | AI được làm gì | Bạn cần làm gì |
|---|---|---|---|
| **R0** | An toàn | Chỉ đọc, phân tích | Không cần can thiệp |
| **R1** | Kiểm soát | Thay đổi nhỏ, 1 file | Xem log |
| **R2** | Nâng cao | Thay đổi nhiều file, có chain | Phê duyệt trước |
| **R3** | Quan trọng | Thay đổi hệ thống | Phê duyệt từng bước |

**Mẹo:** Bắt đầu ở R0-R1. Chỉ nâng lên R2-R3 khi bạn đã quen.

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

3. AI sẽ tự tuân thủ 4-phase process và risk model.

### Cách 3 — Chỉ đọc tài liệu (không cài gì)

Đọc theo thứ tự:
1. [Quick Orientation](../../docs/guides/CVF_QUICK_ORIENTATION.md) — Hiểu CVF trong 15 phút
2. [Builder Model](CVF_BUILDER_MODEL.md) — Cách xây dựng hệ thống AI với CVF
3. [141 Skills](../../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) — Thư viện kỹ năng sẵn có

---

## 5. Ví dụ thực tế

### Scenario: Bạn muốn AI tạo báo cáo tài chính

**Không có CVF:**
```
Bạn: "Tạo báo cáo tài chính"
AI: *tự ý truy cập dữ liệu, tự ý format, tự ý gửi email*
→ Rủi ro: AI có thể gửi sai dữ liệu cho sai người
```

**Có CVF:**
```
Bạn: "Tạo báo cáo tài chính"

CVF Discovery: AI hỏi → loại báo cáo? kỳ nào? cho ai?
CVF Design:    AI đề xuất → cấu trúc, nguồn dữ liệu, format
  → Bạn phê duyệt
CVF Build:     AI tạo báo cáo → R1 (chỉ đọc dữ liệu, tạo file)
CVF Review:    Bạn xem → chấp nhận hoặc yêu cầu sửa
  → AI KHÔNG tự gửi email (R3 — cần phê duyệt riêng)
```

---

## 6. Governance Primitives — 4 trụ cột

Mọi thứ trong CVF đều xoay quanh 4 trụ cột:

```
Policy     →  Quy tắc AI phải tuân thủ
Identity   →  AI nào đang làm, quyền gì
Execution  →  AI thực thi trong khuôn khổ
Audit      →  Mọi hành động đều được ghi lại
```

Bạn không cần nhớ chi tiết — CVF tự động enforce. Bạn chỉ cần:
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

> **Nguyên tắc vàng:** Bạn không cần hiểu hết CVF để bắt đầu. Bắt đầu nhỏ (R0-R1), học dần, mở rộng khi sẵn sàng.
