# SEO Audit

> **Domain:** Marketing & SEO  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/seo-fundamentals

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá website về các yếu tố SEO cơ bản, phát hiện vấn đề và đề xuất cải thiện để tăng khả năng hiển thị trên search engines.

**Khi nào nên dùng:**
- Trước khi launch website mới
- Website có traffic giảm đột ngột
- Kiểm tra định kỳ hàng quý
- So sánh với đối thủ cạnh tranh

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

- UAT Record: [seo_audit](../../../governance/skill-library/uat/results/UAT-seo_audit.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **URL Website** | ✅ | Link trang cần audit |
| **Ngành/Lĩnh vực** | ✅ | VD: E-commerce, SaaS, Blog |
| **Target Keywords** | ❌ | Từ khóa chính đang target |
| **Đối thủ chính** | ❌ | 2-3 website đối thủ |
| **Mục tiêu SEO** | ❌ | Tăng traffic, rankings, conversions |

---

## ✅ Checklist Đánh giá

### Technical SEO
- [ ] Website có SSL certificate (HTTPS)?
- [ ] Sitemap.xml có tồn tại và đúng format?
- [ ] Robots.txt được cấu hình đúng?
- [ ] Tốc độ load dưới 3 giây (Core Web Vitals)?
- [ ] Mobile-friendly / Responsive?
- [ ] Không có broken links (404)?
- [ ] URL structure có clean và descriptive?

### On-Page SEO
- [ ] Mỗi page có unique title tag (50-60 ký tự)?
- [ ] Meta description có compelling (150-160 ký tự)?
- [ ] Chỉ có 1 H1 tag per page?
- [ ] Heading hierarchy (H1 > H2 > H3) đúng?
- [ ] Alt text cho tất cả images?
- [ ] Internal linking có strategy?
- [ ] Content có keyword optimization phù hợp?

### Content Quality (E-E-A-T)
- [ ] Content có thể hiện Experience (kinh nghiệm)?
- [ ] Content có thể hiện Expertise (chuyên môn)?
- [ ] Content có thể hiện Authoritativeness (uy tín)?
- [ ] Content có thể hiện Trustworthiness (đáng tin)?
- [ ] Có author bio và credentials?

### Off-Page SEO
- [ ] Có backlinks từ sites uy tín?
- [ ] Google Business Profile (nếu local business)?
- [ ] Social signals có presence?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Mức độ | Hậu quả |
|-----|--------|---------|
| **Duplicate title tags** | 🔴 Critical | Google không biết page nào ưu tiên |
| **Missing meta description** | 🟡 Medium | Click-through rate thấp |
| **No SSL (HTTP only)** | 🔴 Critical | Browser warning, ranking penalty |
| **Slow page speed** | 🔴 Critical | High bounce rate, poor UX |
| **Thin content** | 🟡 Medium | Không rank được cho keywords |
| **Keyword stuffing** | 🔴 Critical | Spam penalty từ Google |
| **No mobile version** | 🔴 Critical | Mobile-first indexing không hoạt động |

---

## 💡 Tips & Examples

### Công cụ miễn phí để kiểm tra:
- **Google PageSpeed Insights**: Tốc độ và Core Web Vitals
- **Google Search Console**: Lỗi indexing và keywords
- **Screaming Frog (free)**: Crawl technical issues
- **GTmetrix**: Performance analysis

### Ví dụ Title Tag tốt:
```
❌ "Trang chủ"
✅ "Mua Giày Thể Thao Nike Chính Hãng | Free Ship | ShopXYZ"
```

### Ví dụ Meta Description tốt:
```
❌ "Chúng tôi bán giày"
✅ "Khám phá 500+ mẫu giày Nike, Adidas chính hãng. Giá tốt nhất, 
   Free ship toàn quốc, Đổi trả 30 ngày. Mua ngay!"
```

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI (ChatGPT/Claude/Gemini), bạn sẽ nhận được:

1. **Technical SEO Report** - Đánh giá các yếu tố kỹ thuật
2. **On-Page Analysis** - Review từng page chính
3. **Content Quality Score** - Điểm E-E-A-T
4. **Priority Issues** - Vấn đề cần fix ngay
5. **Action Plan** - Các bước cải thiện cụ thể

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
URL: https://stockflow.vn
Target keywords: "phần mềm quản lý kho", "barcode inventory"
GSC CTR: 1.2%, Avg pos: 11
CWV: LCP 4.2s, CLS 0.18
```

### Output mẫu:
```markdown
# SEO Audit Summary

## P0 Fixes (2 tuần)
- Nén ảnh hero, preload font
- Thêm sitemap.xml + robots.txt chuẩn
- Sửa 12 title trùng lặp

## P1 Fixes (1 tháng)
- Schema: Product, FAQ
- Internal links cho 10 bài blog chính
- Tạo landing "quản lý kho offline"

Expected impact: +20-30% CTR
```

### Đánh giá:
- ✅ Ưu tiên rõ P0/P1
- ✅ Hành động cụ thể, khả thi
- ✅ Kỳ vọng impact hợp lý
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Landing Page CRO](./landing_page_cro.skill.md)
- [Content Quality Checklist](./content_quality_checklist.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **SEO Audit**, tiếp tục với:
→ [Content Quality Checklist](./content_quality_checklist.skill.md)

---

*CVF Skill Library v1.5.2 | Marketing & SEO Domain*