# Prompt Evaluation

> **Domain:** AI/ML Evaluation  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  

---

## 🎯 Mục đích

**Khi nào dùng:**
- Review prompt trước khi deploy
- Debug prompt kém hiệu quả
- Optimize prompt quality

**Không phù hợp khi:**
- Need to create new prompt → Use prompt templates
- Complex prompt engineering → Need specialist

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Prompt** | Prompt cần review | ✅ | "[Your prompt text]" |
| **Expected output** | Output mong muốn | ✅ | "JSON với 5 fields" |
| **Current issues** | Vấn đề hiện tại | ❌ | "Output không consistent" |
| **Model** | Đang dùng model nào | ❌ | "GPT-4" |

---

## ✅ Expected Output

- Prompt analysis
- Issues identified
- Improvement suggestions
- Revised prompt

---

## 🔍 Cách đánh giá

**Checklist:**
- [ ] Identify real issues
- [ ] Suggestions actionable
- [ ] Revised prompt better
- [ ] Explains why changes help

**Red flags:**
- ⚠️ Generic suggestions
- ⚠️ Revised worse than original

---

## 💡 Tips

1. **Be specific** — Clear instructions
2. **Give examples** — Few-shot helps
3. **Set constraints** — Format, length
4. **Test variations** — A/B test prompts

---

*Prompt Evaluation Skill — CVF v1.5.2*
