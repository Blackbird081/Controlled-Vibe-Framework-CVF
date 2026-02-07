# Strategy Analysis

> **Domain:** Business Analysis  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- So sánh các phương án kinh doanh
- Đánh giá chiến lược mới
- Phân tích SWOT, Porter's 5 Forces
- Lập kế hoạch chiến lược

**Không phù hợp khi:**
- Cần nghiên cứu thị trường chi tiết → Dùng Market Research
- Chỉ đánh giá rủi ro → Dùng Risk Assessment
- Cần số liệu tài chính cụ thể → Cần financial analyst

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery |
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

- UAT Record: [01_strategy_analysis](../../../governance/skill-library/uat/results/UAT-01_strategy_analysis.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Tình huống** | Bạn đang đối mặt vấn đề gì? | ✅ | "Mở rộng sang thị trường mới hay focus thị trường hiện tại" |
| **Các phương án** | Liệt kê options đang cân nhắc | ✅ | "A: Mở rộng B2C, B: Focus B2B, C: Hybrid" |
| **Mục tiêu** | Muốn đạt được gì? | ✅ | "Tăng revenue 30% trong 2 năm" |
| **Ràng buộc** | Budget, time, resources | ✅ | "Budget $500K, team 10 người" |
| **Context ngành** | Ngành, quy mô, giai đoạn | ❌ | "SaaS B2B, Series A, 50 employees" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- So sánh các phương án theo nhiều tiêu chí
- SWOT analysis cho mỗi option (nếu cần)
- Recommendation với lý do
- Implementation roadmap sơ bộ

**Cấu trúc output:**
```
1. Tóm tắt tình huống
2. Framework phân tích (SWOT/Porter/BCG...)
3. So sánh các phương án
   - Option A: Pros/Cons/Risks
   - Option B: Pros/Cons/Risks
   - ...
4. Recommendation + Justification
5. Next steps
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Hiểu đúng tình huống và context
- [ ] Phân tích đầy đủ các phương án
- [ ] Recommendation có logic rõ ràng
- [ ] Cân nhắc được ràng buộc thực tế
- [ ] Có next steps actionable
- [ ] Không bias sang 1 option từ đầu

**Red flags (cần Reject):**
- ⚠️ Recommendation không có justification
- ⚠️ Bỏ qua ràng buộc đã nêu
- ⚠️ Phân tích quá generic, không specific
- ⚠️ Missing key risks

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Output quá generic | Cung cấp context ngành cụ thể |
| Bias sang 1 option | Yêu cầu phân tích balanced |
| Thiếu actionable steps | Hỏi thêm về implementation |
| Bỏ qua risks | Check phần risks cho mỗi option |

---

## 💡 Tips

1. **Context quyết định quality** — Càng cụ thể càng tốt
2. **Nêu rõ constraints** — AI sẽ cân nhắc trong recommendation
3. **Hỏi follow-up** — "What if budget là X?" để stress-test
4. **Cross-check với expert** — AI analysis là starting point
5. **Dùng framework phù hợp** — SWOT, Porter, BCG tùy context

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Tình huống: Công ty SaaS đang cân nhắc mở rộng sang SEA
Các phương án:
  A: Mở văn phòng tại Singapore
  B: Partner với local distributors
  C: Remote sales team từ VN
Mục tiêu: $2M ARR từ SEA trong 3 năm
Ràng buộc: Budget $300K/năm, core team ở VN
Context: B2B SaaS, HR Tech, 100 customers ở VN
```

### Output mẫu:
```
STRATEGY ANALYSIS: SEA EXPANSION

1. Tình huống: [summary]

2. Framework: Market Entry Strategy Matrix

3. So sánh:
   Option A (Singapore office):
   - Pros: Credibility, local presence
   - Cons: High cost ($200K+ setup)
   - Risk: Cash burn if slow adoption

   Option B (Local partners):
   - Pros: Lower cost, local knowledge
   - Cons: Less control, margin sharing
   - Risk: Partner quality varies

   Option C (Remote from VN):
   - Pros: Cost effective, maintain control
   - Cons: Time zone, trust building harder
   - Risk: Slower sales cycle

4. Recommendation: OPTION B (Hybrid)
   Start with 2-3 quality partners in SG và MY.
   Evaluate sau 18 tháng để quyết định office.
   
   Justification:
   - Phù hợp budget $300K/năm
   - Test market trước khi commit lớn
   - Learn from partner's local expertise

5. Next Steps:
   - Month 1-2: Research partners
   - Month 3: Sign 2 partners
   - Month 6: First customers via partners
   - Month 18: Evaluate office decision
```

### Đánh giá:
- ✅ Hiểu context (B2B SaaS, HR Tech)
- ✅ Phân tích 3 options balanced
- ✅ Recommendation có justification
- ✅ Cân nhắc budget constraint
- ✅ Next steps cụ thể
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills
- [Market Research](./03_market_research.skill.md)
- [Risk Assessment](./02_risk_assessment.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Strategy Analysis**, tiếp tục với:
→ [Risk Assessment](./02_risk_assessment.skill.md)

---

*CVF Skill Library v1.5.2 | Business Analysis Domain*