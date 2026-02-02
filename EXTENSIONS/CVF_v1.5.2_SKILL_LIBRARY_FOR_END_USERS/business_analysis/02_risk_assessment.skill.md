# Risk Assessment

> **Domain:** Business Analysis  
> **Difficulty:** ⭐⭐⭐ Advanced  
> **CVF Version:** v1.5.2

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Đánh giá rủi ro trước khi ra quyết định lớn
- Xác định và ưu tiên các rủi ro dự án
- Lập kế hoạch mitigation
- Due diligence cho đầu tư/partnership

**Không phù hợp khi:**
- Cần so sánh chiến lược → Dùng Strategy Analysis
- Chỉ cần hiểu thị trường → Dùng Market Research
- Rủi ro pháp lý phức tạp → Cần legal expert

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Quyết định/Dự án** | Đang cân nhắc làm gì? | ✅ | "Launch sản phẩm mới trong Q2" |
| **Stakeholders** | Ai liên quan? | ✅ | "Team product, sales, khách hàng hiện tại" |
| **Timeline** | Khung thời gian | ✅ | "6 tháng development + 3 tháng launch" |
| **Investment** | Chi phí/nguồn lực | ✅ | "$200K budget, 5 FTEs" |
| **Known concerns** | Rủi ro đã biết | ❌ | "Team chưa có kinh nghiệm domain mới" |
| **Risk tolerance** | Mức chấp nhận rủi ro | ❌ | "Moderate - startup but Series A" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- Risk register với categorization
- Impact/Probability matrix
- Mitigation strategies
- Contingency plans
- Risk monitoring recommendations

**Cấu trúc output:**
```
RISK ASSESSMENT REPORT

1. Executive Summary
   - Overall risk level: [High/Medium/Low]
   - Top 3 risks
   - Go/No-Go recommendation

2. Risk Categories
   - Strategic risks
   - Operational risks
   - Financial risks
   - Technical risks
   - External risks

3. Risk Matrix
   | Risk | Impact | Probability | Priority |
   |------|--------|-------------|----------|

4. Mitigation Strategies
   - Risk 1: [Mitigation plan]
   - Risk 2: [Mitigation plan]

5. Contingency Plans
   - If [trigger], then [action]

6. Monitoring Plan
   - Key indicators to watch
   - Review frequency
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Đầy đủ các category risks
- [ ] Impact và Probability hợp lý
- [ ] Mitigation actionable
- [ ] Có contingency plans
- [ ] Recommendation rõ ràng
- [ ] Không quá pessimistic hoặc optimistic

**Red flags (cần Reject):**
- ⚠️ Missing major risk categories
- ⚠️ Mitigation quá generic
- ⚠️ Không có contingency plans
- ⚠️ Over/underestimate probability

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Thiếu external risks | Yêu cầu check market, regulatory |
| Mitigation không specific | Hỏi chi tiết actions, owners, timeline |
| Quá pessimistic | Cross-check với industry benchmarks |
| Missing tail risks | Hỏi về worst-case scenarios |

---

## 💡 Tips

1. **List known risks trước** — AI sẽ build on top
2. **Nêu risk tolerance** — Để calibrate assessment
3. **Ask "what if"** — Stress test với scenarios
4. **Cross-check với domain experts** — AI có thể miss industry-specific risks
5. **Update regularly** — Risk assessment là living document

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Quyết định: Launch AI chatbot cho customer support
Stakeholders: CS team (10), customers (5000), engineering (3)
Timeline: 4 tháng dev, 2 tháng pilot
Investment: $100K (platform + development)
Known concerns: 
  - LLM có thể hallucinate
  - CS team lo bị thay thế
Risk tolerance: Low-Medium (enterprise customers)
```

### Output mẫu:
```
RISK ASSESSMENT: AI CHATBOT LAUNCH

1. Executive Summary
   Overall Risk Level: MEDIUM
   
   Top 3 Risks:
   1. LLM hallucination → incorrect answers (High Impact)
   2. CS team resistance → poor adoption (Medium Impact)
   3. Data privacy concerns → enterprise churn (High Impact)
   
   Recommendation: PROCEED WITH CAUTION
   Implement phased rollout với human oversight.

2. Risk Categories
   
   TECHNICAL RISKS:
   - LLM hallucination (Impact: High, Prob: High)
   - Integration failures (Impact: Medium, Prob: Low)
   - Performance issues at scale (Impact: Medium, Prob: Medium)
   
   OPERATIONAL RISKS:
   - CS team resistance (Impact: High, Prob: Medium)
   - Training gaps (Impact: Medium, Prob: Medium)
   
   EXTERNAL RISKS:
   - Data privacy regulations (Impact: High, Prob: Low)
   - Competitor moves (Impact: Low, Prob: Medium)

3. Risk Matrix
   | Risk | Impact | Prob | Priority |
   |------|--------|------|----------|
   | LLM hallucination | High | High | P0 |
   | Data privacy | High | Low | P1 |
   | CS resistance | High | Med | P1 |
   | Performance | Med | Med | P2 |

4. Mitigation Strategies
   
   LLM Hallucination:
   - Implement confidence scoring
   - Human review for low-confidence
   - Strict knowledge base limits
   - Owner: Engineering, Timeline: Month 1-2
   
   CS Team Resistance:
   - Involve team in design
   - Position as "AI assistant" not replacement
   - Training program trước launch
   - Owner: HR + CS Lead, Timeline: Month 2-3
   
   Data Privacy:
   - Review with legal
   - PII filtering
   - Customer opt-in
   - Owner: Legal + Engineering, Timeline: Month 1

5. Contingency Plans
   - IF hallucination rate >5%: Pause rollout, retrain
   - IF CS adoption <50%: Extend pilot, more training
   - IF customer complaints >threshold: Rollback to human-only

6. Monitoring
   - Weekly: Hallucination rate, response accuracy
   - Monthly: CS satisfaction, customer feedback
   - Review: Bi-weekly risk review meetings
```

### Đánh giá:
- ✅ Đủ categories (Technical, Operational, External)
- ✅ Mitigation có owner và timeline
- ✅ Contingency plans với triggers
- ✅ Monitoring plan cụ thể
- **Kết quả: ACCEPT**

---

*Risk Assessment Skill — CVF v1.5.2 Skill Library*
