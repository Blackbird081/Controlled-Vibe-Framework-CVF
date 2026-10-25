# User Flow Analysis

> **Domain:** Product & UX  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07
> **Inspired by:** antigravity-awesome-skills/user-flows

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Phân tích user journeys và flows trong sản phẩm. Tìm ra friction points, drop-offs, và opportunities để optimize conversion và retention.

**Khi nào nên dùng:**

- Funnel conversion rate thấp
- High drop-off ở specific steps
- Redesign user journey
- Onboarding optimization

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design, Review |
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

- UAT Record: [user_flow_analysis](../../../governance/skill-library/uat/results/UAT-user_flow_analysis.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Flow Name** | ✅ | VD: Checkout flow, Signup flow |
| **Start Point** | ✅ | Đâu là entry point |
| **End Goal** | ✅ | Successful conversion là gì |
| **Steps Có** | ✅ | List các bước trong flow |
| **Conversion Data** | ❌ | % tại mỗi step (nếu có) |
| **User Feedback** | ❌ | Complaints, survey results |
| **Competitor Flow** | ❌ | So sánh với đối thủ |

---

## ✅ Checklist Đánh giá

### Flow Structure

- [ ] Số bước có tối ưu (ít nhất có thể)?
- [ ] Mỗi bước có clear purpose?
- [ ] Progress indicator có visible?
- [ ] User có thể go back dễ dàng?
- [ ] Flow có logical sequence?

### Onboarding/First-Time Experience

- [ ] First step có compelling?
- [ ] Value có được show early?
- [ ] Có quick win cho users mới?
- [ ] Not asking too much upfront?

### Friction Points

- [ ] Không có unnecessary steps?
- [ ] Form fields có minimal?
- [ ] No confusing UI elements?
- [ ] Error handling có clear?
- [ ] Recovery path nếu fail?

### Mobile Experience

- [ ] Flow có work well on mobile?
- [ ] Input methods phù hợp mobile?
- [ ] No horizontal scrolling?
- [ ] Touch targets đủ lớn?

### Exit Points

- [ ] Clear exit options (không trap users)?
- [ ] Save progress cho long flows?
- [ ] Exit surveys để capture feedback?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **Too many steps** | High abandonment | Combine or remove steps |
| **Asking email first** | Low signup | Ask after showing value |
| **No progress indicator** | User anxiety | Add step counter |
| **Mandatory fields** | Form abandonment | Make optional or remove |
| **Hidden costs** | Cart abandonment | Show pricing upfront |
| **Slow performance** | Drop-offs | Optimize load times |
| **No guest checkout** | Lost sales | Allow guest purchases |

---

## 💡 Tips & Examples

### Funnel Analysis Framework

```
Entry → Step 1 → Step 2 → Step 3 → Conversion
100%    80%       60%       40%       20%

Drop rate: 20%    25%       33%       50%
           ↓       ↓         ↓         ↓
       Investigate the biggest drops first
```

### Common Flow Templates

**E-commerce Checkout:**

```
Cart → Shipping → Payment → Confirm → Success
  ↓        ↓          ↓         ↓
 Save   Address    Secure    Review
 cart   autofill   badges    order
```

**SaaS Signup:**

```
Landing → Email → Verify → Onboard → Aha Moment
    ↓        ↓        ↓         ↓
  Value    Social    Skip?    Guide
  prop     login     option   wizard
```

**Mobile App Onboarding:**

```
Splash → Value Props → Permission → Login → Home
   ↓         ↓            ↓           ↓
 2 sec    3 screens    Explain    Social
 max      max          why        login
```

### Step Optimization Checklist

```
For each step, ask:
1. Is this step necessary?
2. Can it be combined with another?
3. Can it be moved later?
4. Can it be made optional?
5. Can it be skipped for returning users?
```

### Analytics to Track

| Metric | What it tells you |
|--------|------------------|
| **Step conversion rate** | Where users drop |
| **Time per step** | Confusion points |
| **Error rate per step** | UX problems |
| **Device breakdown** | Mobile issues |
| **Entry sources** | Context matters |

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Flow Diagram** - Visual representation
2. **Drop-off Analysis** - Where users leave
3. **Friction Points** - UX issues identified
4. **Benchmark Comparison** - vs industry standards
5. **Quick Wins** - Easy fixes for immediate impact
6. **Redesign Suggestions** - Optimized flow proposal
7. **Metrics to Track** - KPIs for improvement

---

## 🔗 Next Step

Sau khi hoàn thành **User Flow Analysis**, tiếp tục với:
→ [Accessibility Audit (WCAG)](./accessibility_audit.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Flow: Tạo phiếu nhập hàng từ PO
Steps: 7 bước
Drop-off: 35% tại bước chọn nhà cung cấp
Time to complete: 4.5 phút
```

### Output mẫu

```markdown
# User Flow Findings

## Flow
Home → PO List → PO Detail → "Receive" → Select Supplier → Scan Items → Confirm

## Friction Points
- Bước "Select Supplier" không auto-fill → +25s
- Scan Items không hỗ trợ nhập tay → lỗi 12%

## Recommendations
- Auto-select supplier từ PO
- Thêm fallback nhập SKU thủ công
- Hiển thị progress (3/7)
```

### Đánh giá

- ✅ Chỉ ra điểm rơi rõ ràng
- ✅ Có nguyên nhân + giải pháp
- ✅ Dễ chuyển thành backlog UX
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [User Persona Development](./user_persona_development.skill.md)
- [UX Heuristic Evaluation](./ux_heuristic_evaluation.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: examples + flow alignment |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step: UX Heuristic Evaluation

Sau khi hoàn thành **User Flow Analysis**, tiếp tục với:
→ [UX Heuristic Evaluation](./ux_heuristic_evaluation.skill.md)

---

*CVF Skill Library v1.5.2 | Product & UX Domain*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
