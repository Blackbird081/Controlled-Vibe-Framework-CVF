# Social Media Ad Review

> **Domain:** Marketing & SEO  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/social-ads

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá và tối ưu social media ads (Facebook, Instagram, TikTok, LinkedIn) để improve CTR, decrease CPC, và increase ROAS.

**Khi nào nên dùng:**
- Trước khi launch ad campaign
- Ads có ROAS thấp
- CTR dưới benchmark
- A/B testing cần variations

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

- UAT Record: [social_media_ad_review](../../../governance/skill-library/uat/results/UAT-social_media_ad_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Ad Creative** | ✅ | Image/Video description hoặc link |
| **Ad Copy** | ✅ | Headline + Primary text + CTA |
| **Platform** | ✅ | Facebook, Instagram, TikTok, LinkedIn |
| **Campaign Objective** | ✅ | Traffic, Conversions, Leads, Awareness |
| **Target Audience** | ✅ | Demographics, interests, behaviors |
| **Landing Page URL** | ❌ | Where ad leads to |
| **Current Performance** | ❌ | CTR, CPC, ROAS nếu có |

---

## ✅ Checklist Đánh giá

### Creative/Visual
- [ ] Thumb-stopping visual (scroll stop)?
- [ ] Faces hoặc people in image?
- [ ] Contrast và colors nổi bật?
- [ ] Brand elements present but not overwhelming?
- [ ] Video: Hook trong 3 giây đầu?
- [ ] Correct aspect ratio (1:1, 4:5, 9:16)?
- [ ] Text overlay < 20% image?

### Ad Copy - Primary Text
- [ ] Hook ngay câu đầu tiên?
- [ ] Benefits > Features?
- [ ] Social proof hoặc numbers?
- [ ] Urgency hoặc scarcity (if genuine)?
- [ ] Không quá dài (3-5 lines visible)?

### Headline
- [ ] Clear value proposition?
- [ ] Action-oriented?
- [ ] Under 40 characters (no truncation)?
- [ ] Matches ad creative?

### Call to Action
- [ ] CTA button phù hợp (Learn More, Shop Now, Sign Up)?
- [ ] CTA matches campaign objective?
- [ ] Creates clear expectation?

### Landing Page Alignment
- [ ] Ad promise = Landing page reality?
- [ ] Visual consistency?
- [ ] Same offer/CTA?
- [ ] Fast load time?

### Platform-Specific
- [ ] **Facebook/IG:** Carousel if multiple products?
- [ ] **TikTok:** Native/authentic style?
- [ ] **LinkedIn:** Professional tone?
- [ ] **Stories:** Full vertical 9:16?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **Weak hook** | Scroll past | Bold visual + curiosity |
| **Feature-focused** | Low relevance | Lead with benefits |
| **Generic stock photos** | Low trust | Use real photos/UGC |
| **No social proof** | Low credibility | Add reviews, numbers |
| **Mismatch landing page** | High bounce | Align ad & LP |
| **Too much text** | Policy rejection | < 20% text on image |
| **Wrong CTA button** | Low conversion | Match to objective |
| **No urgency** | Delayed action | Add limited-time offers |

---

## 💡 Tips & Examples

### Ad Benchmarks by Platform:
| Platform | Avg CTR | Avg CPC |
|----------|---------|---------|
| Facebook | 0.9-1.5% | $0.50-2.00 |
| Instagram | 0.5-1.0% | $0.50-3.00 |
| LinkedIn | 0.4-0.6% | $2.00-7.00 |
| TikTok | 1.0-3.0% | $0.20-1.00 |

### High-Converting Ad Formula:
```
[HOOK] → [PROBLEM] → [SOLUTION] → [PROOF] → [CTA]

"Tired of wasting money on ads that don't convert?
Most businesses lose 70% of ad budget on wrong targeting.
With [Product], we helped 500+ brands cut CPC by 40%.
Start your free trial today 👇"
```

### Creative Best Practices:
```
✅ User-generated content (UGC) outperforms polished ads
✅ Video ads: 15-30 seconds optimal
✅ Faces increase engagement 38%
✅ Bright colors on dark backgrounds
✅ Before/after comparisons work well
```

### Facebook Ad Copy Template:
```
📌 HEADLINE: [Benefit in 5 words]

PRIMARY TEXT:
[Hook - Problem they have]
[Agitate - Why it matters]
[Solution - What you offer]
[Proof - Social proof/numbers]
[CTA - What to do next]

💡 DESCRIPTION: [Short benefit + urgency]
```

### TikTok-Style Ads:
- Look native, not like ads
- Vertical 9:16 only
- Hook in first 1-2 seconds
- Text overlays throughout
- Trending sounds help
- UGC/creator content

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Ad Score** - Overall effectiveness (/10)
2. **Creative Analysis** - Visual assessment
3. **Copy Review** - Hook, benefits, CTA
4. **Platform Optimization** - Platform-specific tips
5. **Predicted Performance** - CTR/CPC estimates
6. **A/B Test Ideas** - Variations to test
7. **Rewritten Ad** - Optimized version

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Platform: Facebook
3 creatives, CTR 0.6%, CPC $1.2, CPA $28
Audience: chủ shop bán lẻ, 25-45
Offer: "Dùng thử miễn phí"
```

### Output mẫu:
```markdown
# Ad Review

## Issues
- Hook chung chung, thiếu pain point
- Creative không có kho/barcode
- CTA giống nhau giữa các ad

## New Hook Ideas
1. "Sai số kho 5%? Kiểm lại trong 30s"
2. "Mất mạng vẫn nhập hàng được"

## Creative Brief
- Video 15s: scan barcode → tồn kho cập nhật
- Caption nhấn offline + đồng bộ
```

### Đánh giá:
- ✅ Chỉ ra vấn đề cụ thể
- ✅ Có hook mới để test
- ✅ Brief rõ ràng cho designer
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Content Quality Checklist](./content_quality_checklist.skill.md)
- [Email Campaign Review](./email_campaign_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Social Media Ad Review**, tiếp tục với:
→ [Email Campaign Review](./email_campaign_review.skill.md)

---

*CVF Skill Library v1.5.2 | Marketing & SEO Domain*