# ✉️ Email Templates

**Domain:** Content  
**Preset:** `content`

---

## Mô tả ngắn

Tạo professional emails cho các tình huống business phổ biến.

---

## Khi nào dùng

- Client communication
- Internal announcements
- Follow-up emails
- Request/proposal emails

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Purpose | ✅ | select | Type of email |
| Recipient | ✅ | text | Ai nhận |
| Context | ✅ | textarea | Tình huống |
| Tone | ❌ | select | Formal/Casual |

---

## Intent Pattern

```
INTENT:
Tôi cần soạn email [purpose] cho [recipient].

CONTEXT:
- Purpose: [announcement/request/follow-up/etc.]
- Recipient: [role/relationship]
- Context: [tình huống cụ thể]
- Tone: [formal/casual/friendly]

SUCCESS CRITERIA:
- Clear subject line
- Concise body (< 200 words)
- Clear call to action
```

---

## Output Expected

```
Subject: [Clear, action-oriented subject]

Hi [Name],

[Opening - 1 sentence context]

[Body - key message]

[Call to action]

Best regards,
[Your name]
```

---

*Template thuộc CVF v1.5 UX Platform*
