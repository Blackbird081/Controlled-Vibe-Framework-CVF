# CVF for Enterprise

**Target:** Organizations with 10+ developers and compliance requirements  
**Reading time:** 20 minutes  
**Recommended:** v1.1 + v1.2 + v1.3 + v1.6

---

## Why CVF for Enterprise?

AI is already in your organization. Developers are using ChatGPT, Copilot, and Claude daily. The question isn't "should we allow AI?" — it's "how do we govern it?"

| Enterprise Need | CVF Solution |
|----------------|-------------|
| **Governance** — Who can do what | Authority Matrix: 4 roles × 4 phases |
| **Auditability** — Trace decisions | Action Unit logs + Decision Records |
| **Risk management** — Contain blast radius | R0–R3 risk levels with phase gates |
| **Compliance** — Meet regulatory needs | Governance Toolkit (7 modules) |
| **Standardization** — Consistent AI usage | Agent Archetypes + Skill Library |
| **Reusability** — Don't reinvent the wheel | 114 pre-built skills + team skills |

---

## Deployment Roadmap (4 Weeks)

### Week 1: Assessment & Planning

**Tasks:**

1. **Survey AI usage** across teams
   - Which tools are used? (Copilot, ChatGPT, Claude, Cursor)
   - What are they used for? (Code gen, reviews, docs, testing)
   - What problems have occurred? (Bugs, security issues, scope creep)

2. **Define governance policy**

```markdown
# Company XYZ — CVF Governance Policy

## Roles
| CVF Role | Maps To | Count |
|----------|---------|-------|
| OBSERVER | Junior devs, interns | ~30% |
| BUILDER | Regular devs | ~50% |
| ARCHITECT | Senior devs, tech leads | ~15% |
| GOVERNOR | VP Eng, Security team | ~5% |

## Risk Levels
| Level | Definition | Approval Required |
|-------|-----------|-------------------|
| R0 | Read-only, formatting, summarization | None |
| R1 | Internal code, single service, bounded | Peer review |
| R2 | Cross-service, auth, data, payments | ARCHITECT |
| R3 | Infrastructure, deploy, external APIs | GOVERNOR + Security |

## Phase Gates
| Transition | Gate | Approver |
|-----------|------|----------|
| A → B | Intent review | Self-service |
| B → C | Design approval | ARCHITECT (for R2+) |
| C → D | Code review + Phase D checklist | Peer (any BUILDER) |
| D → Production | Final review | GOVERNOR (for R2+) |
```

3. **Select pilot team** (5–7 devs, 1 project, 4 weeks)

**Deliverables:** Governance policy, risk matrix, pilot team selected.

---

### Week 2: Pilot Infrastructure

**Tasks:**

1. **Deploy Governance Toolkit**

```bash
# Clone CVF
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git

# Copy governance toolkit to your monorepo/shared config
cp -r governance/ your-org-repo/governance/
```

The Governance Toolkit contains 7 modules:

```
governance/toolkit/
├── 01_BOOTSTRAP/        # System prompts, project initialization
├── 02_POLICY/           # Master policy, risk matrix, versioning
├── 03_CONTROL/          # Authority matrix, phase gates, registry
├── 04_TESTING/          # UAT, Self-UAT, test specs
├── 05_OPERATION/        # Continuous governance, audit, incident
├── 06_EXAMPLES/         # Real-world case studies
└── 07_QUICKSTART/       # Quick start for SME
```

2. **Set Up Web UI (v1.6)**

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
cp .env.example .env.local

# Configure with company-approved AI providers
echo "OPENAI_API_KEY=sk-..." >> .env.local
echo "DEFAULT_AI_PROVIDER=openai" >> .env.local

npm install
npm run build
npm start
```

Deploy to internal infrastructure (see [Deployment Guide](../CVF_HOSTED_DEPLOYMENT_GUIDE_V1_6.md) for Vercel/Netlify/Docker options).

3. **Customize Authority Matrix**

Edit `governance/toolkit/03_CONTROL/CVF_PHASE_AUTHORITY_MATRIX.md`:

| Phase | OBSERVER | BUILDER | ARCHITECT | GOVERNOR |
|-------|----------|---------|-----------|----------|
| Discovery | Read, Propose | Read, Propose, Document | Full access | Full access |
| Design | Read | Read, Propose design | Approve design | Override |
| Build | Read | Execute (R0-R1) | Execute (R0-R2), Approve R2 | All access |
| Review | Read | Self-review | Review others, Approve | Final approval |

4. **Train pilot team** (4-hour workshop)

**Workshop agenda:**
- Hour 1: CVF philosophy ("Outcome > Code", 4 phases)
- Hour 2: Hands-on: Write first INPUT_SPEC + use Phase D checklist
- Hour 3: Risk levels, governance, roles
- Hour 4: Web UI demo + Skill Library walkthrough

---

### Week 3–4: Pilot Execution

**Pilot project requirements:**
- Real project (not a toy)
- 4-week timeline
- Clear deliverables
- Measurable outcomes

**Metrics to track:**

| Metric | Baseline | Target |
|--------|----------|--------|
| Time to first working code | Measure | -20% |
| Bugs found in review | Measure | -30% |
| Phase gate compliance | 0% | >90% |
| R3 incidents | Measure | 0 |
| Developer satisfaction | Survey | ≥4/5 |

**Weekly check-ins:**
- Is governance adding value or just friction?
- Are phase gates too heavy or too light?
- Which skills are being used? Which are missing?
- Any governance workarounds? (= policy needs adjusting)

**Pilot success criteria:**
- ✅ 90%+ phase gate compliance
- ✅ Zero R3 security incidents
- ✅ Team satisfaction ≥ 4/5
- ✅ Measurable quality improvement

---

## Governance Toolkit Deep Dive

### Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| **Master Policy** | `02_POLICY/CVF_MASTER_POLICY.md` | Top-level governance rules |
| **Authority Matrix** | `03_CONTROL/CVF_PHASE_AUTHORITY_MATRIX.md` | Who can do what, when |
| **Risk Matrix** | `02_POLICY/CVF_RISK_MATRIX.md` | R0–R3 with blast radius |
| **Self-UAT** | `04_TESTING/CVF_AGENT_UAT.md` | Agent quality testing |
| **Audit Protocol** | `05_OPERATION/CVF_AUDIT_PROTOCOL.md` | Compliance auditing |
| **Continuous Governance** | `05_OPERATION/CONTINUOUS_GOVERNANCE_LOOP.md` | Ongoing monitoring |

### Self-UAT (User Acceptance Testing)

Every AI interaction can be scored across 6 categories:

| Category | What It Tests |
|----------|--------------|
| **Instruction** | Did AI follow the spec? |
| **Context** | Did AI use provided context correctly? |
| **Output** | Is output format and quality correct? |
| **Risk** | Did AI stay within authorized risk level? |
| **Handshake** | Did AI communicate properly (ask when unclear)? |
| **Audit** | Can the interaction be traced and reviewed? |

**Result:** Pass / Fail per category, with evidence.

### Continuous Governance Loop

**"Governance is a loop, not an event."**

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Define Policy → Apply Gates → Execute → Audit → Learn  │
│       ↑                                            │     │
│       └────────────────────────────────────────────┘     │
│                                                          │
│  Drift detection: Re-apply on schedule or trigger        │
│  Periodic re-UAT: Weekly for active projects             │
│  Policy updates: Monthly review, version-controlled      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Integration with Existing Tools

### GitHub / GitLab Integration

**PR Template** (`.github/PULL_REQUEST_TEMPLATE.md`):

```markdown
## CVF Compliance

### Spec
- [ ] INPUT_SPEC.md attached or linked
- [ ] Risk level: R__ (0/1/2/3)

### Phase D Review
- [ ] Output matches INPUT_SPEC requirements
- [ ] Acceptance criteria met
- [ ] No scope expansion
- [ ] Tests passing

### Governance
- [ ] ARCHITECT approval (if R2+)
- [ ] AU trace included
- [ ] Decision(s) logged (if applicable)
```

**GitHub Actions** (CI/CD validation):

```yaml
name: CVF Compliance Check
on: [pull_request]

jobs:
  cvf-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate specs
        run: |
          # Check INPUT_SPEC exists for feature branches
          if [[ "${{ github.head_ref }}" == feature/* ]]; then
            if [ ! -f specs/INPUT_SPEC.md ]; then
              echo "::error::Feature branch requires INPUT_SPEC.md"
              exit 1
            fi
          fi

      - name: Validate contracts (v1.2+)
        if: hashFiles('contracts/*.yaml') != ''
        run: |
          pip install pyyaml
          python cli/cvf_validate.py --all contracts/
```

### Jira / Project Management

Map CVF phases to Jira workflow:

| Jira Status | CVF Phase | Transition Rule |
|-------------|-----------|-----------------|
| To Do | — | — |
| Discovery | Phase A | Assignee writes INPUT_SPEC |
| Design | Phase B | INPUT_SPEC approved → design |
| In Progress | Phase C | Design approved → build |
| Review | Phase D | Code + Phase D checklist |
| Done | Accepted | All checks pass |

**Custom fields:**

| Field | Type | Values |
|-------|------|--------|
| CVF Risk Level | Dropdown | R0, R1, R2, R3 |
| CVF Phase | Dropdown | Discovery, Design, Build, Review |
| CVF Spec Link | URL | Link to INPUT_SPEC.md |
| CVF Approval | User | ARCHITECT / GOVERNOR |

---

## Scaling to 100+ Developers

### Organizational Structure

```
VP Engineering (GOVERNOR)
├── Platform Team (maintains CVF infrastructure)
│   ├── CVF toolkit updates
│   ├── Shared skill library (global skills)
│   └── CI/CD integration
│
├── Security Team (reviews R2+ changes)
│   ├── Risk assessment
│   └── Audit compliance
│
└── Product Teams (10-15 devs each)
    ├── Team Lead (ARCHITECT)
    ├── Senior Devs (ARCHITECT)
    ├── Regular Devs (BUILDER)
    └── Juniors (OBSERVER)
```

### Skill Library Governance

| Scope | Maintained By | Examples | Review Cycle |
|-------|--------------|---------|-------------|
| **Global** | Platform Team | Auth, logging, monitoring, error handling | Monthly |
| **Domain** | Product Teams | Payments, user management, analytics | Quarterly |
| **Team** | Individual Teams | Team-specific patterns | As needed |

**Lifecycle:**
```
PROPOSED → APPROVED → ACTIVE → DEPRECATED → RETIRED
```

All skill changes version-controlled, require PR review.

### Metrics Dashboard

Track these KPIs across the organization:

```
CVF Compliance Dashboard
─────────────────────────────────────
Phase gate compliance:        94%  (target: >90%)
R3 incidents this quarter:     0   (target: 0)
Skills in library:           247   (42 global, 205 domain)
Avg time to Phase D:         4.2d  (baseline: 6.1d)
Developer satisfaction:      4.3/5 (target: >4.0)
Governance bypass attempts:    2   (auto-detected by CI)
─────────────────────────────────────
```

---

## Case Study: Fintech Company (120 Devs)

### Before CVF
- Inconsistent AI usage (some teams ban it, others use freely)
- Security incidents: 3 per quarter
- Code review bottleneck: 2–3 days average
- Knowledge silos (can't reuse across teams)

### After CVF (6 Months)
- Standardized: all teams use CVF v1.1 + Governance Toolkit
- Security incidents: **0** (R3 gate prevented issues)
- Code review: **<1 day** (Phase D checklist pre-validates)
- Skill reuse: **62%** of new features use existing skills

### ROI
| Metric | Before | After | Improvement |
|--------|--------|-------|:-----------:|
| Time per feature | 6.1 days | 4.2 days | **-31%** |
| Bugs in production | 12/quarter | 7/quarter | **-42%** |
| Code review time | 2.5 days | 0.8 days | **-68%** |
| Developer satisfaction | 3.1/5 | 4.3/5 | **+39%** |

---

## Common Enterprise Concerns

**Q: How do we enforce CVF compliance?**  
A: Three layers:
1. **Technical:** CI/CD gates block PRs without Phase D checklist
2. **Social:** PR templates make CVF easier than not using it
3. **Audit:** Quarterly governance review (see `05_OPERATION/CVF_AUDIT_PROTOCOL.md`)

**Q: What if developers bypass CVF?**  
A: Make the CVF path the path of least resistance. If bypass is common, your governance is too heavy — simplify it.

**Q: How much overhead does CVF add?**  
A: Initial: 10–15% (learning curve). After 4 weeks: net positive (faster reviews, less rework). After 3 months: 20–30% time savings (skill reuse, fewer bugs).

**Q: Can we customize CVF?**  
A: Yes. CVF is CC BY-NC-ND 4.0 licensed for non-commercial use. Customize policies, risk levels, phase gates, authority matrix. Fork the Governance Toolkit and adapt to your org.

**Q: Does CVF replace our existing SDLC?**  
A: No. CVF layers on top of your existing process. It specifically governs the AI-assisted portions of your workflow.

**Q: How do we handle multi-language teams?**  
A: CVF v1.6 supports English and Vietnamese. Core specs (INPUT_SPEC, OUTPUT_SPEC) should be in your team's primary language. The framework is language-agnostic.

---

## Enterprise Support

**Open Source (Free):**
- CVF is CC BY-NC-ND 4.0 licensed (non-commercial)
- Community support via GitHub Issues
- Full documentation in this repo

**Getting Started:**
1. Clone this repo
2. Read the [Governance Toolkit](../../governance/)
3. Follow this guide to run a pilot
4. Iterate based on results

---

## Next Steps

- 📖 [Understand Governance Model in Detail](../concepts/governance-model.md)
- 📊 [Deep Dive: Risk Model](../concepts/risk-model.md)
- 🛠️ [Set Up Web UI for Teams](../tutorials/web-ui-setup.md)
- 🧪 [Create Custom Skills](../tutorials/custom-skills.md)
- 📋 [See Case Studies](../case-studies/)
- 📐 [Architecture Diagrams](../CVF_ARCHITECTURE_DIAGRAMS.md)

---

*Last updated: February 15, 2026 | CVF v1.6*
