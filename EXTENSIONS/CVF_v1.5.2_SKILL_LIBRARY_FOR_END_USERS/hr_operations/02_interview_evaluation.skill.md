# Interview Evaluation

> **Domain:** HR & Operations  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-06

---

## 📌 Prerequisites

> - [Job Description](./01_job_description.skill.md) — Hiểu rõ requirements của vị trí

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Sau khi phỏng vấn ứng viên, cần đánh giá tổng hợp
- So sánh nhiều ứng viên cho cùng vị trí
- Tạo scorecard chuẩn cho team tuyển dụng
- Cần documentation cho hiring decision

**Không phù hợp khi:**
- Chưa có interview notes — Cần ghi chép trước
- Cần reference check — Đó là bước riêng
- Đánh giá technical skills chi tiết — Cần technical interviewer

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Tên ứng viên** | Tên candidate | ✅ | "Nguyễn Văn A" |
| **Vị trí** | Role đang apply | ✅ | "Senior PM" |
| **Interview notes** | Ghi chép từ phỏng vấn | ✅ | "Strong PM background, 5 năm exp..." |
| **Evaluation criteria** | Các tiêu chí đánh giá | ✅ | "Technical, Communication, Leadership" |
| **Interviewers** | Ai đã phỏng vấn | ❌ | "HR: Mai, Hiring Manager: Tùng" |
| **Red flags observed** | Điểm cần lưu ý | ❌ | "Hay nhảy việc, salary expectation cao" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- Scorecard đánh giá theo criteria
- Summary strengths/weaknesses
- Recommendation: Hire / Reject / Next round
- Notes cho hiring manager

**Cấu trúc output:**
```
CANDIDATE EVALUATION

1. Summary Overview
2. Scorecard
   - Criteria 1: Score + Notes
   - Criteria 2: Score + Notes
   - ...
3. Strengths
4. Concerns/Weaknesses
5. Recommendation + Justification
6. Next Steps (if applicable)
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Đánh giá objective, dựa trên evidence
- [ ] Cover đủ các criteria đã định
- [ ] Có specific examples từ interview
- [ ] Recommendation có justification rõ ràng
- [ ] Không có bias (age, gender, background)
- [ ] Language professional

**Red flags (cần Reject):**
- ⚠️ Đánh giá quá subjective ("cảm thấy", "có vẻ")
- ⚠️ Thiếu evidence cho scores
- ⚠️ Bias language
- ⚠️ Không address red flags đã nêu

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Đánh giá chung chung | Yêu cầu specific examples |
| Quên criteria quan trọng | Cung cấp đầy đủ criteria upfront |
| Bias trong đánh giá | Double-check với multiple interviewers |
| Không consistent giữa candidates | Dùng cùng template cho tất cả |

---

## 💡 Tips

1. **Ghi chép kỹ trong interview** — Evidence quan trọng
2. **Dùng scoring scale nhất quán** — 1-5 với định nghĩa rõ
3. **Separate facts vs opinions** — Phân biệt rõ
4. **Include specific quotes** — "Candidate nói: ..."
5. **Compare với benchmark** — Với candidates khác hoặc team hiện tại

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Tên ứng viên: Trần Văn B
Vị trí: Senior Product Manager
Interview notes:
  - 6 năm kinh nghiệm PM, 3 năm ở B2B SaaS
  - Trình bày case study rõ ràng, data-driven
  - Communication tốt, tự tin
  - Hơi weak về technical understanding
  - Salary expectation: $5000 (budget: $4000-4500)
Criteria: Product sense, Communication, Technical, Leadership
Red flags: Salary gap, nhảy 3 công ty trong 4 năm
```

### Output mẫu:
```
CANDIDATE EVALUATION: TRẦN VĂN B
Position: Senior Product Manager

SUMMARY:
Strong PM với experience phù hợp. Concerns về salary 
expectation và job stability.

SCORECARD (1-5):
┌─────────────────┬───────┬─────────────────────────────┐
│ Criteria        │ Score │ Notes                       │
├─────────────────┼───────┼─────────────────────────────┤
│ Product Sense   │ 4/5   │ Data-driven, good case study│
│ Communication   │ 5/5   │ Clear, confident presenter  │
│ Technical       │ 3/5   │ Weak on API/architecture    │
│ Leadership      │ 4/5   │ Led team of 5, good examples│
└─────────────────┴───────┴─────────────────────────────┘
Overall: 4.0/5

STRENGTHS:
• Solid B2B SaaS experience (3 years)
• Excellent communication skills
• Data-driven decision making

CONCERNS:
• Technical understanding cần improve
• Salary expectation cao hơn budget 15%
• 3 jobs trong 4 năm — need to understand why

RECOMMENDATION: PROCEED TO FINAL ROUND
Justification:
- Core skills strong (Product, Comms)
- Technical gap có thể bù bằng strong engineering team
- Salary: có thể negotiate với equity/benefits

NEXT STEPS:
1. Final round với CEO
2. Discuss salary expectation
3. Reference check (2 previous managers)
```

### Đánh giá:
- ✅ Objective với evidence
- ✅ Cover all criteria
- ✅ Address red flags
- ✅ Clear recommendation
- **Kết quả: ACCEPT**

---

## 🔗 Next Step

> Sau khi hire → [Onboarding Checklist](./04_onboarding_checklist.skill.md)

---

*Interview Evaluation Skill — CVF v1.5.2 Skill Library*
