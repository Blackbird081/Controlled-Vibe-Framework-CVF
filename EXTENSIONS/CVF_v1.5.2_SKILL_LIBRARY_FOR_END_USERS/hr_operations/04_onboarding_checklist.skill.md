# Onboarding Checklist

> **Domain:** HR & Operations  
> **Difficulty:** ⭐ Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-06

---

## 📌 Prerequisites

> Không yêu cầu

---

## 🎯 Mục đích

**Khi nào dùng skill này:**

- Có nhân viên mới join
- Chuẩn hóa onboarding process
- Đảm bảo không miss steps quan trọng
- Tạo experience tốt cho new hire

**Không phù hợp khi:**

- Onboarding contractors ngắn hạn — Cần version simple hơn
- Offboarding — Cần checklist riêng

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R2 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Review |
| Authority Scope | Tactical |
| Autonomy | Human confirmation required |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R2: human confirmation required
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [04_onboarding_checklist](../../../governance/skill-library/uat/results/UAT-04_onboarding_checklist.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Tên nhân viên** | New hire | ✅ | "Phạm Thị E" |
| **Vị trí** | Role | ✅ | "Marketing Manager" |
| **Department** | Phòng ban | ✅ | "Marketing" |
| **Start date** | Ngày bắt đầu | ✅ | "2026-02-15" |
| **Manager** | Người quản lý | ✅ | "Trần Văn F" |
| **Work mode** | Office/Remote/Hybrid | ❌ | "Hybrid" |
| **Special needs** | Yêu cầu đặc biệt | ❌ | "Cần Mac, dual monitor" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

- Checklist đầy đủ theo timeline
- Tasks cho HR, IT, Manager, Buddy
- Day-by-day plan cho tuần đầu
- 30-60-90 day expectations

**Cấu trúc output:**

```
ONBOARDING CHECKLIST

1. Pre-Day 1 (Before start)
2. Day 1
3. Week 1
4. Month 1
5. 30-60-90 Day Milestones
6. Key Contacts
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Cover pre-boarding đến 90 days
- [ ] Assign owner cho mỗi task
- [ ] Include cả logistics và cultural aspects
- [ ] Có timeline rõ ràng
- [ ] Customized cho role/department
- [ ] Include feedback checkpoints

**Red flags (cần Reject):**

- ⚠️ Chỉ focus logistics, thiếu cultural integration
- ⚠️ No clear owners cho tasks
- ⚠️ Too generic, không fit role
- ⚠️ Missing crucial items (email, access, etc.)

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Quên setup accounts | Check IT tasks kỹ |
| Information overload Day 1 | Spread across week |
| No buddy system | Assign buddy từ đầu |
| No check-in points | Schedule 1-on-1 weekly |

---

## 💡 Tips

1. **Start before Day 1** — Send welcome email, setup accounts
2. **Don't overwhelm** — Spread info across 2 weeks
3. **Assign a buddy** — Peer support quan trọng
4. **Schedule 1-on-1s early** — Week 1, Week 2, Week 4
5. **Get feedback** — Ask new hire về experience

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Tên nhân viên: Hoàng Văn G
Vị trí: Senior Backend Developer
Department: Engineering
Start date: 2026-02-20
Manager: Nguyễn Thị H (Engineering Lead)
Work mode: Hybrid (3 days office)
Special needs: Linux laptop preferred
```

### Output mẫu

```
ONBOARDING CHECKLIST: HOÀNG VĂN G
Position: Senior Backend Developer
Start: 2026-02-20

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRE-DAY 1 (Before Feb 20)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ [HR] Send welcome email + handbook
□ [HR] Complete paperwork (contract, tax forms)
□ [IT] Setup Linux laptop + dev environment
□ [IT] Create email, Slack, GitHub accounts
□ [Manager] Prepare first week schedule
□ [Manager] Assign buddy: [Name]
□ [Admin] Prepare desk/access card (for office days)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DAY 1 (Feb 20)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 09:00 - Welcome meeting với HR
□ 09:30 - Get laptop, setup check
□ 10:00 - Coffee với Manager (Nguyễn Thị H)
□ 10:30 - Office tour (if in office)
□ 11:00 - Meet the buddy
□ 14:00 - Team introduction meeting
□ 15:00 - Dev environment walkthrough
□ 16:00 - Access check (repos, tools, docs)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEEK 1 (Feb 20-24)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Day 1-2: Onboarding docs, codebase overview
□ Day 3: Shadow senior dev on a task
□ Day 4: First small task/bug fix
□ Day 5: Weekly 1-on-1 với Manager
□ [Ongoing] Daily standup participation
□ [Ongoing] Lunch với different team members

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MONTH 1 (Feb 20 - Mar 20)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Complete onboarding docs checklist
□ Ship first feature/PR
□ Understand main services architecture
□ Meet with key stakeholders (PM, DevOps)
□ Weekly 1-on-1s với Manager
□ End of month feedback session

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
30-60-90 DAY MILESTONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
30 Days:
• Comfortable với codebase chính
• Shipped 2-3 small features
• Understand team process

60 Days:
• Lead medium feature independently
• Contribute to code review
• Identify 1 area to improve

90 Days:
• Fully productive team member
• Mentor-ready for future new hires
• Clear growth plan discussed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY CONTACTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Manager: Nguyễn Thị H (h@company.com)
• Buddy: [Name] (buddy@company.com)
• HR: hr@company.com
• IT Support: it@company.com
```

### Đánh giá

- ✅ Full timeline pre-day to 90 days
- ✅ Clear owners [HR], [IT], [Manager]
- ✅ Role-specific (dev environment, repos)
- ✅ Includes cultural (lunch, buddy)
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills

- [Interview Evaluation](./02_interview_evaluation.skill.md)
- [Performance Review](./03_performance_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Onboarding Checklist**, tiếp tục với:
→ [Performance Review](./03_performance_review.skill.md)

---

*CVF Skill Library v1.5.2 | HR & Operations Domain*
