# JOB-201 – Dogfood Case Study #1
# "Doc-to-Action" – AI Workflow thay thế SaaS tóm tắt PDF & lập kế hoạch hành động

## 1. Bối cảnh

Chủ đang xây một hướng lâu dài:
- Dùng AI workflow để thay thế/tự xây lại các dịch vụ SaaS đắt tiền.
- Đã có nhiều ý tưởng, nhưng cần **1 mini-product thật**, scope nhỏ, để:
  - Dogfood Vibecode Starter Kit Phase 2.
  - Tạo case study sống, chứng minh framework hoạt động trong thực tế.
  - Sau này có thể đóng gói thành 1 "gạch" trong hệ LocalAI SaaS Replacer.

Tài sản/kinh nghiệm liên quan:
- Đã làm rất nhiều việc với tài liệu: dịch PDF, tóm tắt, phân tích.
- Đã có kinh nghiệm với Translator/Prismy.
- Thế mạnh: biến kiến thức trong tài liệu thành nội dung áp dụng (action, script chia sẻ).

## 2. Mục tiêu JOB-201

Tạo ra một AI workflow nhỏ, chạy local, cho phép:

- Input: 1 file tài liệu (ưu tiên PDF/Docx, tiếng Việt hoặc Anh).
- Workflow:
  - Tiền xử lý → tách text.
  - Gọi LLM → sinh ra 3 output:
    1. **Summary**: Tóm tắt cô đọng, theo cấu trúc.
    2. **Action List**: Checklist hành động áp dụng được.
    3. **Script Draft**: Bản nháp script 3–5 phút cho video/voice chia sẻ.
- Output:
  - `output/summary.md`
  - `output/action_list.md`
  - `output/script_draft.md`

Đây là mini-product có thể:
- Dùng nội bộ để học & chia sẻ,
- Sau này gắn vào Prismy/LocalAI SaaS Replacer như một "workflow mẫu",
- Đóng vai trò **case study chính thức** trong docs của Vibecode.

## 3. Phạm vi (Scope)

Trong JOB-201, chúng ta LÀM:

- Thiết kế cấu trúc mini-repo/workflow cho Doc-to-Action.
- Viết script CLI đơn giản (hoặc notebook) để chạy end-to-end (1 lệnh duy nhất).
- Thiết kế prompts, config LLM ở mức đủ dùng.
- Viết README + hướng dẫn chạy.
- Ghi lại case study:
  - Chọn 1 tài liệu thật.
  - Chạy workflow.
  - Ghi log và nhận xét.

KHÔNG làm trong JOB-201:

- Không tối ưu chi phí/tốc độ ở mức production.
- Không làm UI web full, chỉ cần CLI hoặc notebook.
- Không làm hệ thống account, multi-user, billing.
- Không tích hợp phức tạp (Zapier, email send tự động…) – để phase sau.

## 4. Deliverables

- Thư mục mới (nằm trong system lớn – do Architect đề xuất cụ thể):
  - Ví dụ: `examples/doc-to-action-workflow/` hoặc repo riêng.
- Files tối thiểu:
  - `README.md` – mô tả workflow, hướng dẫn chạy.
  - `doc2action.py` hoặc `workflow.ipynb` – workflow chính.
  - `prompts/summary_prompt.md`, `prompts/action_prompt.md`, `prompts/script_prompt.md`.
  - `config.example.yaml` (nếu cần).
- 1 bộ output mẫu trong `examples_output/`.
- 1 đoạn case study (có thể đưa vào `docs/02_vibecode_playbook.md` hoặc file riêng).

## 5. Ràng buộc (Constraints)

- Ngôn ngữ: code/documentation ưu tiên tiếng Anh/Tiếng Việt tùy bối cảnh, nhưng README cần có tiếng Việt.
- Workflow phải chạy được trên:
  - Máy cá nhân hiện tại của Chủ (MacBook Pro M1).
  - Không đòi hỏi setup hạ tầng quá nặng.
- Phải sử dụng **Vibecode Starter Kit**:
  - JOB-201 có Intake, Blueprint, Contracts, Logs đầy đủ.
  - Dùng `vibe.py pack-architect` và `pack-coder` để làm việc với Architect/Coder.

## 6. Định nghĩa "Xong" (Definition of Done)

JOB-201 được coi là HOÀN THÀNH khi:

- Có thể clone/copy mini-workflow, chạy lệnh (hoặc mở notebook) → nhận đủ 3 file output từ 1 PDF mẫu.
- README đủ để một người khác (quen AI ở mức cơ bản) setup & chạy được.
- Log JOB-201 ghi lại ít nhất:
  - 1 vòng retro (những gì đã học được khi dùng Vibecode).
  - 1 case study áp dụng vào tài liệu thật mà Chủ quan tâm.

## 7. Use cases & tiêu chí output (bổ sung STEP 1)

### 7.1. Use cases chính cho Doc-to-Action

1. **Đọc sách/chương chuyên môn → Action plan cá nhân**
   - Tài liệu: sách/chương về sức khỏe, dinh dưỡng, lối sống, mindset…
   - Output:
     - Summary: nắm nhanh ý chính chương.
     - Action list: các bước áp dụng vào đời sống.
     - Script: kịch bản 3–5 phút để quay video chia sẻ.

2. **Paper/báo cáo AI/tech → Action cho sản phẩm/dự án**
   - Tài liệu: bài báo/blog dài về AI, workflow, sản phẩm số, marketing.
   - Output:
     - Summary: vấn đề, giải pháp, insight chính.
     - Action list: checklist "cần làm gì" cho dự án (Prismy, LocalAI SaaS Replacer…).
     - Script: kịch bản giải thích đơn giản để chia sẻ lại cho cộng đồng.

3. **Tài liệu phương pháp → Checklist coaching/giảng dạy**
   - Tài liệu: phương pháp reset, lộ trình coaching, framework làm việc…
   - Output:
     - Summary: cấu trúc 3–5 phần của phương pháp.
     - Action list: checklist theo tuần/buổi.
     - Script: mở đầu cho 1 buổi workshop/webinar hoặc video giới thiệu phương pháp.

4. **Ebook whitepaper/blog dài → Chuẩn bị content cho kênh cá nhân**
   - Tài liệu: ebook free, whitepaper, blog dài.
   - Output:
     - Summary: tinh chất nội dung.
     - Action list: danh sách ý tưởng video/post.
     - Script: kịch bản cho 1 video tiêu biểu.

### 7.2. Tiêu chí chất lượng cho 3 loại output

#### a) Summary (Tóm tắt có cấu trúc)

- Trung thành với tài liệu gốc, không bịa.
- Có cấu trúc rõ: heading H2/H3 cho bối cảnh, ý chính, kết luận.
- Độ dài ~20–30% nội dung gốc, nhưng giữ đủ luận điểm.
- Ngôn ngữ rõ, dễ đọc; giữ thuật ngữ quan trọng, giải thích ngắn nếu cần.
- Cuối summary có mục **"Key Insights"** (3–5 ý).

#### b) Action List (Checklist hành động)

- Mỗi bullet là câu lệnh hành động, bắt đầu bằng động từ.
- Được nhóm theo chủ đề/giai đoạn (Chuẩn bị – Thực hành – Đánh giá).
- Có đánh dấu mức độ quan trọng: ⭐ Must-do / ➕ Optional.
- Cụ thể, đo được, gắn với bối cảnh người dùng.
- Đủ ngắn để thực thi (10–25 mục tùy tài liệu), người dùng biết tuần này/tháng này làm gì.

#### c) Script Draft (Nháp kịch bản nói 3–5 phút)

- Có cấu trúc: Hook (mở) – 2–3 ý chính (thân) – Kết + hành động nhỏ.
- Ngôn ngữ nói, câu ngắn, dễ đọc, có thể thêm gợi ý ngắt nhịp.
- Độ dài mục tiêu ~400–700 từ (3–5 phút nói).
- Giữ được "giọng" của người nói: ấm, chân thành, không lên lớp.
- Bám sát nội dung tài liệu; có nhắc tới nguồn hoặc ý chính của tác giả.
