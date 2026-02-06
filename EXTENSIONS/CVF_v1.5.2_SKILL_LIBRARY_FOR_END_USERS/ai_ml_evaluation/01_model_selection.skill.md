# Model Selection

> **Domain:** AI/ML Evaluation  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  

---

## 🎯 Mục đích

**Khi nào dùng:**
- Chọn LLM cho dự án mới
- So sánh các options (GPT vs Claude vs Gemini)
- Cân nhắc cost vs performance

**Không phù hợp khi:**
- Highly specialized ML models → Cần ML engineer
- Real-time inference critical → Cần benchmark riêng

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Use case** | Bạn muốn làm gì | ✅ | "Customer support chatbot" |
| **Volume** | Số lượng requests | ✅ | "1000 requests/day" |
| **Budget** | Ngân sách | ✅ | "$500/month" |
| **Quality needs** | Yêu cầu chất lượng | ✅ | "High accuracy, formal tone" |
| **Latency** | Yêu cầu tốc độ | ❌ | "Under 3 seconds" |

---

## ✅ Expected Output

- So sánh các model options
- Recommendation với justification
- Cost estimation
- Trade-offs

---

## 🔍 Cách đánh giá

**Checklist:**
- [ ] Cover major options
- [ ] Cost calculation realistic
- [ ] Trade-offs explained
- [ ] Recommendation fits use case

**Red flags:**
- ⚠️ Miss major model options
- ⚠️ Cost calculation wrong

---

## 💡 Tips

1. **Start with use case** — Not model hype
2. **Consider latency** — Real-time vs batch
3. **Test before commit** — Free tiers exist
4. **Plan for scale** — Costs change

---

*Model Selection Skill — CVF v1.5.2*
