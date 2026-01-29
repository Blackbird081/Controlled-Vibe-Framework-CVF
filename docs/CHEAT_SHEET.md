# CVF Internal - Cheat Sheet

**Print this. Put it on your desk. Reference when needed.**

---

## 🎯 Risk Levels (Remember These)

| Level | What It Does | When to Use | Example |
|-------|--------------|-------------|---------|
| **R0** | Auto | No risk | Quote generator |
| **R1** | Auto + check | Low risk | Email classifier |
| **R2** | Review first | Medium risk | Draft response |
| **R3** | Info only | High risk | Medical info |

**Rule:** When in doubt, go +1 level higher.

---

## 💻 5-Minute Skill Template

```python
from cvf import Skill, SkillContract, RiskLevel

# 1. What goes in?
input_spec = {"text": str}

# 2. What comes out?
output_spec = {"result": str, "confidence": float}

# 3. Create contract
contract = SkillContract(
    id="my-skill-v1",
    name="My Skill",
    input_spec=input_spec,
    output_spec=output_spec,
    risk_level=RiskLevel.R1,
    validation_rules=["confidence >= 0.7"]
)

# 4. Use it
skill = Skill(contract)
result = skill.execute({"text": "your data"})
print(result)
```

Copy & modify. Done!

---

## ⚡ Common Commands

```python
# Create
skill = Skill(contract)

# Execute
result = skill.execute(data)

# Check success
print(f"✅ {skill.success_rate()}% success rate")

# Check speed
print(f"⏱️ {skill.avg_latency()}ms average")

# Check confidence
print(f"🎯 {skill.avg_confidence()} average confidence")

# See what happened
skill.show_audit_log()

# Export history
skill.export_audit_log("audit.csv")

# See errors
errors = skill.get_failed_executions()
```

---

## 🔍 When to Choose Which Risk Level

**Ask yourself:**

1. **Can AI decide alone?**
   - YES → R0 or R1
   - NO → R2 or R3

2. **Is data sensitive?**
   - YES → +1 level
   - NO → stay same

3. **Do I use output directly?**
   - YES → +1 level
   - NO → stay same

**Example Decision:**
```
Email classifier
- Can AI decide alone? YES → R0/R1
- Sensitive data? NO → no change
- Use directly? YES → +1
→ R1 ✅
```

---

## 📋 Validation Rules (Copy & Modify)

```python
# For confidence
"confidence >= 0.7"

# For categories
"category in ['spam', 'work', 'personal']"

# For numbers
"score > 0 and score <= 100"

# For text
"len(text) > 10"

# Multiple rules
validation_rules=[
    "confidence >= 0.7",
    "category in ['A', 'B', 'C']",
    "len(result) > 0"
]
```

---

## 🚨 Error Checklist

| Error | What It Means | Fix |
|-------|---------------|-----|
| Schema validation failed | Input format wrong | Check input matches spec |
| Output validation failed | Output format wrong | Check AI prompt |
| Confidence too low | AI not sure | Lower threshold or improve prompt |
| Review timeout | Nobody reviewed it | Remind reviewer / auto-approve |

---

## 📊 Weekly Checklist

```
Every Friday:
- [ ] Check success rate (> 90%?)
- [ ] Check avg latency (< 2s?)
- [ ] Check errors (any new patterns?)
- [ ] Review audit log (any issues?)
- [ ] Share metrics with team
```

---

## 🎓 Quick Learning Path

**Day 1:** Read this cheat sheet (5 min)  
**Day 2:** Read [INTERNAL_USER_GUIDE.md](../docs/INTERNAL_USER_GUIDE.md) (10 min)  
**Day 3:** Copy example & create first skill (15 min)  
**Week 1:** Use for 1-2 real tasks  
**Week 2:** Share with team & help others  
**Week 3+:** Optimize & suggest improvements  

---

## 🤝 Sharing with Team

```bash
# Create
vi skills/my_skill.py

# Test locally
python test_my_skill.py

# Share
git add skills/my_skill.py
git commit -m "Add email classifier skill"
git push

# Team uses it
from skills.my_skill import my_skill
result = my_skill.execute(data)
```

---

## 💡 Pro Tips

✅ **Do:**
- Start simple (R0 or R1)
- Set validation rules
- Check metrics weekly
- Document what you did
- Ask team for feedback

❌ **Don't:**
- Skip input validation
- Choose risk level too low
- Ignore error messages
- Use magic numbers (use enums)
- Deploy without testing

---

## 📞 Quick Reference

| I need | Where | Time |
|--------|-------|------|
| Quick start | INTERNAL_USER_GUIDE.md | 10 min |
| Detailed guide | QUICK_START_INTERNAL.md | 30 min |
| Examples | examples/ folder | 5 min |
| Risk explanation | QUICK_START_INTERNAL.md | 5 min |
| API docs | sdk/skill.py | varies |
| Help | Slack #cvf-team | depends |

---

## 🎯 Today's Task

1. **Read this sheet** (5 min)
2. **Copy template** from "5-Minute Skill Template"
3. **Create first skill** (15 min)
4. **Test it** (5 min)
5. **Share with team** (2 min)

**Total: 30 minutes to first working skill**

---

**Version:** 1.0-internal  
**Last Updated:** Jan 29, 2026  
**Status:** Ready to use ✅

Print this page → Keep on desk → Reference when needed
