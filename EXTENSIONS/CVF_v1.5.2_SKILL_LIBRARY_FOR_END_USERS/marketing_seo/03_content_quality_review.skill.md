# Content Quality Checklist

> **Domain:** Marketing & SEO  
> **Difficulty:** Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/seo-content-auditor

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá chất lượng content (blog, article, webpage) về mặt SEO, engagement, và value để user. Đảm bảo content worthy of ranking và sharing.

**Khi nào nên dùng:**
- Trước khi publish content mới
- Audit content cũ để improve
- Content không rank hoặc traffic thấp
- Training content writers

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

- UAT Record: [content_quality_checklist](../../../governance/skill-library/uat/results/UAT-content_quality_checklist.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Content URL/Text** | ✅ | Link hoặc paste nội dung |
| **Content Type** | ✅ | Blog, Guide, Landing page, Product page |
| **Target Keyword** | ✅ | Từ khóa chính muốn rank |
| **Target Audience** | ✅ | Đối tượng đọc content |
| **Content Goal** | ❌ | Traffic, Leads, Sales, Education |
| **Competitor Content** | ❌ | Link content đối thủ cùng topic |

---

## ✅ Checklist Đánh giá

### Headline & Opening
- [ ] Headline có compelling và chứa keyword?
- [ ] Subheadline/Meta có hook được reader?
- [ ] Opening paragraph có engage ngay?
- [ ] Có promise value ngay từ đầu?

### Content Structure
- [ ] Có clear outline (H2, H3 headers)?
- [ ] Sử dụng bullets/numbered lists?
- [ ] Paragraphs ngắn (max 3-4 câu)?
- [ ] Có Table of Contents (nếu long-form)?
- [ ] Có visual breaks (images, quotes)?

### Content Quality
- [ ] Comprehensive - cover topic đầy đủ?
- [ ] Unique insight hoặc data?
- [ ] Up-to-date information?
- [ ] Actionable advice/takeaways?
- [ ] No fluff/filler content?

### E-E-A-T Signals
- [ ] **Experience:** Personal experience / case studies?
- [ ] **Expertise:** Author credentials visible?
- [ ] **Authority:** Citations, data, expert quotes?
- [ ] **Trust:** Accurate, transparent, updated?

### SEO Optimization
- [ ] Primary keyword trong H1, intro, conclusion?
- [ ] Related keywords (LSI) có coverage?
- [ ] Internal links đến related content?
- [ ] External links đến authoritative sources?
- [ ] Images có alt text với keywords?
- [ ] Meta title và description optimized?

### Engagement Elements
- [ ] Có visual content (images, charts, videos)?
- [ ] Có CTAs appropriate cho content stage?
- [ ] Có share buttons?
- [ ] Có comment section hoặc engagement prompt?

### Readability
- [ ] Reading level phù hợp audience?
- [ ] Không có jargon phức tạp?
- [ ] Active voice predominant?
- [ ] Sentences < 20 words?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **Thin content** | No ranking | Expand to 1500+ words for competitive topics |
| **Keyword stuffing** | Penalty | Natural usage, focus on intent |
| **No visuals** | High bounce | Add images every 300-400 words |
| **Wall of text** | Low time-on-page | Break into sections, bullets |
| **Outdated info** | Trust loss | Regular updates, remove old dates |
| **No internal links** | Poor navigation | Link to 3-5 related posts |
| **Weak headline** | Low CTR | Test with headline analyzers |

---

## 💡 Tips & Examples

### Content Length Guidelines:
| Content Type | Recommended Length |
|--------------|-------------------|
| Blog post | 1,500 - 2,500 words |
| Comprehensive guide | 3,000 - 5,000 words |
| Product page | 500 - 1,000 words |
| Landing page | 500 - 2,000 words |
| How-to article | 1,000 - 2,000 words |

### Content Structure Template:
```markdown
# Compelling H1 with Keyword

[Intro: Hook + Promise + Overview]

## H2: First Main Point
[Content with bullet points]

### H3: Subpoint
[Details with examples]

## H2: Second Main Point
...

## H2: Key Takeaways / Conclusion
[Summary + CTA]
```

### Quick Readability Check:
- **Hemingway App**: Check grade level
- **Grammarly**: Grammar + clarity
- **Yoast SEO**: SEO checklist (WordPress)

### Content Freshness Rules:
- Update stats/data yearly
- Add new sections as industry evolves
- Update screenshots if UI changed
- Add "Last updated" date

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Content Score** - Overall quality rating (/10)
2. **SEO Analysis** - Keyword optimization review
3. **Readability Report** - Grade level + suggestions
4. **E-E-A-T Assessment** - Trust signals evaluation
5. **Gap Analysis** - What's missing vs competitors
6. **Improvement Recommendations** - Priority actions

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Bài: "Cách quản lý tồn kho cho cửa hàng tạp hóa"
Word count: 900
Nguồn dữ liệu: chưa có
Tác giả: không có bio
```

### Output mẫu:
```markdown
# Content Quality Review

## Checklist
- E-E-A-T: 2/5 (thiếu tác giả + nguồn)
- Readability: 4/5
- Search intent: 3/5 (thiếu checklist thực hành)

## Actions
- Thêm case study cửa hàng 2 chi nhánh
- Chèn số liệu thất thoát trung bình ngành
- Thêm CTA tải template kiểm kho
Result: Revise before publish
```

### Đánh giá:
- ✅ Chỉ ra điểm yếu E-E-A-T
- ✅ Có hành động cải thiện cụ thể
- ✅ Quyết định rõ (revise)
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [SEO Audit](./seo_audit.skill.md)
- [Social Media Ad Review](./social_media_ad_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Content Quality Checklist**, tiếp tục với:
→ [Social Media Ad Review](./social_media_ad_review.skill.md)

---

*CVF Skill Library v1.5.2 | Marketing & SEO Domain*