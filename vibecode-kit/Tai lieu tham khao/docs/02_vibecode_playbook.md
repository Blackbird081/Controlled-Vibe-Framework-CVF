# Vibecode Playbook

Tài liệu hướng dẫn vận hành Vibecode từ A đến Z. Đọc xong Playbook này, bạn có thể áp dụng framework vào bất kỳ dự án nào.

---

## 1. Playbook này dùng để làm gì

**Playbook ≠ Overview**

- [Overview](01_overview.md) trả lời: "Vibecode là gì?"
- **Playbook** trả lời: "Làm Vibecode như thế nào cho đúng?"

Playbook này cung cấp:
- Nguyên lý vận hành
- Quy trình từng bước
- Checklist để tự kiểm tra
- Tips từ thực chiến

<!-- OWNER_TODO: Viết 1–2 đoạn giới thiệu Playbook theo góc nhìn cá nhân. Ví dụ: "Playbook này là kết tinh từ X tháng làm việc với AI, sau Y dự án thất bại và Z dự án thành công..." -->

[OWNER_TODO] Thêm giới thiệu cá nhân về hành trình đúc kết Playbook này.

---

## 2. Nguyên lý lõi của Vibecode

Vibecode xây dựng trên 5 nguyên tắc:

### 2.1. Con người giữ quyền kiến trúc & quyết định

- **Scope** do con người định nghĩa, không phải AI
- **Kiến trúc** do con người thiết kế (hoặc duyệt nếu AI đề xuất)
- **Nghiệm thu** do con người quyết định pass/fail

> AI rất giỏi "làm", nhưng không nên để AI "quyết định làm gì".

### 2.2. AI thi công theo spec, không tự ý sáng tạo

- AI nhận STEP cụ thể với tiêu chí nghiệm thu rõ ràng
- AI không tự thêm feature, không tự refactor ngoài scope
- Nếu spec mơ hồ → AI hỏi lại, không tự đoán

### 2.3. Chia nhỏ để kiểm soát

- Mỗi JOB lớn → chia thành nhiều STEP nhỏ
- Mỗi STEP có GATE nghiệm thu riêng
- Fail sớm, fix sớm, không để lỗi tích lũy

### 2.4. Viết trước, làm sau

- Không bắt đầu code khi chưa có Intake rõ ràng
- Không giao AI làm khi chưa có Contracts
- "Viết = suy nghĩ" – càng viết rõ, AI càng làm đúng

### 2.5. Log mọi thứ, retro thường xuyên

- Mỗi STEP xong → ghi log
- Mỗi JOB xong → làm retro
- Kinh nghiệm hôm nay = vốn liếng cho ngày mai

<!-- OWNER_TODO: Kể câu chuyện "Vibecode 1.0 → 2.0": ban đầu bạn làm việc với AI như thế nào? Gặp vấn đề gì? Vibecode ra đời như thế nào? -->

[OWNER_TODO] Thêm câu chuyện cá nhân về quá trình hình thành các nguyên lý này.

---

## 3. Vai trò 3 bên: Chủ – Architect – Coder

Vibecode phân chia rõ ràng 3 vai trò:

### 3.1. Chủ (Owner) – Con người

**Trách nhiệm:**
- Định nghĩa mục tiêu và phạm vi JOB
- Viết hoặc duyệt JOB Intake
- Duyệt Blueprint trước khi thi công
- Nghiệm thu từng GATE
- Quyết định cuối cùng khi có conflict

**Không làm:**
- Không cần code (trừ khi muốn)
- Không cần thiết kế chi tiết từng module

**Mindset:**
> "Tôi là người ra đề và chấm bài, không phải người giải bài."

### 3.2. Architect (Thầu) – AI thiết kế

**Công cụ phù hợp:** ChatGPT, Claude (chat mode), Gemini...

**Trách nhiệm:**
- Phân tích JOB Intake
- Thiết kế Blueprint (kiến trúc tổng thể)
- Chia nhỏ thành Contracts (STEP + GATE)
- Đề xuất giải pháp, nhưng Chủ duyệt

**Không làm:**
- Không code trực tiếp
- Không tự quyết định scope

**Đầu vào:** Vibecode Architect Pack (Intake + Blueprint hiện tại)
**Đầu ra:** Blueprint hoàn chỉnh + Contracts

### 3.3. Coder (Thợ) – AI thực thi

**Công cụ phù hợp:** Claude Code, Cursor, GitHub Copilot...

**Trách nhiệm:**
- Nhận Vibecode Coder Pack (1 STEP cụ thể)
- Thực thi đúng spec: tạo file, viết code, sửa code
- Báo cáo kết quả
- Hỏi lại nếu spec không rõ

**Không làm:**
- Không tự thêm feature ngoài STEP
- Không tự refactor code không liên quan
- Không quyết định kiến trúc

**Đầu vào:** Vibecode Coder Pack (nội dung 1 STEP)
**Đầu ra:** Code/file hoàn thành + báo cáo ngắn

### Bảng tóm tắt phân công

| Hoạt động | Chủ | Architect | Coder |
|-----------|-----|-----------|-------|
| Định nghĩa scope | ✅ Quyết định | Tư vấn | - |
| Viết Intake | ✅ Viết/Duyệt | Hỗ trợ | - |
| Thiết kế Blueprint | Duyệt | ✅ Thiết kế | - |
| Viết Contracts | Duyệt | ✅ Viết | - |
| Thực thi STEP | Giám sát | - | ✅ Làm |
| Nghiệm thu GATE | ✅ Quyết định | - | Báo cáo |
| Ghi log | ✅ Ghi | - | - |

<!-- OWNER_TODO: Kể 1 ví dụ cụ thể về cách bạn phối hợp 3 vai trò trong 1 dự án thực. Ví dụ: "Khi làm Translator Pro, tôi đóng vai Chủ, dùng ChatGPT làm Architect, Claude Code làm Thợ..." -->

[OWNER_TODO] Thêm case study thực tế về việc phối hợp 3 vai trò.

---

## 4. Vòng đời một JOB (chi tiết)

Mỗi JOB đi qua 5 giai đoạn:

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ 1. MỞ   │ → │ 2. THIẾT │ → │ 3. THI  │ → │ 4. NGHIỆM│ → │ 5. ĐÓNG │
│   JOB    │   │   KẾ     │   │   CÔNG   │   │   THU    │   │   JOB    │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
    Chủ         Architect        Coder          Chủ           Chủ
```

### Giai đoạn 1: Mở JOB

**Người thực hiện:** Chủ

**Hành động:**
```bash
python scripts/vibe.py new JOB-XXX --title "Tên công việc"
```

**Output:**
- `jobs/JOB-XXX-intake.md` – Điền thông tin bài toán
- `blueprints/JOB-XXX-blueprint.md` – Để trống, Architect sẽ điền
- `contracts/JOB-XXX-contracts.md` – Để trống, Architect sẽ điền
- `logs/JOB-XXX-log.md` – Ghi nhật ký

**Tiêu chí hoàn thành:**
- Intake đã điền đủ: bối cảnh, mục tiêu, phạm vi, ràng buộc, definition of done

### Giai đoạn 2: Thiết kế

**Người thực hiện:** Architect (AI) + Chủ (duyệt)

**Hành động:**
```bash
python scripts/vibe.py pack-architect JOB-XXX
```
→ Copy output, dán vào ChatGPT cùng master prompt Architect
→ Nhận về Blueprint + Contracts
→ Chủ review, điều chỉnh nếu cần
→ Lưu vào file tương ứng

**Tiêu chí hoàn thành:**
- Blueprint mô tả rõ kiến trúc, luồng chính, rủi ro
- Contracts có đủ STEP với GATE rõ ràng
- Chủ đã duyệt

### Giai đoạn 3: Thi công

**Người thực hiện:** Coder (AI)

**Hành động (lặp lại cho mỗi STEP):**
```bash
python scripts/vibe.py pack-coder JOB-XXX STEP-N
```
→ Copy output, dán vào Claude Code cùng master prompt Coder
→ Để Claude thực thi
→ Review kết quả

**Tiêu chí hoàn thành:**
- Code/file được tạo đúng spec
- Coder báo cáo đã làm gì

### Giai đoạn 4: Nghiệm thu

**Người thực hiện:** Chủ

**Hành động:**
- Kiểm tra tiêu chí GATE trong Contracts
- Pass → chuyển STEP tiếp theo
- Fail → yêu cầu Coder sửa lại

**Tiêu chí hoàn thành:**
- Tất cả GATE đã pass
- Definition of Done trong Intake đã đạt

### Giai đoạn 5: Đóng JOB

**Người thực hiện:** Chủ

**Hành động:**
```bash
python scripts/vibe.py log JOB-XXX "Hoàn thành JOB, đóng"
```
→ Viết retro: điều gì tốt, điều gì cần cải thiện
→ Cập nhật playbook cá nhân nếu cần

**Tiêu chí hoàn thành:**
- Log ghi đầy đủ
- Có bài học rút ra

### Case study: Dùng Vibecode để build chính Vibecode Starter Kit

Để bạn hình dung rõ hơn, bản thân Vibecode Starter Kit được xây bằng chính framework Vibecode, theo đúng 5 giai đoạn:

**1. Mở JOB & viết Intake**

Tôi mở JOB-001 với câu hỏi rất rõ: "Làm sao để đóng gói cách tôi làm việc với ChatGPT & Claude thành một bộ kit ai cũng dùng được?" Trong Intake, tôi ghi lại bối cảnh, phạm vi, những gì *không* làm trong phiên bản v0.1.

**2. Thiết kế Blueprint**

Với vai Chủ, tôi làm việc với ChatGPT trong vai Architect để phác ra:
- Cấu trúc repo (docs/, templates/, scripts/, examples/, prompts/…)
- 3 tài liệu lõi: Overview, Playbook, Quickstart 7 ngày
- Các JOB lớn cần làm: JOB-001 → JOB-004 (engine), JOB-101 → JOB-103 (product & launch)

**3. Viết Contracts & giao việc cho Coder**

Từ Blueprint, tôi tách thành các STEP cụ thể trong `contracts/`:
- STEP-1: Tạo khung file
- STEP-2: Điền nội dung trung lập, để lại [OWNER_TODO] cho phần cá nhân
- STEP-3: Kiểm tra GATE trước khi coi là "Done"

Mỗi lần, tôi dùng `vibe.py` để pack "Coder Pack" gửi cho Claude trong vai thợ.

**4. Thi công & log lại**

Claude thực thi từng STEP: viết docs, tạo template, hoàn thiện Sales Page, Launch Plan… Sau mỗi JOB, tôi ghi log: JOB-00X làm đến đâu, có gì vướng, cần chỉnh Playbook chỗ nào.

**5. Retro & cải tiến Playbook**

Khi engine, product và launch system đã xong v0.1, tôi quay lại cập nhật Playbook: bổ sung ví dụ cụ thể từ chính hành trình này, điều chỉnh wording để vừa đủ kỹ thuật, vừa dễ dùng cho người không code.

**Kết quả:** Tôi không chỉ có một bộ repo "đẹp & chạy được", mà còn có một **quy trình chuẩn** có thể đem áp dụng cho mọi dự án AI sau này – và bạn cũng vậy.

[OWNER_TODO: thêm screenshot hoặc trích dẫn conversation thực nếu muốn]

---

## 5. Hướng dẫn từng bước

### 5.1. Viết JOB Intake tốt

**Làm:**
- Mô tả bối cảnh đủ để người ngoài hiểu
- Định nghĩa mục tiêu cụ thể, đo được
- Liệt kê rõ "trong phạm vi" và "ngoài phạm vi"
- Ghi ràng buộc: tech stack, thời gian, nguồn lực
- Viết Definition of Done dạng checklist

**Tránh:**
- Intake quá ngắn, thiếu context
- Mục tiêu mơ hồ: "làm cho tốt", "cải thiện performance"
- Không có phạm vi rõ ràng → AI sẽ tự ý mở rộng
- Quên ghi ràng buộc → Architect thiết kế xa rời thực tế

**Template tham khảo:** `templates/jobs/JOB-intake-template.md`

<!-- OWNER_TODO: Kể 1 case "Intake tệ vs Intake tốt" từ kinh nghiệm của bạn. -->

[OWNER_TODO] Thêm ví dụ so sánh Intake tệ vs tốt.

### 5.2. Thiết kế Blueprint

**Làm:**
- Bắt đầu với tóm tắt 2–3 câu về giải pháp
- Vẽ luồng chính (có thể dùng ASCII diagram)
- Liệt kê các thành phần, module, file
- Ghi nhận rủi ro và giả định
- Ghi chú các quyết định thiết kế quan trọng

**Tránh:**
- Blueprint quá chi tiết (đó là việc của Contracts)
- Không có luồng chính → khó hình dung tổng thể
- Bỏ qua rủi ro → gặp vấn đề khi thi công mới biết

**Tips:**
- Yêu cầu Architect vẽ diagram trước, sau đó mới viết chi tiết
- Nếu JOB nhỏ, Blueprint có thể rất ngắn (5–10 dòng)

<!-- OWNER_TODO: Chia sẻ 1 Blueprint mẫu từ dự án thực của bạn. -->

[OWNER_TODO] Thêm ví dụ Blueprint thực tế.

### 5.3. Viết Contracts (STEP & GATE)

**Làm:**
- Mỗi STEP có 4 phần: Mục tiêu, File liên quan, Yêu cầu kỹ thuật, GATE
- STEP nên đủ nhỏ để làm trong 30–90 phút
- GATE phải đo được: "chạy lệnh X thấy Y", "file Z tồn tại"
- Sắp xếp STEP theo thứ tự logic (nền tảng trước, chi tiết sau)

**Tránh:**
- STEP quá lớn (>2 giờ) → khó debug nếu fail
- GATE mơ hồ: "code sạch", "hoạt động đúng"
- Không liệt kê file liên quan → Coder phải tự đoán

**Sizing guide:**
| Độ phức tạp | Số STEP khuyến nghị |
|-------------|---------------------|
| Task nhỏ (script đơn giản) | 2–3 STEP |
| Feature vừa (1 module) | 4–6 STEP |
| Feature lớn (nhiều module) | 7–10 STEP, hoặc chia thành nhiều JOB |

<!-- OWNER_TODO: Kể về 1 lần bạn chia STEP không hợp lý và bài học rút ra. -->

[OWNER_TODO] Thêm bài học về cách chia STEP.

### 5.4. Làm việc với Architect

**Quy trình:**
1. Chuẩn bị: Intake đã điền đủ
2. Chạy `pack-architect` để lấy Architect Pack
3. Mở ChatGPT, dán master prompt Architect (nếu chưa)
4. Dán Architect Pack
5. Yêu cầu: "Thiết kế Blueprint và Contracts cho JOB này"
6. Review output, yêu cầu điều chỉnh nếu cần
7. Copy về file tương ứng

**Tips:**
- Nếu Architect hỏi lại → tốt, nghĩa là nó đang cố hiểu rõ
- Đừng ngại yêu cầu "chia nhỏ STEP X thành 2 STEP"
- Có thể dùng nhiều vòng hội thoại để refine

<!-- OWNER_TODO: Kể về 1 conversation thú vị với Architect AI. -->

[OWNER_TODO] Thêm ví dụ conversation với Architect.

### 5.5. Làm việc với Coder

**Quy trình:**
1. Chuẩn bị: Contracts đã có, đã duyệt
2. Chạy `pack-coder JOB-XXX STEP-N` để lấy Coder Pack
3. Mở Claude Code trong VS Code (repo đang mở)
4. Dán master prompt Coder + Coder Pack
5. Để Claude thực thi
6. Review kết quả, kiểm tra GATE
7. Pass → STEP tiếp. Fail → yêu cầu sửa

**Tips:**
- Làm tuần tự từng STEP, đừng gửi nhiều STEP cùng lúc
- Sau mỗi STEP, kiểm tra GATE ngay, đừng để tích lũy
- Nếu Claude hỏi lại → trả lời rõ ràng, hoặc quay lại sửa Contracts

**Khi Coder làm sai:**
- Không đổ lỗi AI, xem lại Contracts có rõ không
- Cung cấp thêm context nếu cần
- Nếu lỗi lặp lại → có thể cần sửa Blueprint

<!-- OWNER_TODO: Kể về 1 lần Claude làm sai và cách bạn xử lý. -->

[OWNER_TODO] Thêm case study khi Coder làm sai.

### 5.6. Log & Retro

**Log – Ghi nhật ký:**
```bash
python scripts/vibe.py log JOB-XXX "Mô tả ngắn gọn"
```

**Khi nào ghi log:**
- Sau mỗi STEP hoàn thành
- Khi gặp vấn đề, quyết định quan trọng
- Khi thay đổi scope hoặc approach

**Retro – Rút kinh nghiệm:**

Cuối mỗi JOB, trả lời 3 câu hỏi:
1. **Điều gì hoạt động tốt?** (Giữ lại)
2. **Điều gì chưa tốt?** (Cải thiện)
3. **Bài học rút ra?** (Ghi nhớ)

Ghi retro vào cuối file log hoặc file riêng.

**Tips:**
- Log ngắn gọn, đủ để sau này đọc lại hiểu
- Retro trung thực, không đổ lỗi
- Cập nhật playbook cá nhân nếu có insight mới

<!-- OWNER_TODO: Chia sẻ 1 retro thực tế và bài học bạn rút ra. -->

[OWNER_TODO] Thêm ví dụ retro thực tế.

---

## 6. Checklist nhanh

### Trước khi bắt đầu JOB

- [ ] Đã xác định rõ mục tiêu và phạm vi
- [ ] Đã tạo JOB bằng `vibe.py new`
- [ ] Đã điền đầy đủ Intake
- [ ] Đã xác định tech stack, ràng buộc
- [ ] Đã viết Definition of Done

### Trong khi làm

- [ ] Blueprint đã được duyệt trước khi thi công
- [ ] Contracts có GATE rõ ràng cho mỗi STEP
- [ ] Làm tuần tự từng STEP
- [ ] Kiểm tra GATE ngay sau mỗi STEP
- [ ] Ghi log sau mỗi STEP quan trọng
- [ ] Hỏi lại Architect nếu STEP quá lớn hoặc không rõ

### Sau khi xong JOB

- [ ] Tất cả GATE đã pass
- [ ] Definition of Done đã đạt
- [ ] Đã ghi log đóng JOB
- [ ] Đã làm retro
- [ ] Đã cập nhật playbook cá nhân (nếu có insight mới)

---

## 7. Tùy biến Vibecode cho dự án riêng của bạn

Vibecode là framework, không phải luật. Bạn có thể tùy biến:

### 7.1. Thay đổi công cụ

| Thành phần | Mặc định | Có thể thay bằng |
|------------|----------|------------------|
| Lưu trữ file | Markdown trong repo | Notion, Obsidian, Google Docs |
| CLI tool | `vibe.py` | Script tự viết, Make, Just |
| Architect AI | ChatGPT | Claude, Gemini, local LLM |
| Coder AI | Claude Code | Cursor, Copilot, Aider |

### 7.2. Tích hợp với workflow hiện có

**GitHub Issues / Projects:**
- Mỗi JOB = 1 Issue
- Mỗi STEP = 1 Task trong Issue
- Link file Intake/Blueprint trong Issue description

**Notion / Obsidian:**
- Dùng database/table cho danh sách JOB
- Link đến file Markdown hoặc embed nội dung

### 7.3. Áp dụng cho non-code project

Vibecode không chỉ dành cho code:

| Loại project | Ví dụ áp dụng |
|--------------|---------------|
| Viết ebook | JOB = 1 chương, STEP = các section |
| Làm khóa học | JOB = 1 module, STEP = các bài học |
| Marketing campaign | JOB = 1 campaign, STEP = các deliverable |

**Nguyên tắc giữ nguyên:**
- Vẫn có Intake (định nghĩa bài toán)
- Vẫn có Blueprint (kế hoạch tổng thể)
- Vẫn có STEP + GATE (chia nhỏ + nghiệm thu)

<!-- OWNER_TODO: Kể về cách bạn áp dụng Vibecode cho các dự án khác nhau: Translator, FloodWatch, Bếp Nhàn, ebook... -->

[OWNER_TODO] Thêm case study áp dụng Vibecode cho các loại dự án khác nhau.

<!-- OWNER_TODO: Chia sẻ playbook cá nhân của bạn đã tùy biến như thế nào. -->

[OWNER_TODO] Thêm ví dụ playbook cá nhân đã customize.

---

## Case Studies – JOB-201: Doc-to-Action Workflow

### Bối cảnh chung

- **JOB:** JOB-201 – Doc-to-Action Workflow
- **Mục tiêu:** Build một mini-workflow local để biến 1 tài liệu dài thành:
  - Summary có cấu trúc,
  - Action Checklist áp dụng được,
  - Script Draft 3–5 phút để quay video/thu voice.

- **Lý do chọn:** Chủ đang theo đuổi hướng "Local AI SaaS Replacer" – tự xây những workflow AI nhỏ thay thế dần các SaaS đắt tiền (ví dụ các app tóm tắt PDF, app tạo action plan, app viết script content...).

- **Kết quả dogfood:** 2 case studies thực tế, chứng minh workflow hoạt động với cả nội dung technical/strategy và tutorial/process.

---

### Case Study #1 – LocalAI Whitepaper (Technical/Strategy Content)

**Tài liệu:**

- Tên: *Làm Giàu Bài Báo Hạ Tầng AI*
- Loại: Whitepaper chiến lược về hạ tầng AI Local-First, phân tích model mã nguồn mở (DeepSeek, Qwen, Llama), kỹ thuật inference, và triết lý VibeCode.
- Định dạng: PDF (`.pdf`)
- File: `input/Làm Giàu Bài Báo Hạ Tầng AI.pdf`

**Mục tiêu sử dụng Doc-to-Action:**

- Rút lõi nội dung một bài viết nặng về khái niệm & chiến lược.
- Biến nội dung này thành:
  - 1 bản tóm tắt dễ đọc,
  - 1 checklist hành động để triển khai lộ trình LocalAI,
  - 1 script 3–5 phút để giải thích cho người không quá kỹ thuật.

**Lệnh chạy:**

```bash
python doc2action.py \
  "input/Làm Giàu Bài Báo Hạ Tầng AI.pdf" \
  --output-dir output/sample \
  --user-context "AI founder building local-first workflows để thay thế SaaS"
```

**Kết quả:**

- *Summary*:
  - Giữ được trục chính của bài: vì sao hạ tầng AI quan trọng, các lớp hạ tầng, logic LocalAI vs cloud.
  - Hệ thống lại nội dung thành 7 phần, highlight 5 key insights chính.
  - Liệt kê đầy đủ các dự án ứng dụng cụ thể (Prismy Translator, FloodWatch, Teacher AI, Author Engine).

- *Action List*:
  - Chia 5 phases: Strategic Prep → Deployment → Workflow → Implementation → Security.
  - Mỗi action bắt đầu bằng động từ mạnh (Analyze, Calculate, Select, Deploy...).
  - Phân biệt rõ ⭐ (quan trọng) vs ➕ (nice-to-have).
  - Có hướng dẫn cụ thể cho từng project type (translation, sensor data, education, writing).

- *Script Draft*:
  - Hook hấp dẫn, đánh vào pain point (chi phí, privacy, mất kiểm soát).
  - Cấu trúc 3 points rõ ràng, giọng văn gần gũi.
  - CTA nhẹ nhàng, không pushy.

**Nhận xét:**

- Đây là case kiểm chứng Doc-to-Action trong bối cảnh **nội dung kỹ thuật/chiến lược**, nhiều khái niệm trừu tượng.
- Workflow xử lý tốt: summary không bị hời hợt, action list không bị chung chung kiểu "tìm hiểu thêm…".

---

### Case Study #2 – Vibecode Ebook (Tutorial/Process Content)

**Tài liệu:**

- Tên: *Vibecode-forAI* (ebook về framework Vibecode cho AI)
- Loại: Tài liệu hướng dẫn/tư duy quy trình (tutorial/process content).
- Định dạng: Docx (`.docx`)
- File: `input/Vibecode-forAI.docx`

**Mục tiêu sử dụng Doc-to-Action:**

- Kiểm tra khả năng của Doc-to-Action khi áp dụng lên **chính tài liệu Vibecode**:
  - Tóm tắt lại cấu trúc cuốn ebook,
  - Rút ra roadmap hành động để triển khai Vibecode,
  - Tạo script 3–5 phút để giới thiệu Vibecode cho người mới.

**Lệnh chạy:**

```bash
python doc2action.py \
  "input/Vibecode-forAI.docx" \
  --output-dir output/vibecode-ebook \
  --user-context "AI founder teaching others how to work with AI using Vibecode framework"
```

**Kết quả:**

- *Summary*:
  - Nắm rõ 6 phần cấu trúc chính của ebook.
  - Highlight được **5 key insights** về:
    - 3 vai trò: Chủ – Architect – Coder,
    - Giá trị của việc biến việc "gặp AI" thành 1 quy trình có lặp lại,
    - Cách Vibecode giúp giảm tình trạng copy/paste hỗn loạn.

- *Action List*:
  - Chia thành **5 phase chuẩn**: Setup → Design → Dev → Test → Release.
  - Mỗi action bắt đầu bằng động từ, đủ cụ thể để đi vào triển khai thật.
  - Có notes về 3 câu thần chú: "XÁC NHẬN LƯU", "XÁC NHẬN LÀM", "XÁC NHẬN XONG".

- *Script Draft*:
  - Hook rất "trúng": nhấn vào việc **non-coder vẫn có thể xây sản phẩm AI nếu có framework đúng**.
  - Thân bài chia thành 3 ý rõ ràng:
    - Vấn đề hiện tại (copy/paste, quá tải, không ra sản phẩm),
    - Giải pháp 3 vai & JOB của Vibecode,
    - Ví dụ ứng dụng (như Doc-to-Action).
  - CTA cuối khuyến khích người nghe "bắt đầu bằng 1 JOB nhỏ" – đúng tinh thần Vibecode.

**Nhận xét:**

- Đây là case study "tự soi gương": dùng chính Doc-to-Action để **tóm, rút hành động, viết script** cho Vibecode.
- Giúp chứng minh:
  - Vibecode không chỉ là framework để "xây sản phẩm cho khách hàng",
  - Mà còn là công cụ để **chủ nhân hệ thống hóa chính tri thức của mình**.

---

### Giá trị thực tế mang lại cho Chủ

Sau khi chạy JOB-201 trên 2 tài liệu này, Chủ nhận được:

1. **Tiết kiệm thời gian đọc & ghi note:**
   - Thay vì 2-3 giờ đọc + note, chỉ mất ~30 giây chạy workflow + 15 phút đọc summary/action list.
   - Workflow tự động extract được key insights và cấu trúc chính của tài liệu.

2. **Có ngay khung hành động:**
   - Action list cho thấy rõ các bước cần làm, chia phase rõ ràng.
   - Đọc xong là có thể bắt tay triển khai.

3. **Có script sẵn để chia sẻ:**
   - Script draft có thể quay video hoặc làm opening cho buổi chia sẻ/Zoom.
   - Đặc biệt script Vibecode ebook rất phù hợp để giới thiệu framework cho người mới.

4. **Chứng minh workflow dùng được cho nhiều loại content:**
   - Technical/strategy content (LocalAI whitepaper).
   - Tutorial/process content (Vibecode ebook).

---

### Bài học về Vibecode qua JOB-201

Từ JOB-201, Chủ rút ra:

- **Điều Vibecode làm tốt:**
  - Việc chia STEP (1-6) giúp không bị ngợp khi build workflow từ đầu.
  - Cặp Architect–Coder rõ ràng: Architect thiết kế prompt/structure, Coder implement code.
  - Có Intake + Blueprint nên scope rõ ràng, không bị feature creep.
  - Log + Case Study format sẵn giúp document lại journey dễ dàng và reusable.

- **Điều cần chỉnh trong Playbook/Quickstart:**
  - Nên thêm hướng dẫn chọn tài liệu "vừa sức" cho lần dogfood đầu (10-30 trang).
  - Cần note rõ hơn về việc setup API key và dependencies.
  - Có thể thêm 1-2 screenshot minh hoạ cho bước chạy Doc-to-Action.

- **Ý tưởng cho các workflow SaaS replacer tiếp theo:**
  - JOB-202: Workflow chuyển webinar transcript → course outline + quiz.
  - JOB-203: Workflow chuyển ebook chapter → email sequence drip campaign.
  - JOB-204: Workflow chuyển meeting notes → action items + follow-up emails.

---

## Mini Checklist – Khi mở JOB mới cho một SaaS Replacer Workflow (JOB-20X)

Checklist này dùng cho các JOB kiểu JOB-201, khi Chủ muốn xây một workflow AI nhỏ để thay/giảm phụ thuộc vào một SaaS cụ thể.

### 1. Trước khi mở JOB (Pre-JOB)

- [ ] Xác định **1 SaaS cụ thể** muốn thay thế hoặc "clone local".
  - Ví dụ: app tóm tắt PDF, app viết email, app lên lịch social...
- [ ] Viết 2–3 dòng:
  - SaaS này đang giải quyết vấn đề gì cho mình?
  - Điểm đau (pain) khi dùng SaaS đó (giá, giới hạn, dữ liệu, tốc độ...).
- [ ] Chọn 1–2 **use case thật** (tài liệu thật, workflow thực sự đang dùng).

### 2. Intake & Blueprint

- [ ] Tạo `JOB-20X-intake.md`:
  - Rõ **Input → Output**.
  - Rõ phạm vi MVP (chỉ 1 luồng, 1 dạng input trước).
- [ ] Note rõ:
  - Tiêu chí "dùng được": trong 1–2 câu.
  - Ràng buộc (máy, API, thời gian, token).
- [ ] Tạo `JOB-20X-blueprint.md`:
  - Cấu trúc thư mục.
  - Luồng chính (diagram ASCII hoặc bullet steps).

### 3. Trong lúc build (Coding & Orchestrator)

- [ ] Chia việc rõ cho Architect – Coder:
  - Architect lo prompt, flow, interface.
  - Coder lo code, error handling, README.
- [ ] Giữ luồng chạy **1 lệnh duy nhất** (CLI hoặc notebook cell) cho MVP đầu.
- [ ] Luôn có:
  - `config.example.yaml`
  - `requirements.txt`
  - `README.md` với "Cách chạy trong 5 phút".

### 4. Sau khi có MVP (Dogfood)

- [ ] Chạy **ít nhất 1 tài liệu thật** (không phải "Hello World").
- [ ] Lưu lại:
  - Input mẫu (hoặc mô tả).
  - 3–4 output đại diện (sample).
- [ ] Đánh dấu:
  - 3 điều workflow làm tốt.
  - 3 điều cần cải thiện.

### 5. Ghi log & Retro

- [ ] Cập nhật `logs/JOB-20X-log.md` với:
  - Ngày chạy,
  - Lệnh đã dùng,
  - Cảm nhận.
- [ ] Viết Retro ngắn:
  - What went well?
  - What could be better?
  - Next actions (1–3 việc cụ thể).

### 6. Chuẩn bị cho phase productize (tùy chọn)

- [ ] Ghi chú: workflow này **phù hợp nhóm user nào**?
- [ ] 1–2 ý tưởng:
  - Làm UI đơn giản?
  - Gắn vào Prismy/LocalAI platform?
  - Dùng làm mini-product bán kèm?

---

## Kết

Playbook này là điểm khởi đầu. Bạn sẽ phát triển playbook riêng của mình qua thực chiến.

Nguyên tắc quan trọng nhất: **Vibecode giúp bạn làm chủ AI, không phải để AI làm chủ bạn.**

<!-- OWNER_TODO: Viết lời kết mang dấu ấn cá nhân. -->

[OWNER_TODO] Viết lời kết theo phong cách riêng của bạn.

---

*Xem thêm: [Overview](01_overview.md) | [Quickstart 7 ngày](03_quickstart_7_days.md)*
