# Contract Review

> **Domain:** Legal & Contracts  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-06

---

## 📌 Prerequisites

> Không yêu cầu

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Review hợp đồng từ đối tác/vendor
- Identify key terms và risks
- Chuẩn bị negotiation points
- So sánh với standard terms

**Không phù hợp khi:**
- Cần legal advice chính thức → Hỏi luật sư
- Draft hợp đồng mới → Dùng templates khác
- Disputes/litigation → Cần legal team

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Loại hợp đồng** | Type of contract | ✅ | "Service Agreement" |
| **Nội dung hợp đồng** | Full text hoặc key sections | ✅ | "[Paste contract text]" |
| **Vai trò của bạn** | Bên nào trong hợp đồng | ✅ | "Bên mua dịch vụ" |
| **Mục đích chính** | Bạn muốn focus vào gì | ✅ | "Identify risks, negotiation points" |
| **Industry context** | Ngành nghề | ❌ | "SaaS, B2B" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- Summary of key terms
- Risk analysis
- Negotiation points
- Recommended modifications

**Cấu trúc output:**
```
CONTRACT REVIEW

1. Contract Summary
2. Key Terms Analysis
   - Payment terms
   - Duration/Termination
   - Liability/Indemnification
   - IP/Confidentiality
3. Risk Assessment (High/Medium/Low)
4. Recommended Changes
5. Questions for Counterparty
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Identify đúng các key terms
- [ ] Risk assessment hợp lý
- [ ] Recommendations cụ thể
- [ ] Xét đến context của bạn (buyer/seller)
- [ ] Highlight clauses bất thường
- [ ] Language dễ hiểu (không quá legal jargon)

**Red flags (cần Reject):**
- ⚠️ Miss major risk clauses
- ⚠️ Provide legal advice definitively
- ⚠️ Không xét đến vai trò của bạn
- ⚠️ Quá general, không specific

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Miss hidden clauses | Review toàn bộ contract |
| Overestimate/underestimate risks | Get second opinion |
| Focus sai priorities | Clarify mục đích upfront |
| Too legalistic | Request plain language |

---

## 💡 Tips

1. **Read everything** — Hidden terms thường ở appendix
2. **Compare với standard** — Industry benchmarks
3. **Focus on exit** — Termination clauses quan trọng
4. **Ask "what if"** — Failure scenarios
5. **Always get lawyer review** — AI là starting point

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Loại hợp đồng: SaaS Service Agreement
Nội dung: 
  "Agreement for 12 months, auto-renew...
   Payment: Annual upfront...
   Termination: 90-day notice required...
   Liability: Limited to fees paid...
   Data: Provider may use aggregated data..."
Vai trò: Buyer (khách hàng)
Mục đích: Identify risks trước khi ký
```

### Output mẫu:
```
CONTRACT REVIEW: SAAS SERVICE AGREEMENT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. CONTRACT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12-month SaaS subscription, auto-renewing
Annual payment upfront
Standard enterprise terms with some concerns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. KEY TERMS ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Payment Terms:
• Annual upfront payment
• No refunds mentioned
⚠️ Risk: Locked in full year even if service poor

Term & Termination:
• 12-month initial term
• Auto-renewal 🔴
• 90-day notice to cancel
⚠️ Risk: Miss window = another year commitment

Liability:
• Capped at "fees paid"
• No consequential damages
⚡ Standard for SaaS, acceptable

Data Usage:
• Provider can use "aggregated data"
🔴 Risk: Vague definition, could include your data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. RISK ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────┬──────────┬───────────────┐
│ Issue              │ Severity │ Likelihood    │
├────────────────────┼──────────┼───────────────┤
│ Auto-renewal trap  │ HIGH     │ Medium        │
│ No refund policy   │ MEDIUM   │ Low           │
│ Data usage vague   │ HIGH     │ High          │
│ 90-day notice      │ MEDIUM   │ Medium        │
└────────────────────┴──────────┴───────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. RECOMMENDED CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Auto-renewal: Request 30-day notice instead of 90
2. Refund: Add pro-rata refund if terminated for cause
3. Data: Clarify "aggregated" = anonymized, no PII
4. Add: Right to terminate if SLA not met

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. QUESTIONS FOR COUNTERPARTY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• What exactly is included in "aggregated data"?
• Can we negotiate shorter notice period?
• Is there a trial period or pilot option?

⚠️ DISCLAIMER: This is not legal advice. 
   Consult with qualified attorney before signing.
```

### Đánh giá:
- ✅ Identifies key terms clearly
- ✅ Risk assessment với severity
- ✅ Practical recommendations
- ✅ Questions for negotiation
- **Kết quả: ACCEPT**

---

## 🔗 Next Step

> Cần bảo mật thông tin → [NDA Template](./02_nda_template.skill.md)

---

*Contract Review Skill — CVF v1.5.2 Skill Library*
