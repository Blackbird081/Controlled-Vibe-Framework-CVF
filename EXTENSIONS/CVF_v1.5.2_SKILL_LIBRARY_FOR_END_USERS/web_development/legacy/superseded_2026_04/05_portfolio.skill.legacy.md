# Portfolio

> **Domain:** Web Development  
> **Difficulty:** ⭐ Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07
> **Source:** Vibecode Kit v4.0

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Portfolio cá nhân (developer, designer, writer...)
- Agency/Studio showcase
- Freelancer website
- Personal brand

**Không phù hợp khi:**
- Bán sản phẩm → Dùng Landing Page
- Blog/viết bài → Dùng Blog/Docs
- App phức tạp → Dùng SaaS App

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Design, Build |
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

- UAT Record: [05_portfolio](../../../governance/skill-library/uat/results/UAT-05_portfolio.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Nghề nghiệp** | Bạn làm gì? | ✅ | "UX Designer với 5 năm kinh nghiệm" |
| **Style ưa thích** | Minimal, Bold, hay Editorial? | ✅ | "Minimal - clean và professional" |
| **Projects** | Số lượng projects showcase | ✅ | "5 case studies chi tiết" |
| **Services** | Có offer services không? | ❌ | "UI Design, UX Research, Prototyping" |
| **Contact** | Form contact hay chỉ info? | ❌ | "Contact form + email + LinkedIn" |
| **Tham khảo** | Portfolio mẫu yêu thích? | ❌ | "brittanychiang.com" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- Portfolio website responsive
- Hero với tagline ấn tượng
- Projects showcase
- About section
- Contact options
- Animations phù hợp style

**Style Options:**

### Option A: MINIMAL (Developers, Writers)
```
┌────────────────────────────────────────┐
│ Clean, whitespace-heavy                │
│ Typography-driven                      │
│ Subtle animations                      │
│ Content-focused                        │
│ → Best for: Devs, Writers, Researchers │
└────────────────────────────────────────┘
```

### Option B: BOLD (Designers, Creatives)
```
┌────────────────────────────────────────┐
│ Strong visual impact                   │
│ Large imagery                          │
│ Creative layouts                       │
│ Expressive animations                  │
│ → Best for: Designers, Artists, Brands │
└────────────────────────────────────────┘
```

### Option C: EDITORIAL (Agencies, Studios)
```
┌────────────────────────────────────────┐
│ Magazine-style                         │
│ Case study focused                     │
│ Professional tone                      │
│ Balanced text/image                    │
│ → Best for: Agencies, Consultants      │
└────────────────────────────────────────┘
```

**Sections tiêu chuẩn:**
```
┌─────────────────────────────────────┐
│ 1. Hero (name + tagline + CTA)     │
├─────────────────────────────────────┤
│ 2. About (story + skills)          │
├─────────────────────────────────────┤
│ 3. Work (3-6 featured projects)    │
├─────────────────────────────────────┤
│ 4. Project detail pages            │
├─────────────────────────────────────┤
│ 5. Services (optional)             │
├─────────────────────────────────────┤
│ 6. Contact                         │
└─────────────────────────────────────┘
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Hero gây ấn tượng (3 giây đầu)
- [ ] Projects có case study chi tiết
- [ ] Style phù hợp nghề nghiệp
- [ ] Contact rõ ràng, dễ tìm
- [ ] Animations smooth, không quá nhiều
- [ ] Mobile responsive

**Red flags (cần Reject):**
- ⚠️ Hero không gây ấn tượng
- ⚠️ Projects chỉ có hình, không có context
- ⚠️ Style không match nghề
- ⚠️ Không có CTA rõ ràng
- ⚠️ Animations quá nhiều, gây khó chịu

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Hero nhạt nhẽo | Tagline mạnh + visual ấn tượng |
| Projects không có story | Case study: Problem → Solution → Result |
| Style không phù hợp | Match style với nghề nghiệp |
| Animation quá nhiều | 2-3 subtle animations là đủ |
| Contact khó tìm | CTA ở hero + footer + floating |

---

## 💡 Tips

1. **3 giây đầu quyết định** — Hero phải WOW
2. **Case study > Screenshots** — Show process, không chỉ result
3. **Style = Identity** — Minimal cho devs, Bold cho designers
4. **Less is more** — 5 projects tốt > 20 projects random
5. **CTA everywhere** — "Let's work together" phải dễ tìm

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Nghề nghiệp: UX Designer, 5 năm kinh nghiệm
Style: Minimal - clean, professional
Projects: 5 case studies chi tiết
Services: UI Design, UX Research, Prototyping
Contact: Form + email + LinkedIn
Tham khảo: brittanychiang.com, leerob.io
```

### Output mẫu:
```
Portfolio với:
- Hero: "I design experiences that people love."
- About: Story + Skills (Figma, Research, Design Systems)
- Work: 5 case studies với Problem/Solution/Result
- Each project: Hero + Challenge + Process + Results
- Services: 3 cards với pricing hint
- Contact: Form + email + social links
- Style: Minimal, whitespace, subtle hover animations
- Dark mode toggle
```

### Đánh giá:
- ✅ Hero: Strong tagline + professional
- ✅ Case studies: Chi tiết, có process
- ✅ Style: Minimal phù hợp designer
- ✅ Contact: Multiple options
- ✅ Animations: Subtle, không quá
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills
- [Blog / Documentation](./04_blog_docs.skill.md)
- [Landing Page](./01_landing_page.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Portfolio**, quay lại vòng web core:
→ [Landing Page](./01_landing_page.skill.md)

---

*CVF Skill Library v1.5.2 | Web Development Domain*