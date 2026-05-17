# Mobile Framework UI Guide

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-22  
> **Inspired by:** [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT License)

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Cung cấp hướng dẫn UI best practices theo framework cụ thể: SwiftUI, React Native, Flutter, hoặc Jetpack Compose. Bao gồm components, state management, navigation patterns, và theming.

**Khi nào nên dùng:**
- Bắt đầu dự án mobile mới
- Chuyển từ web sang mobile development
- Cần best practices cho framework cụ thể
- Review UI patterns hiện tại

**Không phù hợp khi:**
- Web-only project
- Backend/API development
- Đã có extensive mobile experience

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design, Build |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R1: auto + audit
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [mobile_framework_ui_guide](../../../governance/skill-library/uat/results/UAT-mobile_framework_ui_guide.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **Framework** | ✅ | SwiftUI, React Native, Flutter, Jetpack Compose | "Flutter" |
| **App type** | ✅ | E-commerce, social, fintech... | "E-commerce marketplace" |
| **Key screens** | ✅ | Màn hình chính cần guidance | "Home feed, Product detail, Cart, Profile" |
| **Experience** | ❌ | Level of team | "Team biết web React, mới chuyển mobile" |
| **Design system** | ❌ | Có sẵn hay cần tạo | "Chưa có, cần setup" |

---

## ✅ Expected Output

```
MOBILE UI GUIDE: [Framework]
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 NAVIGATION:
  Pattern: Bottom Tab + Stack Navigation
  Library: go_router (Flutter) / React Navigation
  Tabs: Home, Search, Cart (badge), Profile
  Deep linking: /product/:id, /order/:id

🧩 COMPONENTS:
  Lists:    Use lazy loading (ListView.builder / FlatList)
  Images:   Cached + placeholder (cached_network_image / FastImage)
  Forms:    TextInput with validation, keyboard avoidance
  Modals:   Bottom sheet preferred on mobile
  Pull-to-refresh: Always on list screens

🎨 THEMING:
  Colors:   Use ThemeData / StyleSheet.create
  Dark mode: System-aware (MediaQuery.platformBrightness)
  Typography: Platform default (SF Pro / Roboto) or custom
  Spacing:  8px grid system (8, 16, 24, 32)

⚡ PERFORMANCE:
  • Avoid rebuilds: const constructors (Flutter) / React.memo
  • Image sizes: Request exact dimensions from API
  • List optimization: viewportFraction, itemExtent
  • Animations: Use platform APIs, not JS bridge

📐 PLATFORM CONVENTIONS:
  iOS:  Large titles, swipe-back, SF Symbols
  Android: Material You, predictive back, system icons
  Cross: Adapt to platform, don't force one style
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Navigation pattern phù hợp app type
- [ ] Component recommendations framework-specific
- [ ] Theming setup included (colors, typography, spacing)
- [ ] Performance tips practical
- [ ] Platform conventions respected (iOS ≠ Android)
- [ ] Code snippets sẵn dùng

**Red flags (cần Reject):**
- ⚠️ Web patterns forced vào mobile (horizontal scroll tabs trên phone)
- ⚠️ Generic advice không specific framework
- ⚠️ Bỏ qua platform conventions
- ⚠️ Không mention performance considerations

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Web thinking trên mobile | Research platform conventions |
| Forgot keyboard avoidance | Test with keyboard open |
| Images not cached | Always use caching library |
| Too many rebuilds | Profile with DevTools |
| Ignore safe areas | SafeArea / useSafeAreaInsets |

---

## 💡 Tips

1. **Platform-first** — Use native components khi có thể
2. **Bottom sheets > Modals** — Natural gesture trên mobile
3. **Skeleton loading** — Better perceived performance
4. **Touch targets = 44px** — Apple HIG + Google Material
5. **Test trên real device** — Emulator ≠ real performance

---

## 📊 Ví dụ thực tế

### Input:
```
Framework: React Native
App type: Social media with stories, feed, messaging
Key screens: Feed, Stories, Chat, Profile, Settings
Experience: Team biết React web, first mobile project
```

### Output tóm tắt:
```
Navigation: Bottom Tabs (Feed, Search, Create, Chat, Profile)
Feed: FlatList with estimated item size
Stories: Horizontal FlatList, pagingEnabled
Chat: Gifted Chat library + keyboard avoiding
Performance: Use Hermes engine, avoid bridge calls
Platform: iOS swipe-back, Android material ripple
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [UI Pre-Delivery Checklist](./ui_pre_delivery_checklist.skill.md)
- [UI Style Selection](../product_ux/ui_style_selection.skill.md)

---

*CVF Skill Library v1.5.2 | App Development Domain | Adapted from UI UX Pro Max (MIT)*
