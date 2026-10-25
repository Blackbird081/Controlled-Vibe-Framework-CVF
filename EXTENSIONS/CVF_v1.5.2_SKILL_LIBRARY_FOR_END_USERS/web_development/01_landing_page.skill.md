# Landing Page

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

- Giới thiệu sản phẩm/dịch vụ
- Thu leads (email, số điện thoại)
- Bán hàng online (khóa học, ebook, SaaS...)
- Ra mắt sản phẩm mới

**Không phù hợp khi:**

- Cần nhiều trang phức tạp → Dùng SaaS App
- Cần admin panel → Dùng Dashboard
- Chỉ cần blog → Dùng Blog/Docs

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

- UAT Record: [01_landing_page](../../../governance/skill-library/uat/results/UAT-01_landing_page.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Sản phẩm** | Bạn bán/giới thiệu gì? | ✅ | "Khóa học Excel cho dân văn phòng" |
| **Mục tiêu** | Visitor làm gì sau khi xem? | ✅ | "Đăng ký học thử miễn phí" |
| **Đối tượng** | Ai là khách hàng? | ✅ | "Nhân viên văn phòng 25-35 tuổi, muốn tăng lương" |
| **Brand** | Đã có màu/logo chưa? | ❌ | "Chưa có, nhờ đề xuất. Tone: friendly" |
| **Tham khảo** | Website mẫu yêu thích? | ❌ | "<https://example.com> - thích style này" |
| **Đặc biệt** | Có gì khác biệt? | ❌ | "Thêm section Before/After học viên" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

- Landing page hoàn chỉnh, responsive
- Copy/content phù hợp đối tượng
- CTA rõ ràng, hướng tới mục tiêu
- Style phù hợp brand (hoặc đề xuất mới)

**Cấu trúc tiêu chuẩn:**

```
┌─────────────────────────────────────┐
│ 1. Hero (Headline + CTA)           │
├─────────────────────────────────────┤
│ 2. Social Proof (logos/stats)      │
├─────────────────────────────────────┤
│ 3. Problem → Solution              │
├─────────────────────────────────────┤
│ 4. Features/Benefits (3-4 items)   │
├─────────────────────────────────────┤
│ 5. How It Works (3 steps)          │
├─────────────────────────────────────┤
│ 6. Testimonials (3 reviews)        │
├─────────────────────────────────────┤
│ 7. Pricing + CTA                   │
├─────────────────────────────────────┤
│ 8. FAQ (5-7 questions)             │
├─────────────────────────────────────┤
│ 9. Final CTA + Footer              │
└─────────────────────────────────────┘
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Headline rõ ràng, dưới 12 từ
- [ ] CTA xuất hiện ít nhất 2 lần
- [ ] Phù hợp đối tượng mục tiêu
- [ ] Responsive (mobile đẹp)
- [ ] Có đủ social proof
- [ ] FAQ giải đáp được thắc mắc chính

**Red flags (cần Reject):**

- ⚠️ CTA không rõ ràng hoặc không có
- ⚠️ Quá nhiều text, không có visual
- ⚠️ Không responsive
- ⚠️ Copy không phù hợp đối tượng

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Headline quá dài/mơ hồ | Giới hạn 8-12 từ, focus benefit |
| Thiếu social proof | Yêu cầu thêm logos/testimonials |
| CTA không nổi bật | Kiểm tra màu contrast, vị trí |
| Quên mobile view | Yêu cầu kiểm tra responsive |
| Copy quá formal/stiff | Nêu rõ tone mong muốn trong input |

---

## 💡 Tips

1. **Headline quyết định 80%** — Dành thời gian refine headline
2. **Social proof tạo trust** — Có logo, stats, testimonials
3. **CTA = Action + Value** — "Bắt đầu miễn phí" tốt hơn "Đăng ký"
4. **Mobile first** — 60%+ traffic từ mobile
5. **FAQ = SEO + Trust** — Trả lời những câu hỏi khách hay hỏi

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Sản phẩm: Khóa học Excel Mastery - từ zero đến hero trong 30 ngày
Mục tiêu: Đăng ký học thử miễn phí (3 bài đầu)
Đối tượng: Nhân viên văn phòng 25-35 tuổi, muốn tăng lương/thăng tiến
Brand: Chưa có. Tone friendly, không quá formal
Đặc biệt: Thêm section "Before/After" - kết quả học viên thực tế
```

### Output mẫu

```
Landing page với:
- Hero: "Thành thạo Excel trong 30 ngày — Tự tin xử lý mọi báo cáo"
- Social proof: 5000+ học viên, rating 4.9/5
- Before/After section (như yêu cầu)
- 3 testimonials từ học viên văn phòng
- CTA: "Học thử 3 bài miễn phí"
- FAQ: 7 câu hỏi về khóa học
```

### Đánh giá

- ✅ Headline: 9 từ, rõ benefit
- ✅ CTA: xuất hiện 3 lần
- ✅ Có Before/After section
- ✅ Responsive OK
- **Kết quả: ACCEPT**

---

## 📚 Tham khảo thêm

- [Vibecode Landing Page Pattern](../../vibecode-kit/Templates/LANDING-PAGE-v4.txt)
- [CVF Template: Strategy Analysis](../business_analysis/)

---

---

## 🔗 Related Skills

- [SaaS App](./02_saas_app.skill.md)
- [Portfolio](./05_portfolio.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Landing Page**, tiếp tục với:
→ [SaaS App](./02_saas_app.skill.md)

---

*CVF Skill Library v1.5.2 | Web Development Domain*
