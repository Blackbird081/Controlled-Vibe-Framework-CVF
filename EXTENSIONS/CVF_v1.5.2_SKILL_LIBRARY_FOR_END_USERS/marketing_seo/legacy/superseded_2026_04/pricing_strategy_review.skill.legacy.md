# Pricing Strategy Review

> **Domain:** Marketing & SEO  
> **Difficulty:** Advanced  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/pricing-strategy

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Đánh giá chiến lược giá (pricing) của sản phẩm/dịch vụ và đề xuất tối ưu để tăng revenue và customer value.

**Khi nào nên dùng:**

- Launch sản phẩm mới, cần set price
- Revenue không đạt target
- Cạnh tranh về giá với đối thủ
- Xem xét thay đổi pricing model

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

- UAT Record: [pricing_strategy_review](../../../governance/skill-library/uat/results/UAT-pricing_strategy_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Sản phẩm/Dịch vụ** | ✅ | Mô tả offering |
| **Giá hiện tại** | ✅ | Pricing structure hiện tại |
| **Pricing Model** | ✅ | One-time, Subscription, Tiered, Freemium |
| **Target Customer** | ✅ | B2B, B2C, Enterprise, SMB |
| **Chi phí (COGS)** | ❌ | Cost để deliver sản phẩm |
| **Giá đối thủ** | ❌ | Pricing của competitors |
| **Mục tiêu** | ❌ | Maximize revenue, market share, LTV |

---

## ✅ Checklist Đánh giá

### Value-Based Pricing

- [ ] Giá phản ánh VALUE customer nhận được?
- [ ] Có quantify được ROI cho customer?
- [ ] Giá phù hợp với customer segment?
- [ ] Có premium option cho high-value customers?

### Competitive Positioning

- [ ] Biết rõ giá của top 3 đối thủ?
- [ ] Có differentiation rõ ràng justify giá?
- [ ] Positioned đúng (budget / mid-market / premium)?
- [ ] Không bị "race to bottom"?

### Pricing Structure

- [ ] Pricing tiers có logic và clear?
- [ ] Feature differentiation giữa tiers có sense?
- [ ] Có "decoy" tier để guide choice?
- [ ] Billing frequency options phù hợp?

### Psychology & Presentation

- [ ] Có sử dụng charm pricing ($99 vs $100)?
- [ ] Có anchor pricing (show crossed price)?
- [ ] Best value tier có được highlight?
- [ ] Pricing page có clear và scannable?

### Monetization Optimization

- [ ] Có upsell/cross-sell opportunities?
- [ ] Có annual discount để improve cash flow?
- [ ] Free trial/freemium có convert được?
- [ ] Có room cho price increase?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **Cost-plus pricing** | Undervalue | Switch to value-based |
| **Too many tiers** | Decision paralysis | Max 3-4 tiers |
| **No clear "best value"** | Random choice | Highlight recommended |
| **Underpricing** | Low perceived value | Test price increase |
| **Hidden fees** | Trust damage | Transparent all-in pricing |
| **Complex pricing** | Confusion | Simplify, show monthly |
| **No free trial** | Low conversions | Add risk-free trial |

---

## 💡 Tips & Examples

### Pricing Models

| Model | Best For | Example |
|-------|----------|---------|
| **Flat-rate** | Simple products | Netflix $15.99/mo |
| **Per-user** | Collaboration tools | Slack $8.75/user/mo |
| **Usage-based** | Variable consumption | AWS pay-per-use |
| **Tiered** | Feature upsell | Starter/Pro/Enterprise |
| **Freemium** | Volume + conversion | Spotify Free → Premium |

### SaaS Pricing Page Best Practices

```
✅ Show monthly price (easier to compare)
✅ Highlight "Most Popular" tier
✅ Annual discount 15-20%
✅ Feature comparison table
✅ FAQs about pricing
✅ Money-back guarantee
```

### Pricing Psychology

- **Charm pricing:** $99 > $100 (Left digit effect)
- **Anchoring:** Show premium first
- **Decoy effect:** Add tier that makes target tier look better
- **Price-quality:** Higher price = higher perceived quality

### Quick Pricing Formula (SaaS)

```
Price = (Customer Value / 10) 
        OR 
        (Competitor Price × Your Differentiation Factor)
```

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Pricing Assessment** - Đánh giá strategy hiện tại
2. **Value Analysis** - Customer value vs price
3. **Competitive Position** - So với market
4. **Optimization Opportunities** - Cơ hội tăng revenue
5. **Recommended Pricing Structure** - Proposed tiers & prices
6. **Implementation Plan** - Cách roll out changes

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Current plans:
- Basic $29 (1 user, 1 kho)
- Pro $79 (5 users, 3 kho)
- Enterprise custom
ARPU $45, churn 6%/mo
Competitors: KiotViet $25-80, Sapo $20-70
```

### Output mẫu

```markdown
# Pricing Recommendation

## Issues
- Gap giữa Basic và Pro quá lớn
- Thiếu add-on theo kho

## New Tiers
- Starter $25 (1 user, 1 kho)
- Growth $49 (5 users, 3 kho)
- Scale $99 (10 users, 10 kho)
Add-on: $8/kho thêm

## Experiments
- Test annual -15%
- Test trial 14 ngày vs 7 ngày
```

### Đánh giá

- ✅ Tiers logic theo quy mô
- ✅ Có add-on linh hoạt
- ✅ Có kế hoạch thử nghiệm
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Landing Page CRO](./landing_page_cro.skill.md)
- [SEO Audit](./seo_audit.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Pricing Strategy Review**, tiếp tục với:
→ [SEO Audit](./seo_audit.skill.md)

---

*CVF Skill Library v1.5.2 | Marketing & SEO Domain*
