# 🎤 Presentation Template

**Domain:** Content  
**Preset:** `content`

---

## Mô tả ngắn

Tạo nội dung slides cho presentations và pitches.

---

## Khi nào dùng

- Investor pitch
- Team presentations
- Client proposals
- Conference talks

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Topic | ✅ | text | Chủ đề presentation |
| Audience | ✅ | text | Ai sẽ nghe |
| Duration | ✅ | number | Số phút |
| Key message | ✅ | textarea | Điều quan trọng nhất |
| Format | ❌ | select | Pitch/Informative/Training |

---

## Intent Pattern

```
INTENT:
Tôi cần tạo presentation về [topic].

CONTEXT:
- Topic: [chủ đề]
- Audience: [target audience]
- Duration: [X minutes]
- Key message: [điều quan trọng nhất cần truyền tải]
- Format: [pitch/informative/training]

SUCCESS CRITERIA:
- Clear slide structure
- 1 key point per slide
- Strong opening and closing
```

---

## Output Expected

```markdown
# [Presentation Title]

## Slide 1: Title
- [Title]
- [Subtitle]
- [Speaker name]

## Slide 2: Hook
- [Attention-grabbing statement/question]

## Slide 3-N: Content
### [Topic 1]
- Bullet 1
- Bullet 2

### [Topic 2]
- Bullet 1
- Bullet 2

## Slide N+1: Summary
- Key point 1
- Key point 2
- Key point 3

## Slide N+2: Call to Action
- [What you want audience to do]

## Speaker Notes
[Additional context for each slide]
```

---

*Template thuộc CVF v1.5 UX Platform*
