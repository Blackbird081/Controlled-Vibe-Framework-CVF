# CVF - Getting Started for Your Team

**Version:** 1.0-internal  
**For:** Internal Company Use  
**Time to Read:** 10 minutes  
**Time to Use:** 15 minutes to first working skill

---

## What is CVF?

CVF helps you **control AI output quality** in your code without overthinking.

### Problems it solves:

❌ **Before CVF:**
```python
# Hope AI output is correct
result = call_ai("classify this email")
send_email(result)  # 🤞 Fingers crossed
```

✅ **With CVF:**
```python
# Know for sure
result = skill.execute({"email": email_text})
# Automatically checks:
# - Input format correct?
# - Output has required fields?
# - Confidence high enough?
# - Keep audit trail?
print(result)  # ✅ Safe to use
```

---

## Installation (2 minutes)

### Step 1: Get the code

```bash
# If using Git
git clone <internal-cvf-repo> cvf
cd cvf

# Or just copy to your project
cp -r cvf/ your-project/
```

### Step 2: Install (optional, if needed)

```bash
# If you have a requirements.txt
pip install -r CVF/requirements.txt

# Otherwise, just import (uses Python stdlib only)
from cvf import Skill, SkillContract, RiskLevel
```

**Done!** No complicated setup.

---

## Your First Skill (5 minutes)

Let's make a **customer sentiment analyzer**:

### Step 1: Create the file

```bash
touch my_sentiment_skill.py
```

### Step 2: Write the code

```python
# my_sentiment_skill.py
from cvf import Skill, SkillContract, RiskLevel, IOSpec

# Step A: Define inputs (what goes in?)
input_spec = IOSpec(
    schema={"text": str},
    examples=[
        {"text": "This product is amazing!"},
        {"text": "Terrible service, very upset"}
    ]
)

# Step B: Define outputs (what comes out?)
output_spec = IOSpec(
    schema={
        "sentiment": str,  # "positive", "negative", "neutral"
        "confidence": float,  # 0.0 to 1.0
        "keywords": [str]
    },
    examples=[
        {
            "sentiment": "positive",
            "confidence": 0.98,
            "keywords": ["amazing", "great"]
        }
    ]
)

# Step C: Create the skill contract
contract = SkillContract(
    id="sentiment-analyzer-v1",
    name="Sentiment Analyzer",
    description="Analyze customer sentiment from text",
    
    input_spec=input_spec,
    output_spec=output_spec,
    
    risk_level=RiskLevel.R1,  # Auto-run with basic checks
    
    # Check confidence is high enough
    validation_rules=[
        "confidence >= 0.7",  # No low-confidence guesses
        "sentiment in ['positive', 'negative', 'neutral']"
    ],
    
    # If something goes wrong, flag for review
    fallback_action="flag_for_review"
)

# Step D: Create and use the skill
sentiment_skill = Skill(contract)

# Test it
result = sentiment_skill.execute({
    "text": "Your support team saved my day!"
})

print(result)
# Output:
# {
#   "sentiment": "positive",
#   "confidence": 0.96,
#   "keywords": ["support", "team", "saved", "day"],
#   "approved": true,
#   "audit_id": "sentiment-analyzer-20260129-001"
# }
```

### Step 3: Use it in your project

```python
# main.py
from my_sentiment_skill import sentiment_skill

# Get customer feedback
feedback = "Love your product!"

# Analyze
result = sentiment_skill.execute({"text": feedback})

if result["approved"]:
    print(f"Sentiment: {result['sentiment']} ({result['confidence']*100:.0f}%)")
    # → "Sentiment: positive (97%)"
else:
    print("⚠️ Needs review")
```

**That's it!** You have a working skill with built-in quality control.

---

## When to Use Each Risk Level

**Choose the right level for your situation:**

### R0 - Fully Automatic (No Control Needed)

Use when: No risk if AI makes a mistake

Example:
```python
# Generate random team motivation quote
contract = SkillContract(
    id="motivation-quote",
    risk_level=RiskLevel.R0,  # ← Just run it
    # No validation rules needed
)
```

### R1 - Auto + Quick Check (Most Common)

Use when: Low risk, but want to catch obvious mistakes

Example:
```python
# Classify emails
contract = SkillContract(
    id="email-classifier",
    risk_level=RiskLevel.R1,
    validation_rules=[
        "confidence >= 0.8",
        "category in ['spam', 'work', 'personal']"
    ]
)
```

**Use this most of the time.**

### R2 - Needs Human Review (Careful!)

Use when: Medium risk, need someone to check before using

Example:
```python
# Draft customer response
contract = SkillContract(
    id="customer-reply",
    risk_level=RiskLevel.R2,
    review_required=True,  # ← Needs manager approval
    review_instructions="Check tone and accuracy"
)
```

### R3 - Information Only (Safe Guard)

Use when: High risk, AI just provides info

Example:
```python
# Medical symptom information
contract = SkillContract(
    id="symptom-info",
    risk_level=RiskLevel.R3,
    mandatory_disclaimers=[
        "NOT a diagnosis",
        "See a doctor"
    ]
)
```

**Simple rule:**
- **Automatic action?** → R0 or R1
- **Someone reviews first?** → R2
- **Just information?** → R3

---

## Using Your Skill

### Basic Usage

```python
# Create skill (do this once)
skill = Skill(contract)

# Execute (do this every time)
result = skill.execute({"text": "Customer feedback"})

# Check if approved
if result["approved"]:
    use_result(result)
else:
    flag_for_review(result)
```

### Check Metrics

```python
# How many times did it run?
print(f"Total executions: {skill.execution_count()}")

# What's the success rate?
print(f"Success rate: {skill.success_rate()}%")

# How confident is it?
print(f"Average confidence: {skill.avg_confidence()}")

# Any failures?
failures = skill.get_failed_executions()
if failures:
    print(f"⚠️ {len(failures)} failures to review")
```

### See Audit Trail

```python
# What happened?
for execution in skill.get_audit_log():
    print(f"Time: {execution.timestamp}")
    print(f"Input: {execution.input}")
    print(f"Output: {execution.output}")
    print(f"Status: {execution.status}")
    print()
```

---

## Common Patterns

### Pattern 1: Classify Something

```python
contract = SkillContract(
    id="classify-support-tickets",
    name="Support Ticket Classifier",
    input_spec={"ticket_content": str},
    output_spec={"category": str, "priority": str, "confidence": float},
    risk_level=RiskLevel.R1,
    validation_rules=[
        "confidence >= 0.85",
        "category in ['bug', 'feature', 'support']",
        "priority in ['low', 'medium', 'high']"
    ]
)
```

### Pattern 2: Generate Something (with Review)

```python
contract = SkillContract(
    id="generate-email-draft",
    name="Email Draft Generator",
    input_spec={"customer_issue": str},
    output_spec={"draft": str, "tone": str},
    risk_level=RiskLevel.R2,  # Always review
    review_required=True,
    review_instructions="Check tone matches company voice"
)
```

### Pattern 3: Extract Data

```python
contract = SkillContract(
    id="extract-invoice-data",
    name="Invoice Data Extractor",
    input_spec={"invoice_text": str},
    output_spec={"amount": float, "date": str, "vendor": str},
    risk_level=RiskLevel.R1,
    validation_rules=[
        "amount > 0",
        "date matches YYYY-MM-DD"
    ]
)
```

### Pattern 4: Analyze Sentiment

```python
contract = SkillContract(
    id="sentiment-analyzer",
    name="Sentiment Analyzer",
    input_spec={"text": str},
    output_spec={"sentiment": str, "confidence": float},
    risk_level=RiskLevel.R1,
    validation_rules=[
        "sentiment in ['positive', 'negative', 'neutral']",
        "confidence >= 0.7"
    ]
)
```

---

## Debugging

### "It says validation failed"

```
❌ Error: Output validation failed
   Expected: confidence >= 0.7
   Got: confidence = 0.45
```

**Fix:**
```python
# Option 1: Lower the bar (if OK)
validation_rules=["confidence >= 0.5"]

# Option 2: Better prompt to AI
# Option 3: Try different model
```

### "It's taking too long"

```
⏱️ Warning: Execution took 5s (normal: 1s)
```

**Fix:**
```python
# Check if network is slow
# Check if AI model is overloaded
# Switch to faster model
```

### "How do I check what went wrong?"

```python
# Get the error
error = skill.get_latest_error()
print(error.message)
print(error.input)
print(error.traceback)
```

---

## Team Workflow

### Step 1: Someone Creates a Skill

```python
# alice@company.com
# skills/email_classifier.py
contract = SkillContract(...)
```

### Step 2: Commit & Share

```bash
git add skills/email_classifier.py
git commit -m "Add email classifier skill"
git push origin feature/email-classifier
```

### Step 3: Team Imports

```python
# bob@company.com
from skills.email_classifier import email_skill

result = email_skill.execute({"email": text})
```

### Step 4: Monitor Together

```python
# Alice checks dashboard weekly
skill.show_audit_log()
print(email_skill.success_rate())
```

---

## Next Steps

1. **Read:** [QUICK_START_INTERNAL.md](QUICK_START_INTERNAL.md) (5 min)
2. **Copy:** `examples/r1_with_check.py` to start
3. **Create:** Your first skill (15 min)
4. **Test:** Run it locally
5. **Share:** Commit to Git
6. **Monitor:** Check metrics weekly

---

## Questions?

- 💬 Slack: #cvf-team
- 📧 Email: cvf-team@company.com
- 📚 See: [QUICK_START_INTERNAL.md](QUICK_START_INTERNAL.md)

---

**Version:** 1.0-internal  
**Last Updated:** January 29, 2026  
**Status:** Ready to use ✅
