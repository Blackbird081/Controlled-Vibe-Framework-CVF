# Quá Trình Phát Triển Phiên Bản

CVF đã phát triển qua 6 phiên bản, mỗi phiên bản thêm một lớp khả năng mới trong khi vẫn duy trì tương thích ngược. Tất cả các phiên bản trước v1.6 đều đã **đóng băng** — nghĩa là spec của chúng là bản cuối cùng và sẽ không thay đổi.

---

## Dòng Thời Gian Phiên Bản

```
v1.0  Nền Tảng             ████████████░░░░░░░░░░░░░░░░░░░░
v1.1  Governance            ████████████████░░░░░░░░░░░░░░░░
v1.2  Khả Năng              ████████████████████░░░░░░░░░░░░
v1.3  Triển Khai             ████████████████████████░░░░░░░░
v1.5  Nền Tảng UX           ████████████████████████████░░░░
v1.6  Nền Tảng Agent        ████████████████████████████████  ← Hiện tại
```

---

## v1.0 — Nền Tảng

> *"Thiết lập ý tưởng cốt lõi: lập trình vibe có kiểm soát thông qua các phase có cấu trúc."*

**Trạng thái:** ĐÓNG BĂNG

**Những gì được giới thiệu:**
- Quy trình 4 phase: Khám Phá → Thiết Kế → Xây Dựng → Đánh Giá
- Phase Gate (phải vượt qua để tiếp tục)
- Ghi nhận quyết định cơ bản (Decision Log)
- CVF Manifesto và triết lý cốt lõi
- Mẫu khởi tạo dự án
- Khung tuân thủ sơ bộ

**File quan trọng:**
- `v1.0/CVF_MANIFESTO.md` — Manifesto gốc
- `v1.0/phases/` — Định nghĩa phase
- `v1.0/governance/` — Quy tắc governance cơ bản
- `v1.0/templates/` — Mẫu dự án

**Phù hợp cho:** Hiểu nguồn gốc và triết lý cốt lõi của CVF.

---

## v1.1 — Tinh Chỉnh Governance

> *"Chính thức hóa ai kiểm soát cái gì, khi nào, và như thế nào."*

**Trạng thái:** ĐÓNG BĂNG

**Những gì được thêm:**
- 4 vai trò con người: OBSERVER, BUILDER, ARCHITECT, GOVERNOR
- Ma trận quyền hạn theo phase (ai phê duyệt gì trong phase nào)
- 6 agent archetype: Analysis, Decision, Planning, Execution, Supervisor, Exploration
- Vòng đời agent: 6 trạng thái (Inactive → Proposed → Validated → Active → Suspended → Retired)
- 8 governance command: `CVF:PROPOSE`, `CVF:APPROVE`, `CVF:REJECT`, `CVF:AUDIT`, `CVF:PAUSE`, `CVF:OVERRIDE`, `CVF:ESCALATE`, `CVF:RETIRE`
- Spec ĐẦU VÀO/ĐẦU RA cho mọi phase
- Hướng dẫn di cư từ v1.0

**File quan trọng:**
- `v1.1/governance/` — Mô hình governance đầy đủ
- `v1.1/agents/` — Định nghĩa agent archetype
- `v1.1/architecture/` — Kiến trúc hệ thống
- `v1.1/MIGRATION_GUIDE.md` — Nâng cấp từ v1.0

**Phù hợp cho:** Các nhóm muốn governance chính thức mà không cần công cụ triển khai.

---

## v1.2 — Mở Rộng Khả Năng

> *"Định nghĩa AI có thể làm gì, giới hạn ra sao, và quản lý rủi ro như thế nào."*

**Trạng thái:** ĐÓNG BĂNG

**Những gì được thêm:**
- Skill contract: định nghĩa chính thức về khả năng AI
- Quản lý vòng đời khả năng
- Mô hình rủi ro với 5 khía cạnh:
  - Rủi ro Quyền Hạn
  - Rủi ro Mở Rộng Phạm Vi
  - Rủi ro Không Thể Đảo Ngược
  - Rủi ro Khả Năng Diễn Giải
  - Rủi ro Tác Động Bên Ngoài
- Mức rủi ro: R0 (Thụ Động) → R1 (Có Kiểm Soát) → R2 (Nâng Cao) → R3 (Nghiêm Trọng) → R4 (Bị Chặn)
- Quy tắc tổng hợp rủi ro
- Framework xác thực khả năng

**File quan trọng:**
- `EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/` — Toàn bộ phần mở rộng

**Phù hợp cho:** Tổ chức cần quản lý rủi ro chính thức cho khả năng AI.

---

## v1.3 — Bộ Công Cụ Triển Khai

> *"Biến CVF thành thực thi được với công cụ thực tế."*

**Trạng thái:** ĐÓNG BĂNG

**Những gì được thêm:**
- Python SDK cho các thao tác CVF
- Công cụ CLI để khởi tạo và quản lý dự án
- Tích hợp CI/CD (GitHub Actions workflow)
- Xác thực Phase Gate tự động
- Phiên bản Operator (v1.3.1): đơn giản hóa cho người vận hành thực tế

**File quan trọng:**
- `EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/` — SDK và công cụ
- `EXTENSIONS/CVF_v1.3.1_OPERATOR_EDITION/` — Tinh gọn cho người vận hành

**Phù hợp cho:** Lập trình viên muốn tích hợp CLI/SDK vào quy trình làm việc hiện có.

---

## v1.4 — Tầng Sử Dụng

> *"Chuẩn hóa cách CVF được áp dụng trong các ngữ cảnh khác nhau."*

**Trạng thái:** ĐÓNG BĂNG

**Những gì được thêm:**
- Mẫu sử dụng cho các loại dự án khác nhau
- Hướng dẫn áp dụng theo ngữ cảnh cụ thể
- Mẫu quy trình làm việc

**File quan trọng:**
- `EXTENSIONS/CVF_v1.4_USAGE_LAYER/` — Mẫu sử dụng

---

## v1.5 — Nền Tảng UX

> *"Làm CVF dễ tiếp cận cho người dùng không chuyên kỹ thuật."*

**Trạng thái:** ĐÓNG BĂNG

**Những gì được thêm:**
- Định hướng người dùng cuối (v1.5.1): hướng dẫn cho người không phải lập trình viên
- Thư viện Skill cho người dùng cuối (v1.5.2): 114 skill trên 12 lĩnh vực
- Tài liệu và hướng dẫn hướng đến người dùng

**File quan trọng:**
- `EXTENSIONS/CVF_v1.5_UX_PLATFORM/` — Spec nền tảng
- `EXTENSIONS/CVF_v1.5.1_END_USER_ORIENTATION/` — Hướng dẫn người dùng cuối
- `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/` — Thư viện skill đầy đủ

**Phù hợp cho:** Các nhóm đang đưa thành viên không chuyên kỹ thuật vào quy trình CVF.

---

## v1.6 — Nền Tảng Agent (Hiện Tại)

> *"Đưa CVF vào cuộc sống dưới dạng ứng dụng web tương tác."*

**Trạng thái:** HOẠT ĐỘNG (phiên bản hiện tại)

**Những gì được thêm:**
- Ứng dụng web đầy đủ (Next.js 16 + React 19 + TypeScript 5)
- Mẫu tương tác cho tất cả 4 phase
- Giao diện chat đa agent
- Chế độ đơn AI và đa AI
- Bàn giao agent và chuyển tiếp phase
- 3 chế độ governance: Minimal, Standard, Full
- Giao diện đánh giá rủi ro thời gian thực
- Quản lý state bằng Zustand
- Giao diện với Tailwind CSS 4
- Framework kiểm thử Vitest

**Stack công nghệ:**
| Công Nghệ | Phiên Bản |
|-----------|-----------|
| Next.js | 16 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Zustand | 5 |
| Vitest | 4 |

**File quan trọng:**
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/` — Spec nền tảng
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/` — Mã nguồn ứng dụng web

**Phù hợp cho:** Các nhóm muốn trải nghiệm CVF trực quan, tương tác.

---

## So Sánh Phiên Bản

| Tính Năng | v1.0 | v1.1 | v1.2 | v1.3 | v1.5 | v1.6 |
|-----------|:----:|:----:|:----:|:----:|:----:|:----:|
| Quy trình 4 Phase | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ghi nhận quyết định | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Phase Gate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vai trò chính thức | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agent Archetype | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Command | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mô hình rủi ro | — | — | ✅ | ✅ | ✅ | ✅ |
| Skill Contract | — | — | ✅ | ✅ | ✅ | ✅ |
| Python SDK/CLI | — | — | — | ✅ | ✅ | ✅ |
| Tích hợp CI/CD | — | — | — | ✅ | ✅ | ✅ |
| Hướng dẫn người dùng cuối | — | — | — | — | ✅ | ✅ |
| Thư viện Skill (114) | — | — | — | — | ✅ | ✅ |
| Giao diện Web | — | — | — | — | — | ✅ |
| Chat đa Agent | — | — | — | — | — | ✅ |
| Chế độ Governance | — | — | — | — | — | ✅ |

---

## Bạn Nên Dùng Phiên Bản Nào?

| Nếu bạn là... | Bắt đầu với | Sau đó khám phá |
|---------------|-------------|-----------------|
| Lập trình viên cá nhân, chỉ tò mò | **v1.0** (đọc manifesto) | v1.6 (thử giao diện web) |
| Lập trình viên muốn có cấu trúc | **v1.1** (governance) | v1.3 (công cụ CLI) |
| Nhóm cần quản lý rủi ro | **v1.2** (mô hình rủi ro) | v1.6 (rủi ro trực quan) |
| Kỹ sư ops/DevOps | **v1.3** (SDK, CI/CD) | v1.6 (nền tảng web) |
| Thành viên không chuyên kỹ thuật | **v1.6** (giao diện web, thân thiện người dùng) | — |
| Tất cả mọi người từ giờ | **v1.6** (hiện tại, đầy đủ tính năng) | — |

### Khuyến Nghị Nhanh

- **Mới với CVF?** → Bắt đầu với START_HERE.md và giao diện web v1.6
- **Muốn hiểu triết lý?** → Đọc CVF Manifesto v1.0
- **Cần governance chính thức?** → Nghiên cứu mô hình governance v1.1
- **Cần kiểm soát rủi ro?** → Nghiên cứu mô hình rủi ro v1.2 + khái niệm Mô Hình Rủi Ro
- **Muốn công cụ?** → Dùng CLI/SDK v1.3
- **Muốn trải nghiệm đầy đủ?** → Dùng nền tảng web v1.6

---

## Tương Thích Ngược

Mỗi phiên bản **mở rộng** phiên bản trước — không bao giờ phá vỡ nó.

```
v1.0 → v1.1 → v1.2 → v1.3 → v1.5 → v1.6
 +        +        +        +        +        +
 |        |        |        |        |        |
 phase    vai trò  rủi ro   công cụ  UX      web
 gate     agent    skill    SDK     người    app
 log      cmd      khả năng CLI     dùng     chat
```

Nếu bạn dùng v1.6, bạn tự động có quyền truy cập vào tất cả khái niệm từ v1.0–v1.5.

---

## Đóng Băng vs. Hoạt Động

| Trạng Thái | Ý Nghĩa | Phiên Bản |
|------------|----------|-----------|
| **ĐÓNG BĂNG** | Spec là bản cuối cùng, không thay đổi | v1.0, v1.1, v1.2, v1.3, v1.4, v1.5 |
| **HOẠT ĐỘNG** | Đang được phát triển tích cực | v1.6 |

Đóng băng không có nghĩa là lỗi thời — nó có nghĩa là ổn định và đáng tin cậy. Manifesto v1.0 ngày nay vẫn có giá trị như khi nó được viết.

---

## Đọc Thêm

- Triết Lý Cốt Lõi — 7 nguyên tắc đằng sau mỗi phiên bản
- Mô Hình Governance — Cách vai trò phát triển từ v1.1
- Mô Hình Rủi Ro — Framework rủi ro từ v1.2
- Hệ Thống Skill — Skill từ v1.2/v1.5
- Bảng So Sánh Phiên Bản — So sánh tính năng chi tiết

---

*Cập nhật lần cuối: 15 tháng 2, 2026 | CVF v1.6*
