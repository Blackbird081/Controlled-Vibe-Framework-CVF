# UI Style Selection

> **Domain:** Product & UX  
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

Chọn UI style phù hợp nhất cho sản phẩm dựa trên ngành, đối tượng mục tiêu, và mục đích kinh doanh. Phân tích từ 67+ styles hiện đại (Glassmorphism, Neumorphism, Brutalism, Bento Grid, v.v.) để tìm style tối ưu.

**Khi nào nên dùng:**
- Bắt đầu dự án mới, chưa biết chọn style nào
- Redesign sản phẩm hiện tại
- Cần justify quyết định design với stakeholders
- Muốn theo trend nhưng phù hợp ngành

**Không phù hợp khi:**
- Đã có brand guidelines cố định với style cụ thể
- Chỉ cần fix nhỏ UI hiện tại

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design |
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

- UAT Record: [ui_style_selection](../../../governance/skill-library/uat/results/UAT-ui_style_selection.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **Loại sản phẩm** | ✅ | SaaS, e-commerce, portfolio, dashboard... | "Fintech banking app" |
| **Ngành** | ✅ | Healthcare, Fintech, Beauty, SaaS... | "Tài chính ngân hàng" |
| **Đối tượng** | ✅ | Mô tả user mục tiêu | "Nhân viên VP 25-40, quen tech" |
| **Mood keywords** | ❌ | Cảm xúc mong muốn | "Tin cậy, chuyên nghiệp, hiện đại" |
| **Platform** | ❌ | Web, iOS, Android, cross-platform | "Web + Mobile responsive" |
| **Dark/Light** | ❌ | Preference theme | "Dark mode preferred" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

1. **Top 3 Style Recommendations** — Ranked theo phù hợp
2. **Style Detail** cho mỗi option:
   - Tên style + mô tả trực quan
   - CSS variables/tokens mẫu
   - Visual effects chính (shadow, blur, gradient...)
   - Screenshots/references
3. **Anti-patterns** — Styles KHÔNG nên dùng cho ngành này
4. **Implementation Notes** — Framework-specific tips
5. **Accessibility Score** — WCAG compatibility của style

### Ví dụ Output Format:

```
RECOMMENDED STYLE: Soft UI Evolution
├── Keywords: Soft shadows, subtle depth, calming, organic shapes
├── Best For: Wellness, beauty, lifestyle brands
├── CSS: box-shadow: 6px 6px 12px #d1d9e6, -6px -6px 12px #fff
├── Effects: Smooth transitions (200-300ms), gentle hover states
├── Performance: Excellent | Accessibility: WCAG AA
│
├── ANTI-PATTERNS (Avoid):
│   ✗ Neon gradients — quá aggressive cho wellness
│   ✗ Brutalism — mâu thuẫn với calming mood
│   ✗ AI purple/pink — overused, không phù hợp ngành
│
└── ALTERNATIVES:
    2nd: Clean Minimalism — nếu muốn tối giản hơn
    3rd: Organic Modern — nếu muốn warm hơn
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Style phù hợp với ngành/đối tượng mục tiêu
- [ ] Có ít nhất 3 options ranked
- [ ] Mỗi option có CSS/implementation guide
- [ ] Anti-patterns được liệt kê rõ ràng
- [ ] Accessibility score cho mỗi style
- [ ] Không recommend style "trendy" mà không phù hợp ngành

**Red flags (cần Reject):**
- ⚠️ Recommend Glassmorphism cho banking app (trust issue)
- ⚠️ Recommend Dark mode cho healthcare (readability)
- ⚠️ Không có anti-patterns — thiếu critical thinking
- ⚠️ Chỉ recommend 1 style không có alternatives

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Chọn style theo trend, không theo ngành | Bắt buộc map ngành → style |
| Bỏ qua accessibility | Yêu cầu WCAG score cho mỗi style |
| Recommend quá nhiều effects | Giới hạn 3-4 key effects |
| Không xét dark/light mode | Yêu cầu cả hai mode check |
| Style đẹp nhưng performance kém | Check rendering performance |

---

## 💡 Tips

1. **Industry-first, trend-second** — Fintech cần trust, Beauty cần emotion
2. **Less is more** — 2-3 key effects tốt hơn 10 effects chồng chéo
3. **Test trên mobile trước** — Style đẹp desktop có thể xấu mobile
4. **Anti-patterns quan trọng bằng recommendations** — biết không nên làm gì
5. **Performance check** — Glassmorphism blur filter = GPU intensive

---

## 📊 Ví dụ thực tế

### Input:
```
Loại sản phẩm: Trading dashboard
Ngành: Fintech/Crypto
Đối tượng: Traders 20-35 tuổi, heavy users, dùng nhiều giờ/ngày
Mood: Powerful, professional, real-time
Platform: Web desktop-first
Dark mode: Yes
```

### Output tóm tắt:
```
1st: Data-Dense Dark UI — Clean typography, high-contrast data tables
2nd: Trading Terminal Style — Bloomberg-inspired, dense but readable
3rd: Modern Dark Glass — Subtle glass effects, neon accents

Anti-patterns:
✗ Neumorphism — depth effects confuse data reading
✗ Brutalism — incompatible with professional finance
✗ Pastel colors — poor for real-time data scanning
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [Color Palette Generator](./color_palette_generator.skill.md)
- [Typography Pairing](./typography_pairing.skill.md)
- [Design System Generator](./design_system_generator.skill.md)
- [Dark/Light Mode Audit](./dark_light_mode_audit.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain | Adapted from UI UX Pro Max (MIT)*
