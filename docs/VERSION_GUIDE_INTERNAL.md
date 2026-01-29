# CVF Version Guide - Which One to Use?

**TL;DR:** For internal team use → Use **v1.3** (everything is already integrated)

---

## 🎯 Simple Decision Tree

```
Q: Do you have a team using AI?
├─ YES, and we need to control quality
│  └─ Use: v1.3-internal (this one)
│     Features: Everything built-in
│     Time to setup: 15 minutes
│     Cost: Free (internal tool)
│
└─ NO / Just learning
   └─ Start with v1.0
      Features: Basic concepts
      Time to learn: 1 hour
      Then upgrade to v1.3 when ready
```

---

## 📊 Version Comparison

| Feature | v1.0 | v1.1 | v1.2 | **v1.3-internal** |
|---------|:----:|:----:|:----:|:---------:|
| **Core concept** | ✅ | ✅ | ✅ | ✅ |
| **Phase-based planning (A→D)** | ✅ | ✅ | ✅ | ✅ |
| Input/Output spec | ❌ | ✅ | ✅ | ✅ |
| Risk levels (R0-R3) | ❌ | ❌ | ✅ | ✅ |
| **Python SDK** | ❌ | ❌ | ❌ | ✅ |
| **CLI Tools** | ❌ | ❌ | ❌ | ✅ |
| **Monitoring Dashboard** | ❌ | ❌ | ❌ | ✅ |
| **Certification Program** | ❌ | ❌ | ❌ | ✅ |
| **Audit Trail** | ❌ | ✅ | ✅ | ✅ |
| Governance framework | ❌ | ❌ | ✅ | ✅ |
| **Team Examples** | ❌ | ❌ | ❌ | ✅ |
| **Ready to use** | ⚠️ | ⚠️ | ⚠️ | ✅ |

---

## 🎓 Each Version Explained

### v1.0 - "Vibe Coding Foundation"

**What it is:** Core philosophy of CVF

**Best for:** Learning the basics

**Features:**
- Phase-based workflow (Discovery → Design → Build → Review)
- Outcome-focused thinking
- Governance principles

**Example:**
```
Project starts → Phase A (discover) → Phase B (design) 
→ Phase C (build) → Phase D (review) → Done
```

**When to use:**
- Teaching newcomers the philosophy
- Small projects without strict controls
- Personal projects

**Not recommended for:** Team projects needing quality control

---

### v1.1 - "Input/Output Control"

**What it is:** v1.0 + structured input/output requirements

**Best for:** Teams that need to verify data shape

**Features:**
- Input specification (what goes in)
- Output specification (what comes out)
- Validation rules
- Audit trail

**Example:**
```python
Input: Must be {"email": str, "name": str}
Output: Must be {"approved": bool, "reason": str}
✅ Validated automatically
```

**When to use:**
- Structured data processing
- Need to verify format
- Compliance requirements

**Not recommended for:** Things change frequently

---

### v1.2 - "Skill & Governance"

**What it is:** v1.1 + Skill contracts + Risk management

**Best for:** Organizations with strict controls

**Features:**
- Skill contracts (formalized AI tasks)
- Risk levels (R0-R3 classification)
- Skill registry (catalog of approved skills)
- External skill integration
- Audit everything

**Example:**
```python
Skill = {
  id: "classify-email",
  risk_level: R1,  # Low risk, auto with checks
  contract: {...validated...},
  registry: {...public...}
}
```

**When to use:**
- Large teams needing governance
- Regulated industries (finance, healthcare)
- Need skill marketplace

**Not recommended for:** Simple projects, moving fast

---

### v1.3-internal ✅ - "Complete Internal Toolkit"

**What it is:** v1.2 + everything integrated + team-ready

**Best for:** Your team RIGHT NOW

**Features:**
- ✅ All v1.2 features
- ✅ Python SDK (ready to use)
- ✅ CLI tools (command-line validation)
- ✅ Working examples (copy & paste)
- ✅ Monitoring dashboard (see what's happening)
- ✅ Certification program (train your team)
- ✅ RFC process (improve together)
- ✅ 74+ tests passing (already validated)

**Example:**
```python
from cvf import Skill, SkillContract, RiskLevel

# Create
contract = SkillContract(...risk_level=RiskLevel.R1...)

# Use
skill = Skill(contract)
result = skill.execute(data)

# Monitor
skill.success_rate()
skill.show_audit_log()

# Done!
```

**When to use:**
- ✅ Team projects
- ✅ Controlling AI output
- ✅ Need audit trail
- ✅ Want monitoring
- ✅ Need certification

**This is what you should use.**

---

## 🚀 How to Choose

### Scenario 1: "We have a small team, moving fast"

→ **Use v1.3-internal**

**Why:**
- Quick to setup (15 min)
- Built-in safeguards (no extra work)
- Easy to share with team
- Monitoring included

```python
# 15 minutes and you're done
from cvf import Skill, SkillContract, RiskLevel
contract = SkillContract(...risk_level=RiskLevel.R1...)
skill = Skill(contract)
result = skill.execute(data)
```

---

### Scenario 2: "We need to learn CVF first"

→ **Start with v1.0, then upgrade to v1.3**

**Path:**
1. Read v1.0 philosophy (1 hour)
2. Understand phases A→D
3. Learn when to use what
4. Then move to v1.3 (which has all the tools)

---

### Scenario 3: "We're in regulated industry (finance, healthcare)"

→ **Use v1.3-internal (it's what you need)**

**Features that help:**
- ✅ Audit trail (who did what)
- ✅ Risk classification (R0-R3)
- ✅ Validation rules
- ✅ Certification program
- ✅ Monitoring dashboard

---

### Scenario 4: "We want to understand everything deeply"

→ **Read all versions in order: v1.0 → v1.1 → v1.2 → v1.3**

**Time investment:** 4-6 hours  
**Benefit:** Deep understanding, can contribute improvements

---

## 📈 Version Evolution

```
v1.0 (Philosophy)
  ↓
v1.1 (Input/Output Control)
  ↓
v1.2 (Risk Management + Skills)
  ↓
v1.3-internal (Complete + Ready)  ← START HERE
  ↓
v1.3+ (If you go public, optional)
```

**You don't need v1.0-v1.2 if you start with v1.3.**  
They're there if you want to understand the history.

---

## 📁 File Locations

```
CVF/
├── v1.0/                              # Philosophy
├── v1.1/                              # Input/output control
├── v1.2/ (in EXTENSIONS/)             # Risk management
└── v1.3/ (in EXTENSIONS/)             # ✅ Complete toolkit
    ├── README_INTERNAL.md             # Start here!
    ├── sdk/                           # Python code
    ├── examples/                      # Copy these
    ├── dashboard/                     # Monitoring
    ├── certification/                 # Training
    └── docs/                          # All docs
```

---

## ✅ Checklist: Ready to Use v1.3?

- [ ] Read [INTERNAL_USER_GUIDE.md](../docs/INTERNAL_USER_GUIDE.md) (10 min)
- [ ] Read [QUICK_START_INTERNAL.md](../docs/QUICK_START_INTERNAL.md) (20 min)
- [ ] Copy `examples/r1_with_check.py`
- [ ] Create your first skill (15 min)
- [ ] Test it locally
- [ ] Share with team
- [ ] Monitor weekly
- [ ] Done! 🎉

**Total time:** About 1 hour to fully productive

---

## 🎯 Recommendation

**For your team right now:** Use **v1.3-internal**

**Why:**
1. ✅ Already built and tested
2. ✅ Everything integrated
3. ✅ Ready to use immediately
4. ✅ Includes team tools (dashboard, certification)
5. ✅ Good for 3-6 month evaluation period
6. ✅ Can make public later if you want

**Don't use older versions unless:**
- You want to understand the philosophy (v1.0)
- You want to start small and grow (v1.1)
- You have specific governance needs (v1.2)

---

## 📞 Questions?

- "Which version should I use?" → **v1.3-internal** (this one)
- "Where do I start?" → [INTERNAL_USER_GUIDE.md](../docs/INTERNAL_USER_GUIDE.md)
- "How do I use it?" → [QUICK_START_INTERNAL.md](../docs/QUICK_START_INTERNAL.md)
- "Is it ready?" → **Yes, it's been tested by the team**

---

**Recommendation:** v1.3-internal  
**Time to setup:** 15 minutes  
**Time to first skill:** 15 more minutes  
**Status:** ✅ Ready to use
