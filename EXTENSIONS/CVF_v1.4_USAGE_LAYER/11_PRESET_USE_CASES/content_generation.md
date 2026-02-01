# ✍️ Content Generation Preset

**CVF v1.4 – Usage Layer**

---

## Mục tiêu

Preset này dùng khi người dùng cần **tạo nội dung** có cấu trúc và chất lượng kiểm soát được.

---

## Khi nào dùng

- Viết documentation
- Tạo báo cáo, proposal
- Soạn email, thông báo chuyên nghiệp
- Tạo hướng dẫn, tutorial

---

## Intent Template

```
INTENT:
Tôi cần tạo [loại nội dung] về [chủ đề]

CONTEXT:
- Đối tượng đọc: [technical/non-technical/executive]
- Tone: [formal/casual/professional]
- Độ dài: [ngắn/trung bình/chi tiết]
- Format: [markdown/plain text/structured]

SUCCESS CRITERIA:
- Đúng tone và đối tượng
- Có structure rõ ràng
- Sẵn sàng sử dụng (không cần edit nhiều)
```

---

## Output Format kỳ vọng

```markdown
# [Title]

## [Section 1]
[Content...]

## [Section 2]
[Content...]

---
*[Metadata: Word count, target audience, etc.]*
```

---

## Ví dụ thực tế

### Ví dụ 1: Technical Documentation

```
INTENT:
Tôi cần tạo README.md cho Python package.

CONTEXT:
- Package: Data validation library
- Đối tượng: Python developers
- Tone: Professional, concise
- Sections cần có: Installation, Quick Start, API Reference

SUCCESS CRITERIA:
- Copy-paste được vào GitHub
- Có code examples
- Dưới 300 lines
```

### Ví dụ 2: Business Proposal

```
INTENT:
Tôi cần tạo proposal cho dự án modernization hệ thống.

CONTEXT:
- Đối tượng: C-level executives
- Tone: Professional, persuasive
- Budget: 500k USD
- Timeline: 12 tháng

SUCCESS CRITERIA:
- Executive summary trong 1 page
- ROI projection
- Risk mitigation plan
```

### Ví dụ 3: Internal Communication

```
INTENT:
Tôi cần soạn email thông báo thay đổi quy trình cho team.

CONTEXT:
- Đối tượng: Team 20 người, mixed technical
- Tone: Friendly but clear
- Thay đổi: Mới deploy process từ tuần sau

SUCCESS CRITERIA:
- Ngắn gọn (dưới 200 words)
- Clear action items
- Có timeline
```

---

## Điều KHÔNG nên làm

❌ "Viết cho tôi cái gì đó hay hay" (quá mơ hồ)  
❌ "Copy style của [famous writer]" (copyright concern)  
❌ "Viết theo ý tôi: [chi tiết từng câu]" (micromanage)  

---

## Content Types hỗ trợ tốt

| Type | Độ phù hợp | Lưu ý |
|------|:----------:|-------|
| Documentation | ⭐⭐⭐ | Best use case |
| Reports | ⭐⭐⭐ | Cần clear data |
| Proposals | ⭐⭐⭐ | Cần context rõ |
| Emails | ⭐⭐ | Keep short |
| Creative writing | ⭐ | Không phù hợp |

---

*Preset này thuộc CVF v1.4 Usage Layer*