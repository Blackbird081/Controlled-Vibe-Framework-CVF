# Hướng dẫn: Kỹ năng mới từ phân tích claude-code-templates (AGT-015 → AGT-020)

**Thời gian:** 30 phút  
**Cấp độ:** Trung cấp → Nâng cao  
**Yêu cầu:** [Agent Platform đã cài đặt](agent-platform.md), [Hướng dẫn Kỹ năng Agentic v1 (AGT-009–014)](using-agentic-skills.md)  
**Bạn sẽ học:** Cách sử dụng 6 kỹ năng mới lấy cảm hứng từ claude-code-templates — hooks, nghiên cứu khoa học, chuyển đổi tài liệu, nhóm agent, tải tiến triển, và phân tích

---

## Tổng quan

CVF v1.6.2 mở rộng từ **14 lên 20 công cụ agent** sau khi phân tích hệ sinh thái [claude-code-templates](https://github.com/davila7/claude-code-templates) (500+ thành phần). 6 kỹ năng mới đưa các mẫu thiết kế mạnh mẽ vào khung quản trị CVF:

| Kỹ năng | Chức năng | Risk | Khi nào dùng |
|---------|-----------|------|-------------|
| ⚡ **AGT-015: Workflow Hook** | Tự động hóa trước/sau công cụ | R2 | CI/CD, quét bảo mật, test tự động |
| 🔬 **AGT-016: Nghiên cứu KH** | Tổng quan tài liệu, phân tích dữ liệu | R1 | Quy trình nghiên cứu khoa học |
| 📄 **AGT-017: Chuyển đổi tài liệu** | Tạo/chuyển đổi PDF, DOCX, XLSX, PPTX | R1 | Xử lý hoặc tạo tài liệu |
| 👥 **AGT-018: Nhóm Agent** | Phối hợp nhiều agent chuyên biệt | R3 | Nhiệm vụ phức tạp cần nhiều agent |
| 📦 **AGT-019: Tải tiến triển** | Quản lý tải kỹ năng theo ngân sách context | R0 | Tự động — quản lý cách kỹ năng tải |
| 📊 **AGT-020: Bảng phân tích** | Giám sát phiên làm việc AI thời gian thực | R1 | Theo dõi hiệu suất và tuân thủ |

---

## Phân phối rủi ro mới

```
R0 (4 kỹ năng) ── R1 (6 kỹ năng) ── R2 (6 kỹ năng) ── R3 (4 kỹ năng)
An toàn/Tự động   Thấp/Tự động     Trung bình/Giám sát  Cao/Thủ công
```

---

## Kỹ năng 1: Workflow Automation Hook (AGT-015)

### Chức năng

Quản lý các hook tự động hóa chạy trước hoặc sau hành động công cụ AI — tương tự git hooks nhưng cho quy trình AI. Lấy cảm hứng từ hệ thống 10 loại hook của claude-code-templates.

### Khi nào dùng

- Quét bí mật (secrets) trước khi commit code
- Tự động chạy test sau khi thay đổi code
- Gửi thông báo (Slack, Telegram) khi có sự kiện
- Kiểm tra lint/validation trước khi công cụ thực thi

### Ví dụ prompt

```
"Thiết lập pre-commit hook quét bí mật trước khi cho phép commit"
"Thêm post-tool hook chạy test mỗi khi File Write hoàn thành"
"Cấu hình hook thông báo Slack khi triển khai hoàn tất"
```

### Loại sự kiện Hook

| Sự kiện | Khi nào | Dùng cho |
|---------|---------|----------|
| `PreToolUse` | Trước khi công cụ chạy | Xác thực, quét bảo mật |
| `PostToolUse` | Sau khi công cụ hoàn thành | Testing, thông báo, ghi log |
| `PreCommit` | Trước git commit | Kiểm tra lint, format |
| `PostCommit` | Sau git commit | Kích hoạt CI, thông báo |
| `OnError` | Khi công cụ gặp lỗi | Báo lỗi, logic dự phòng |

---

## Kỹ năng 2: Trợ lý Nghiên cứu Khoa học (AGT-016)

### Chức năng

Hỗ trợ quy trình nghiên cứu khoa học có cấu trúc. Lấy cảm hứng từ 139 kỹ năng khoa học của K-Dense-AI bao gồm sinh học, hóa học, y học, vật lý, và khoa học tính toán.

### Khi nào dùng

- Tổng quan tài liệu với trích dẫn đúng chuẩn
- Tạo giả thuyết từ bằng chứng hiện có
- Chọn phương pháp phân tích thống kê
- Cấu trúc bài báo nghiên cứu (IMRaD)

### Ví dụ prompt

```
"Thực hiện tổng quan tài liệu về kỹ thuật CRISPR gene editing năm 2025"
"Giúp tôi thiết kế kế hoạch phân tích thống kê cho thử nghiệm lâm sàng 3 nhóm điều trị"
"Cấu trúc kết quả nghiên cứu theo định dạng IMRaD với trích dẫn đúng"
```

---

## Kỹ năng 3: Chuyển đổi Định dạng Tài liệu (AGT-017)

### Chức năng

Tạo, chuyển đổi và phân tích tài liệu đa định dạng. Lấy cảm hứng từ bộ công cụ xử lý tài liệu của Anthropic.

### Khi nào dùng

- Trích xuất bảng và text từ PDF
- Tạo tài liệu Word hoặc bài thuyết trình chuyên nghiệp
- Chuyển đổi giữa các định dạng
- Phân tích dữ liệu bảng tính

### Ví dụ prompt

```
"Trích xuất tất cả bảng từ PDF này và chuyển sang CSV"
"Tạo bài thuyết trình PowerPoint từ outline Markdown này"
"Chuyển đổi tài liệu Word này sang Markdown"
```

---

## Kỹ năng 4: Điều phối Nhóm Agent (AGT-018)

### Chức năng

Phối hợp nhiều sub-agent chuyên biệt làm việc cùng nhau. Lấy cảm hứng từ mẫu nhóm agent của claude-code-templates.

### Khi nào dùng

- Nhiệm vụ phức tạp cần nhiều chuyên môn
- Dự án nghiên cứu cần chu trình lập kế hoạch → thực hiện → đánh giá
- Quy trình phát triển: thiết kế → code → test → review

### Mẫu nhóm

```
┌──────────────────────────────────────┐
│     Điều phối Nhóm Agent             │
│       (AGT-018, R3)                  │
├──────────┬──────────┬────────────────┤
│ Lập kế   │ Thực     │   Đánh giá    │
│ hoạch    │ hiện     │               │
│ (AGT-012)│(AGT-002) │  (AGT-001,007)│
└──────────┴──────────┴────────────────┘
```

### Kiểm soát quản trị

- **Phê duyệt:** Thành phần nhóm VÀ kế hoạch nhiệm vụ cần phê duyệt thủ công
- **Sub-agents:** Mỗi sub-agent tuân theo quy tắc quản trị riêng
- **Xung đột:** Chuyển cho người khi phát hiện (không tự giải quyết)
- **Giới hạn:** Tối đa 5 agent/nhóm, tối đa 3 vòng lặp

---

## Kỹ năng 5: Tải Kỹ năng Tiến triển (AGT-019)

### Chức năng

Quản lý cách các định nghĩa kỹ năng tải vào cửa sổ context. Chỉ tải cần thiết khi cần — giữ context gọn nhẹ.

### Hoạt động tự động

```
┌─────────────────────────────────────┐
│ Luôn trong context (~7K tokens):     │
│ Metadata cho tất cả 20 kỹ năng      │
├─────────────────────────────────────┤
│ Tải khi kích hoạt (~1-2K mỗi):      │
│ Hướng dẫn cho 2-3 kỹ năng đang dùng│
├─────────────────────────────────────┤
│ Tải theo yêu cầu (~3-5K mỗi):       │
│ Tài nguyên, ví dụ, mẫu             │
├─────────────────────────────────────┤
│ Không tải (0 tokens):               │
│ Scripts — chỉ tham chiếu đường dẫn  │
└─────────────────────────────────────┘
```

### Tiết kiệm ngân sách Context

| Chiến lược | Context sử dụng |
|-----------|----------------|
| Tải tất cả 20 kỹ năng | ~200,000 tokens |
| Progressive disclosure | ~12,200 tokens |
| **Tiết kiệm** | **93.9%** |

---

## Kỹ năng 6: Tạo Bảng Phân tích (AGT-020)

### Chức năng

Tạo bảng điều khiển phân tích thời gian thực để giám sát phiên AI, theo dõi sử dụng kỹ năng, tuân thủ quản trị và sức khỏe hệ thống.

### Khi nào dùng

- Giám sát kỹ năng nào được sử dụng nhiều nhất
- Theo dõi tỷ lệ tuân thủ quản trị
- Phát hiện bất thường trong hành vi agent
- Tạo báo cáo kiểm tra sức khỏe

### Ví dụ prompt

```
"Tạo bảng điều khiển hiển thị sử dụng kỹ năng trong 7 ngày qua"
"Hiển thị số liệu tuân thủ quản trị cho dự án này"
"Theo dõi sử dụng token và chi phí ước tính theo loại kỹ năng"
```

---

## Pipeline kết hợp kỹ năng

### Pipeline 1: Nghiên cứu → Báo cáo tự động

```
AGT-016 (Nghiên cứu KH)
    → AGT-010 (Trực quan hóa dữ liệu)
    → AGT-017 (Chuyển đổi → PDF)
    → AGT-020 (Phân tích → theo dõi)
```

### Pipeline 2: CI/CD với Quản trị

```
AGT-015 (Pre-commit Hook → quét bảo mật)
    → AGT-008 (File Write → lưu thay đổi)
    → AGT-015 (Post-tool Hook → chạy test)
    → AGT-020 (Phân tích → ghi tuân thủ)
```

### Pipeline 3: Phát triển đa Agent

```
AGT-018 (Nhóm Agent → lập kế hoạch + code + review)
    → AGT-012 (Agentic Loop → lặp)
    → AGT-015 (Hooks → auto-test)
    → AGT-020 (Phân tích → hiệu suất nhóm)
```

---

## Lỗi thường gặp

| Lỗi | Cách đúng |
|-----|-----------|
| Dùng AGT-018 cho việc đơn giản | Dùng kỹ năng đơn — nhóm dành cho việc phức tạp nhiều bước |
| Bỏ qua phê duyệt hook | Tất cả hook cần phê duyệt trước khi kích hoạt |
| Tải tất cả tài nguyên kỹ năng ngay | AGT-019 xử lý tự động — tin vào progressive disclosure |
| Dùng AGT-016 cho tư vấn y tế | Nghiên cứu KH chỉ tư vấn — không đưa ra khuyến nghị lâm sàng |

---

## Bước tiếp theo

- **[Hướng dẫn Progressive Disclosure](progressive-disclosure-guide.md)** — Chi tiết về mẫu tải kỹ năng 4 lớp
- **[Báo cáo Phân tích đầy đủ](claude-code-templates-analysis.md)** — Phân tích khoảng cách và khuyến nghị kiến trúc
- **[Hướng dẫn Kỹ năng Agentic v1](using-agentic-skills.md)** — Hướng dẫn cho AGT-009 → AGT-014
