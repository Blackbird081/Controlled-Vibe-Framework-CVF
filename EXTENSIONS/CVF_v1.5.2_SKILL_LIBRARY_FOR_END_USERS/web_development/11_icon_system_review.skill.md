# Icon System Review

> **Domain:** Web Development  
> **Difficulty:** ⭐ Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-22  
> **Inspired by:** [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT License)

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá hệ thống icon: không dùng emoji làm UI icons, consistent icon set, brand logos chính xác, SVG viewBox sizing, hover states, và accessibility.

**Khi nào nên dùng:**
- Review UI trước launch
- Icon inconsistency across pages
- Mix of emoji + SVG + font icons
- Brand logo verification

**Không phù hợp khi:**
- Marketing content (emoji OK trong content)
- Print/offline design

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Design, Review |
| Authority Scope | Tactical |
| Autonomy | Auto |
| Audit Hooks | Input completeness, Output structure |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R0: fully auto
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [icon_system_review](../../../governance/skill-library/uat/results/UAT-icon_system_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **URL/Code** | ✅ | Link hoặc code cần review | "https://myapp.com" |
| **Current icon source** | ✅ | Icon library đang dùng | "Mix: Heroicons + emoji + custom SVG" |
| **Brand logos** | ❌ | Logos cần verify | "Google, Apple, GitHub logos" |
| **Framework** | ❌ | React, Vue... | "React + Tailwind" |

---

## ✅ Expected Output

```
ICON SYSTEM REVIEW: [Project Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 EMOJI AS ICONS (Replace immediately):
  ❌ 🔍 used for search → <SearchIcon />
  ❌ ⚙️ used for settings → <CogIcon />
  ❌ 📊 used for analytics → <ChartBarIcon />
  WHY: Emoji render differently across OS/browsers

🟡 ICON CONSISTENCY:
  ❌ Heroicons (outline) + FontAwesome (solid) mixed
  → Pick ONE: Recommend Heroicons or Lucide React
  ❌ Icon sizes inconsistent: 16px, 20px, 24px, 32px
  → Standardize: 16px (inline), 20px (buttons), 24px (nav)

🟢 SVG QUALITY:
  ✅ viewBox="0 0 24 24" — consistent
  ❌ stroke-width varies: 1.5, 2, 2.5
  → Standardize: stroke-width="1.5" (outline) or "2" (solid)
  ✅ currentColor used — adapts to theme

🔵 BRAND LOGOS:
  ✅ Google logo — correct from Simple Icons
  ❌ GitHub logo — outdated (old octocat)
  → Fix: Download from simpleicons.org

🟣 ACCESSIBILITY:
  ❌ 12 icons missing aria-hidden="true" (decorative)
  ❌ 3 interactive icons missing aria-label
  → Fix: Decorative → aria-hidden, Interactive → aria-label

SCORE: 5/10 → Target: 9/10
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Không dùng emoji làm UI icons
- [ ] Consistent icon library (1 set)
- [ ] Standard sizes (16/20/24px)
- [ ] SVG viewBox + stroke-width nhất quán
- [ ] Brand logos chính xác (Simple Icons)
- [ ] `aria-hidden="true"` trên decorative icons
- [ ] `aria-label` trên interactive icons
- [ ] `currentColor` cho theme compatibility

**Red flags (cần Reject):**
- ⚠️ Emoji dùng trong navigation/buttons
- ⚠️ > 2 icon libraries mixed
- ⚠️ Raster images (PNG/JPG) thay vì SVG
- ⚠️ Icons không scale đúng (blurry)

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Emoji as UI icons | Always use SVG icon components |
| Mix icon libraries | Pick one: Heroicons OR Lucide |
| Fixed color icons | Use currentColor for theming |
| No aria attributes | Decorative: aria-hidden, Action: aria-label |
| Import entire library | Named imports only |

---

## 💡 Tips

1. **Heroicons** — By Tailwind team, 300+ icons, outline + solid
2. **Lucide React** — Fork of Feather, 1000+ icons, tree-shakeable
3. **Simple Icons** — Brand logos (100% accurate, SVG)
4. **`currentColor`** — Icon inherits text color = auto dark mode
5. **Sprite sheet** — For 50+ icons, SVG sprite reduces HTTP requests

### Recommended Icon Sets:
```
UI Icons:    Heroicons (Tailwind) or Lucide (versatile)
Brand Logos: Simple Icons (simpleicons.org)
Flags:       flag-icons or country-flag-icons
Illustrations: unDraw, Humaaans (free)
```

---

## 📊 Ví dụ thực tế

### Input:
```
URL: React SaaS dashboard
Current icons: Mix of emoji (sidebar) + Heroicons (content) + FontAwesome (footer)
Brand logos: Stripe, GitHub, Google in footer
```

### Output tóm tắt:
```
🔴 7 emoji icons in sidebar → Replace with Heroicons
🟡 FontAwesome in footer → Switch to Heroicons (consistency)
🟢 Heroicons usage in content — correct
🔵 Stripe logo: OK, GitHub logo: outdated version
Action: Consolidate to Heroicons only + update GitHub logo
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [Accessibility Audit](../product_ux/accessibility_audit.skill.md)
- [CVF Web UX Redesign System](../product_ux/cvf_web_ux_redesign_system.skill.md)

---

*CVF Skill Library v1.5.2 | Web Development Domain | Adapted from UI UX Pro Max (MIT)*
