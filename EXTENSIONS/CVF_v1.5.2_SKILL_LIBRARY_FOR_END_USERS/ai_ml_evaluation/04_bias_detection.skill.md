# Bias Detection

> **Domain:** AI/ML Evaluation  
> **Difficulty:** ⭐⭐⭐ Advanced  
> **CVF Version:** v1.5.2  

---

## 🎯 Mục đích

**Khi nào dùng:**
- Audit AI system cho bias
- Review AI output patterns
- Compliance với fairness requirements

**Không phù hợp khi:**
- Need statistical analysis → Data scientist
- Legal compliance → Legal team

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **AI Application** | Ứng dụng AI | ✅ | "Resume screening" |
| **Sample outputs** | Các outputs mẫu | ✅ | "[Examples]" |
| **Protected classes** | Nhóm cần bảo vệ | ✅ | "Gender, age, ethnicity" |
| **Decision impact** | Ảnh hưởng quyết định | ❌ | "Hiring decisions" |

---

## ✅ Expected Output

- Potential biases identified
- Evidence/examples
- Severity assessment
- Mitigation recommendations

---

## 🔍 Cách đánh giá

**Checklist:**
- [ ] Check all protected classes
- [ ] Evidence-based findings
- [ ] Severity realistic
- [ ] Mitigations actionable

**Red flags:**
- ⚠️ Miss obvious biases
- ⚠️ Overstate without evidence

---

## 💡 Tips

1. **Diverse test cases** — Cover edge cases
2. **Compare groups** — Look for patterns
3. **Document everything** — Audit trail
4. **Regular checks** — Bias can drift

---

*Bias Detection Skill — CVF v1.5.2*
