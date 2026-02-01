# 🎨 UI Design Principles

**CVF v1.5 — Web Interface**

---

## Core Principles

### 1. Zero Friction
```
"Từ mở app đến submit < 2 phút"
```
- Không registration barrier
- Không tutorial bắt buộc
- Defaults hợp lý

### 2. Progressive Disclosure
```
"Hiện đúng thứ cần hiện, đúng lúc cần hiện"
```
- Basic fields hiện trước
- Advanced options ẩn trong "More"
- Help text on-demand

### 3. Forgiving Design
```
"User không sợ làm sai"
```
- Undo mọi action
- Clear error messages
- Auto-save drafts

### 4. Consistent Patterns
```
"Học 1 lần, dùng mọi nơi"
```
- Same form layout everywhere
- Same button positions
- Same color meanings

---

## Color System

| Color | Usage | Hex |
|-------|-------|-----|
| 🔵 Primary | CTAs, links | `#2563EB` |
| 🟢 Success | Accept, pass | `#16A34A` |
| 🔴 Error | Reject, fail | `#DC2626` |
| 🟡 Warning | Caution | `#CA8A04` |
| ⚫ Neutral | Text, borders | `#374151` |

---

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 32px | Bold |
| H2 | Inter | 24px | Semibold |
| Body | Inter | 16px | Regular |
| Caption | Inter | 14px | Regular |
| Code | JetBrains Mono | 14px | Regular |

---

## Spacing System

```
4px  — xs (padding small)
8px  — sm (gaps)
16px — md (section padding)
24px — lg (card padding)
32px — xl (page margin)
```

---

## Component States

### Buttons
```
Default  → Hover → Active → Disabled
[Blue]   → [Dark] → [Darker] → [Gray]
```

### Form Fields
```
Empty → Focus → Filled → Error → Success
[Gray] → [Blue border] → [Green check] → [Red border]
```

### Cards
```
Default → Hover → Selected
[White] → [Shadow] → [Blue border]
```

---

## Responsive Breakpoints

| Device | Width | Layout |
|--------|-------|--------|
| Mobile | < 640px | Single column |
| Tablet | 640-1024px | 2 columns |
| Desktop | > 1024px | 3 columns |

---

## Accessibility

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast AA compliant
- ✅ Focus indicators
- ✅ Alt text for images

---

## Loading States

```
┌─────────────────────────┐
│  ⏳ Processing...       │
│  [████████░░░░] 60%    │
│                         │
│  Estimated: 15 seconds  │
└─────────────────────────┘
```

---

## Error States

```
┌─────────────────────────────────┐
│  ⚠️ Unable to process           │
│                                 │
│  Your request was too vague.   │
│  Please add more context.      │
│                                 │
│  [Try Again] [Edit Input]       │
└─────────────────────────────────┘
```

---

*UI Principles — CVF v1.5 Web Interface*
