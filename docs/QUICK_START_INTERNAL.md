# CVF Internal Usage Guide (v1.0-internal)

**Version:** 1.0-internal  
**Status:** Active Development  
**Scope:** Internal Company Use Only  
**Last Updated:** January 29, 2026

---

## 🎯 Mục Đích

CVF (Controlled-Vibe Framework) là công cụ **kiểm soát rủi ro** và **đảm bảo chất lượng** cho những công việc sử dụng AI trong công ty.

**Sử dụng CVF khi:**
- ✅ Viết vibe code có yêu cầu kiểm soát chặt
- ✅ Làm việc với dữ liệu nhạy cảm
- ✅ Cần audit trail (theo dõi lịch sử)
- ✅ Muốn đảm bảo output AI không bị lỗi

**Không cần CVF khi:**
- ❌ Công việc rất đơn giản, không có rủi ro
- ❌ Chỉ cần AI làm brainstorming/creative
- ❌ Không cần proof/documentation

---

## 🚀 Bắt Đầu Nhanh (5 phút)

### 1. Cài Đặt

```bash
# Clone framework
cd your-project
git clone <cvf-internal-repo>

# Install dependencies (nếu cần)
pip install -r CVF/requirements.txt
```

### 2. Tạo Một "Skill" (AI Task)

```python
# my_ai_task.py
from cvf import Skill, SkillContract, RiskLevel, IOSpec

# Define input/output
input_spec = IOSpec(
    schema={"text": str},
    validation="text must be 10-1000 chars"
)

output_spec = IOSpec(
    schema={"result": str, "confidence": float},
    validation="confidence must be 0-1"
)

# Create skill
contract = SkillContract(
    id="my-email-classifier",
    name="Email Classifier",
    description="Classify emails as spam/legit",
    input_spec=input_spec,
    output_spec=output_spec,
    risk_level=RiskLevel.R1,  # Basic risk
    execution_requirements="Claude API + email regex"
)

# Use it
skill = Skill(contract)
result = skill.execute({"text": "Buy now!!!"})
print(result)
```

### 3. Định Nghĩa Rủi Ro

```python
# Risk levels trong CVF:
# R0 = Full auto (no risk)
# R1 = Auto + basic check
# R2 = Need human review first
# R3 = Fully manual (no auto)

# For email classifier: R1 is enough
# (auto-run, but flag low-confidence)
```

---

## 📋 CVF Risk Levels (Dễ Hiểu)

| Level | Ý Nghĩa | Khi Nào Dùng | Ví Dụ |
|-------|---------|-----------|---------|
| **R0** | Auto - Không rủi ro | Công việc không quan trọng | Random quote generator |
| **R1** | Auto + Kiểm tra cơ bản | Rủi ro thấp | Email classifier, sentiment analysis |
| **R2** | Cần phê duyệt thủ công | Rủi ro vừa | Customer response draft, code review suggestion |
| **R3** | Chỉ hỗ trợ thông tin | Rủi ro cao | Medical diagnosis, financial decision, user data |

---

## 💡 Ví Dụ Thực Tế

### Ví Dụ 1: Email Phân Loại (R1)

```python
from cvf import Skill, SkillContract, RiskLevel

contract = SkillContract(
    id="email-classifier-v1",
    name="Email Classifier",
    description="Classify emails",
    risk_level=RiskLevel.R1,
    
    # Input
    input_spec={
        "email_subject": str,
        "email_body": str
    },
    
    # Output
    output_spec={
        "category": ["spam", "legit", "unknown"],
        "confidence": 0.0  # 0-1
    },
    
    # Kiểm tra (bắt buộc cho R1+)
    validation_rules=[
        "confidence >= 0.7",
        "category in [spam, legit, unknown]"
    ],
    
    # Hành động nếu fail
    fallback_action="flag_for_review"
)

# Sử dụng
skill = Skill(contract)
result = skill.execute({
    "email_subject": "URGENT: Claim Your Prize!!!",
    "email_body": "Click here to win $10000..."
})

# Output:
# {
#   "category": "spam",
#   "confidence": 0.95,
#   "approved": true,
#   "audit_id": "email-classifier-20260129-001"
# }
```

### Ví Dụ 2: Customer Reply Draft (R2)

```python
contract = SkillContract(
    id="customer-reply-v1",
    name="Draft Customer Reply",
    description="Write response to customer",
    risk_level=RiskLevel.R2,  # Cần review
    
    input_spec={
        "customer_message": str,
        "customer_history": str,  # Previous interactions
        "tone": ["formal", "friendly", "apologetic"]
    },
    
    output_spec={
        "draft_reply": str,
        "sentiment": str,
        "requires_review": bool
    },
    
    # R2 needs human review
    review_required=True,
    review_instructions="Check tone, factual accuracy, tone match"
)

skill = Skill(contract)

# Step 1: Generate draft
draft = skill.execute({
    "customer_message": "Your service is terrible!",
    "customer_history": "Loyal customer, 2 complaints last month",
    "tone": "apologetic"
})

# Step 2: Human review (required)
if draft.requires_review:
    print("⏳ Waiting for review from:", draft.assigned_reviewer)
    # -> Manager opens dashboard, reviews, approves
    
# Step 3: Send after approval
if draft.is_approved:
    send_email(draft.draft_reply)
```

### Ví Dụ 3: Medical Diagnosis (R3 - Info Only)

```python
contract = SkillContract(
    id="symptom-info-v1",
    name="Symptom Information Assistant",
    description="Provide educational info about symptoms",
    risk_level=RiskLevel.R3,  # Không tự động quyết định
    
    input_spec={
        "symptoms": [str],
        "duration_days": int
    },
    
    output_spec={
        "educational_info": str,
        "possible_conditions": [str],
        "disclaimer": str,
        "should_see_doctor": bool
    },
    
    # R3: Always include disclaimer
    mandatory_disclaimers=[
        "This is educational information only",
        "Consult a healthcare professional",
        "Not a medical diagnosis"
    ]
)

skill = Skill(contract)
result = skill.execute({
    "symptoms": ["headache", "fever"],
    "duration_days": 3
})

# Output always includes:
# "⚠️ This is educational information only.
#  Please consult a healthcare professional."
```

---

## 🛠️ Cách Sử Dụng Hàng Ngày

### 1. Xác Định Rủi Ro

Trước khi viết skill:

```
Câu hỏi 1: Có thể tự động chạy mà không cần review?
   - YES → R0 hoặc R1
   - NO → R2 hoặc R3

Câu hỏi 2: Output được dùng trực tiếp hay chỉ để tham khảo?
   - Trực tiếp → Cao hơn 1 level rủi ro
   - Tham khảo → Thấp hơn 1 level

Câu hỏi 3: Dữ liệu input có nhạy cảm không?
   - Có (user data, payment, health) → R2 minimum
   - Không → Có thể R0-R1
```

### 2. Viết Skill

```python
from cvf import SkillContract, RiskLevel, IOSpec

# Step 1: Input spec (gì vào?)
inputs = IOSpec(
    schema={"text": str, "language": str},
    examples=[
        {"text": "Hello", "language": "en"},
        {"text": "Xin chào", "language": "vi"}
    ]
)

# Step 2: Output spec (gì ra?)
outputs = IOSpec(
    schema={"translation": str, "confidence": float},
    examples=[
        {"translation": "Hi", "confidence": 0.99}
    ]
)

# Step 3: Create contract
contract = SkillContract(
    id="translate-v1",
    name="Text Translator",
    description="Translate text between languages",
    input_spec=inputs,
    output_spec=outputs,
    risk_level=RiskLevel.R1,
    execution_requirements="Claude API with translation model"
)

# Step 4: Test it
from cvf import Skill
skill = Skill(contract)
result = skill.execute({"text": "Hello", "language": "en"})
```

### 3. Kiểm Tra Output

```python
# CVF tự động kiểm tra:
# ✅ Input có đúng schema
# ✅ Output có đúng schema
# ✅ Không bỏ sót field bắt buộc
# ✅ Performance metrics
# ✅ Audit trail

# Xem lịch sử
audit_log = skill.get_audit_log()
print(f"Executed {len(audit_log)} times")
print(f"Success rate: {skill.get_success_rate()}")
print(f"Avg response time: {skill.get_avg_latency()}ms")
```

---

## 📊 Monitoring & Dashboard

### Xem Metrics

```python
# Real-time metrics
metrics = skill.get_metrics()
print(f"✅ Success: {metrics['success_count']}")
print(f"❌ Failed: {metrics['error_count']}")
print(f"⏱️ Latency: {metrics['avg_latency']}ms")
print(f"🔍 Confidence: {metrics['avg_confidence']}")
```

### Audit Trail

```python
# Xem toàn bộ lịch sử execution
for execution in skill.get_audit_log():
    print(f"🕐 {execution.timestamp}")
    print(f"📥 Input: {execution.input}")
    print(f"📤 Output: {execution.output}")
    print(f"✅ Status: {execution.status}")
    print(f"👤 User: {execution.user}")
    print()
```

---

## 🔐 Best Practices

### ✅ Do's

- ✅ Luôn định nghĩa `input_spec` và `output_spec` rõ ràng
- ✅ Chọn `risk_level` phù hợp (không chọn quá cao/quá thấp)
- ✅ Thêm validation rules để catch errors
- ✅ Set up fallback action
- ✅ Check audit log regularly
- ✅ Test skill trước khi deploy

### ❌ Don'ts

- ❌ Không bỏ qua input validation
- ❌ Không dùng R0 cho công việc có rủi ro
- ❌ Không bỏ qua output check
- ❌ Không quên ghi nhớ (audit trail)
- ❌ Không dùng magic strings, luôn dùng enums

---

## 📚 Các File Cần Biết

```
CVF/
├── quick_start.py           # Template tạo skill mới
├── examples/
│   ├── r0_simple.py         # Ví dụ R0
│   ├── r1_with_check.py     # Ví dụ R1
│   ├── r2_with_review.py    # Ví dụ R2
│   └── r3_info_only.py      # Ví dụ R3
├── sdk/
│   ├── skill.py             # Main Skill class
│   ├── contract.py          # SkillContract
│   └── validator.py         # Validation logic
└── docs/
    ├── QUICK_START_INTERNAL.md  # This file
    ├── RISK_LEVELS.md
    └── TROUBLESHOOTING.md
```

---

## ❓ FAQ - Thường Gặp

### Q: Làm sao biết chọn R0, R1, R2 hay R3?

**A:** Trả lời 3 câu này:

1. **Có thể tự động?** → YES=R0/1, NO=R2/3
2. **Dữ liệu nhạy cảm?** → YES=thêm +1 level, NO=không
3. **Output được dùng ngay?** → YES=thêm +1 level, NO=không

Ví dụ:
- Email spam filter: Auto? YES. Nhạy cảm? NO. Dùng ngay? YES. → R1
- Customer reply draft: Auto? NO. → R2

### Q: Skill chạy fail, bây giờ làm sao?

**A:** Check audit log:

```python
error = skill.get_latest_error()
print(error.message)
print(error.input)
print(error.traceback)

# Rồi:
# 1. Fix input (format sai?)
# 2. Fix skill (logic sai?)
# 3. Update contract (spec sai?)
```

### Q: Làm sao share skill với team?

**A:** Lưu vào Git:

```bash
# 1. Create trong version control
git add skills/my_email_classifier.py

# 2. Push to team repo
git push origin feature/email-classifier

# 3. Team members chạy
from skills.my_email_classifier import EmailClassifierSkill
```

### Q: Làm sao review lịch sử?

**A:** Dùng audit log:

```python
# Xem tất cả executions
skill.show_audit_log()

# Filter theo date
skill.show_audit_log(from_date="2026-01-25", to_date="2026-01-29")

# Filter theo status
skill.show_audit_log(status="failed")

# Export to CSV
skill.export_audit_log("audit.csv")
```

---

## 🚨 Troubleshooting

### Issue: "Schema validation failed"

```
❌ Error: Input schema does not match
   Expected: {"text": str}
   Got: {"text": "hello", "extra_field": 123}
```

**Fix:**
```python
# 1. Remove extra fields
# 2. Or update input_spec to accept it
input_spec = IOSpec(
    schema={"text": str, "extra_field": int}  # ✅
)
```

### Issue: "Output not approved"

```
❌ Error: Skill output failed validation
   Expected: confidence >= 0.7
   Got: confidence = 0.45
```

**Fix:**
```python
# Either:
# 1. Lower threshold
validation_rules=["confidence >= 0.4"]

# 2. Improve AI prompt
# 3. Use different model
```

### Issue: "Review timeout"

```
⏳ Error: Review not completed in 24h
   Status: PENDING_REVIEW
   Assigned to: john@company.com
```

**Fix:**
```python
# 1. Remind reviewer
# 2. Change assignee
skill.reassign_reviewer("jane@company.com")

# 3. Auto-approve after timeout (careful!)
contract.review_timeout_auto_approve = True
```

---

## 📖 Tiếp Theo

1. **Xem ví dụ:** `examples/r1_with_check.py`
2. **Tạo skill đầu tiên:** Copy `quick_start.py`
3. **Test locally:** `pytest tests/`
4. **Deploy:** `python deploy.py --env=staging`
5. **Monitor:** Check dashboard mỗi tuần

---

## 👥 Liên Hệ / Support

- 💬 Team Slack: #cvf-internal
- 📧 Questions: cvf-team@company.com
- 🐛 Bugs: Create issue in internal repo
- 📚 Docs: See `/docs` folder

---

**Version:** 1.0-internal  
**Scope:** Internal Use Only  
**Last Update:** January 29, 2026  
**Status:** ✅ Ready to Use
