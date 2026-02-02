# JOB-202 – Asset-to-Funnel Workflow

## 1. Bối cảnh & Mục tiêu

### 1.1. Bối cảnh

Chủ có rất nhiều nội dung dài (ebook, chương sách, bài viết dài, transcript livestream), nhưng:

- Khó repurpose đều tay thành nội dung marketing đa kênh.
- Hiện có nhiều SaaS repurpose (biến 1 video/bài viết thành email, post, script...), nhưng:
  - Tốn phí,
  - Dữ liệu nằm trên cloud của bên khác,
  - Khó tùy biến giọng văn & hệ thống.

### 1.2. Mục tiêu

Xây 1 workflow LocalAI "Asset-to-Funnel" giúp:

- Input: 1 file nội dung dài (docx/pdf/txt).
- Output:
  - 1 sequence 5–7 email nuôi dưỡng (Email Funnel).
  - 5–10 social posts (caption + gợi ý visual).
  - 1–2 script video ngắn (30–90s) để kéo traffic.

Yêu cầu:

- Chạy bằng 1–2 lệnh CLI là xong.
- Dựa trên context "Chủ = chuyên gia/creator", không phải agency.

---

## 2. Đầu vào & Đầu ra

### 2.1. Input

- File nội dung dài:
  - Ưu tiên: `.docx`, `.pdf`, `.md`, `.txt`.
  - Ví dụ:
    - Chương trong ebook "Trẻ thêm lại 1 tuổi"
    - Script livestream Reset Body 30
    - Vibecode ebook (có thể reuse làm case study sau)

- Optional:
  - `user_context` (vai trò, persona)
  - `funnel_goal` (bán ebook / kéo vào group / book 1:1 call)

### 2.2. Output

- `output/email_sequence.md`
  - 5–7 email, mỗi email có:
    - Subject
    - Preview line (1 câu)
    - Body (chia đoạn, có CTA rõ)

- `output/social_posts.md`
  - 5–10 post:
    - Platform gợi ý (FB / TikTok / LinkedIn)
    - Caption
    - Gợi ý visual (image/video idea)

- `output/short_scripts.md`
  - 1–2 script video:
    - Hook (3–5s)
    - Nội dung chính (3 ý)
    - CTA cuối

---

## 3. Tiêu chí chất lượng

### 3.1. Email Sequence

- Có flow rõ: từ làm quen → kể chuyện → đào sâu vấn đề → trao giải pháp → CTA.
- Không quá bán hàng thô; giữ tông giọng "chia sẻ – chuyên gia – chân thành".
- Mỗi email đọc độc lập vẫn hiểu, cả chuỗi thì có mạch.

### 3.2. Social Posts

- Không chỉ "tóm tắt lại nội dung", mà phải:
  - Gây tò mò,
  - Kích phản ứng (comment, share),
  - Hướng về funnel mục tiêu (VD: "vào group", "đọc ebook full").

### 3.3. Short Scripts

- Hook mạnh, đánh trúng nỗi đau.
- Nội dung chính dễ quay bằng thoại tự nhiên, không văn viết.
- CTA rõ ràng, không quá dài dòng.

---

## 4. Phạm vi MVP (v1)

**Trong phạm vi:**
- Chỉ xử lý **1 asset một lần** (1 file input → 1 funnel).
- Hỗ trợ 1, tối đa 2 persona (VD: phụ nữ 25–45, quan tâm sức khỏe).
- Chưa cần UI, chạy CLI là đủ.
- Hỗ trợ: `.docx`, `.pdf`, `.txt` (`.md` nice-to-have).

**Ngoài phạm vi:**
- Batch processing nhiều files cùng lúc.
- Web UI hoặc API endpoint.
- Tự động post lên social media.
- A/B testing variants.

---

## 5. Ràng buộc

**Kỹ thuật:**
- Chạy được trên máy của Chủ (Mac, Python 3.10+).
- Dùng cùng stack với JOB-201 (PyYAML, pypdf, python-docx, OpenAI client).

**Thời gian:**
- Thời gian chạy: chấp nhận vài chục giây → vài phút cho tài liệu 5–20 trang.

**Nguồn lực:**
- Reuse code từ JOB-201 khi có thể (extract_text, call_llm, load_config).

---

## 6. Định nghĩa "DONE" cho JOB-202 (MVP)

- [ ] Có thư mục `examples/asset-to-funnel-workflow/` với đầy đủ files
- [ ] `asset2funnel.py` CLI chạy được với `--help`
- [ ] Chạy 1 lệnh sinh ra 3 file output như mong muốn
- [ ] Có 1 case study với asset thật (ebook chapter hoặc transcript)
- [ ] Có sample output lưu trong `output/`
- [ ] Có retro trong `logs/JOB-202-log.md`

---

## 7. Use Cases & Tiêu chí chi tiết

### 7.1. Use Cases

1. **Creator cá nhân** muốn biến 1 chương ebook → email sequence để nurture list.
2. **Coach/Consultant** muốn biến transcript buổi livestream → social posts để kéo traffic.
3. **Founder** muốn biến whitepaper/case study → short video scripts để quảng bá.
4. **Người viết sách** muốn tạo marketing materials từ nội dung sách sẵn có.

### 7.2. Tiêu chí chất lượng chi tiết

**Email Sequence:**
- [ ] Có đủ 5-7 emails với flow logic
- [ ] Mỗi email có Subject, Preview, Body, CTA
- [ ] Giọng văn chuyên gia, không spam
- [ ] Có progression từ awareness → interest → desire → action

**Social Posts:**
- [ ] Có đủ 5-10 posts
- [ ] Mỗi post gợi ý platform phù hợp
- [ ] Caption có hook + value + CTA
- [ ] Gợi ý visual rõ ràng, thực hiện được

**Short Scripts:**
- [ ] Có 1-2 scripts dưới 90 giây
- [ ] Hook 3-5 giây đầu phải gây chú ý
- [ ] Nội dung nói tự nhiên, không đọc văn bản
- [ ] CTA cuối rõ ràng

---

*Intake này được tạo theo Vibecode Starter Kit framework.*
