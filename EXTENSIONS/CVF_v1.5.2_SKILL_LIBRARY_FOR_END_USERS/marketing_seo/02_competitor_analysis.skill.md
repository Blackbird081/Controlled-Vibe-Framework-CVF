# Competitor Analysis

> **Domain:** Marketing & SEO  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/competitive-landscape

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Phân tích đối thủ cạnh tranh một cách toàn diện để tìm ra điểm mạnh, điểm yếu, và cơ hội differentiation.

**Khi nào nên dùng:**

- Lập chiến lược marketing mới
- Launch sản phẩm mới vào thị trường
- Mất market share cho đối thủ
- Annual strategic planning

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

- UAT Record: [competitor_analysis](../../../governance/skill-library/uat/results/UAT-competitor_analysis.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Công ty của bạn** | ✅ | Tên và mô tả ngắn |
| **Ngành/Industry** | ✅ | E-commerce, SaaS, F&B, etc. |
| **Top 3-5 Đối thủ** | ✅ | Tên và website |
| **Tiêu chí so sánh** | ❌ | Pricing, Features, Marketing, etc. |
| **Mục tiêu phân tích** | ❌ | Find gaps, Differentiate, etc. |

---

## ✅ Checklist Đánh giá (cho mỗi đối thủ)

### Product/Service

- [ ] Họ offer gì? Core features?
- [ ] Pricing structure như thế nào?
- [ ] Unique Selling Points là gì?
- [ ] Có gì họ làm tốt hơn bạn?
- [ ] Có gì họ làm kém hơn bạn?

### Market Position

- [ ] Họ target segment nào?
- [ ] Positioning: Budget / Mid / Premium?
- [ ] Estimated market share?
- [ ] Brand perception như thế nào?

### Marketing Strategy

- [ ] Channels họ sử dụng? (SEO, Ads, Social, etc.)
- [ ] Content strategy? (Blog, Video, Podcast)
- [ ] Messaging và tone of voice?
- [ ] Estimated marketing budget?

### Digital Presence

- [ ] Website traffic (SimilarWeb estimate)?
- [ ] SEO rankings cho key terms?
- [ ] Social media followers và engagement?
- [ ] Review scores (G2, Capterra, Google)?

### Customer Experience

- [ ] Onboarding process?
- [ ] Customer support options?
- [ ] User reviews nói gì?
- [ ] Churn rate hoặc satisfaction signals?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **Copy competitors** | No differentiation | Find unique angle |
| **Ignore small competitors** | Disruption risk | Monitor emerging players |
| **Focus only on features** | Miss the big picture | Analyze full experience |
| **Outdated analysis** | Wrong decisions | Refresh quarterly |
| **Bias in assessment** | Inaccurate insights | Use objective data |
| **Too many competitors** | Analysis paralysis | Focus on top 3-5 |

---

## 💡 Tips & Examples

### Competitive Analysis Framework

```
+------------------+--------+----------+----------+
| Criteria         | You    | Comp A   | Comp B   |
+------------------+--------+----------+----------+
| Pricing          | $$     | $$$      | $        |
| Feature: X       | ✅     | ✅       | ❌       |
| Feature: Y       | ❌     | ✅       | ✅       |
| Customer Support | 24/7   | Business | Email    |
| Ease of Use      | 4.5/5  | 3.8/5    | 4.2/5    |
+------------------+--------+----------+----------+
```

### Free Tools for Competitor Research

| Tool | What it shows |
|------|---------------|
| **SimilarWeb** | Traffic estimates, sources |
| **SEMrush/Ahrefs (free tier)** | Keywords, backlinks |
| **BuiltWith** | Tech stack |
| **Facebook Ad Library** | Their ads |
| **Wayback Machine** | Historical changes |
| **G2/Capterra** | User reviews |

### SWOT Template (per competitor)

```
STRENGTHS                    WEAKNESSES
- Strong brand               - High prices
- Feature X                  - Slow support
- Market leader              - Outdated UI

OPPORTUNITIES               THREATS
- They ignore segment Y     - Growing fast
- Weak in mobile            - Strong funding
- Bad reviews on Z          - Acquiring companies
```

### Finding Your Blue Ocean

1. List what competitors compete on
2. Find what they ALL ignore
3. That's your differentiation opportunity

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Competitor Overview** - Summary mỗi đối thủ
2. **Comparison Matrix** - Side-by-side comparison
3. **SWOT Analysis** - Per competitor
4. **Market Positioning Map** - Visual positioning
5. **Gap Analysis** - Opportunities they miss
6. **Differentiation Strategy** - How to stand out
7. **Action Items** - Specific recommendations

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Sản phẩm: StockFlow (SaaS quản lý tồn kho cho chuỗi cửa hàng)
Thị trường: VN/SEA, SMB retail
Đối thủ chính: KiotViet, Sapo, Odoo
Kênh tăng trưởng: SEO + Facebook Ads
Mục tiêu: Xác định điểm khác biệt trong 90 ngày
```

### Output mẫu

```markdown
# Competitor Snapshot

| Competitor | Giá/Tháng | Điểm mạnh | Điểm yếu |
|---|---|---|---|
| KiotViet | $25-80 | POS + kho phổ biến | Offline yếu, báo cáo kho chậm |
| Sapo | $20-70 | Nhiều template ngành | Quy trình kho phức tạp |
| Odoo | $30-120 | Mạnh ERP | Setup nặng, cần kỹ thuật |

## Gaps & Opportunities
- Offline-first cho kho lớn chưa được nhấn mạnh
- Quy trình nhập/xuất barcode dưới 15s
- Onboarding < 30 phút cho nhân viên kho

## Positioning Draft
“StockFlow giúp quản lý kho đa chi nhánh offline-first, đồng bộ nhanh khi có mạng.”

## Next Actions (30 ngày)
1. Làm landing page so sánh tính năng
2. Tạo case study kho 2 chi nhánh
3. Viết bài SEO “phần mềm quản lý kho offline”
```

### Đánh giá

- ✅ So sánh rõ ràng, có khoảng trống thị trường
- ✅ Positioning có khác biệt
- ✅ Hành động cụ thể theo thời gian
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Brand Voice Consistency](./brand_voice_consistency.skill.md)
- [Pricing Strategy Review](./pricing_strategy_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Competitor Analysis**, tiếp tục với:
→ [Brand Voice Consistency](./brand_voice_consistency.skill.md)

---

*CVF Skill Library v1.5.2 | Marketing & SEO Domain*
