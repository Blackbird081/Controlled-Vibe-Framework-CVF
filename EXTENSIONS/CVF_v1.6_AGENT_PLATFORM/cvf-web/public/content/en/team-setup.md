# CVF for Teams

**Target:** Teams of 2–10 developers working with AI  
**Reading time:** 15 minutes  
**Recommended:** v1.1 (governance) + v1.3 (toolkit) + v1.6 (web UI)

---

## Why CVF for Teams?

When multiple people code with AI, new problems emerge:

| Solo Problem | Team Problem | CVF Solution |
|-------------|-------------|-------------|
| Scope creep | Everyone's AI adds different features | Frozen specs (INPUT_SPEC) |
| Lost context | No one knows what others' AI did | Action Unit traces |
| Code debt | Inconsistent coding styles across devs | Agent archetypes + presets |
| Wasted time | Re-solving solved problems | Shared Skill Library |
| No review | "It works" = good enough | Phase D + Phase gates |

CVF gives your team a **shared language** for working with AI, without adding heavy process.

---

## Team Setup (30 Minutes)

### Step 1: Clone & Configure

```bash
# Clone CVF
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git

# Copy governance toolkit to your project
cp -r Controlled-Vibe-Framework-CVF/governance/ your-team-repo/governance/

# Copy useful templates
cp -r Controlled-Vibe-Framework-CVF/v1.1/templates/ your-team-repo/templates/
```

### Step 2: Set Up Project Structure

Every team project should have:

```
your-project/
├── specs/
│   ├── INPUT_SPEC.md          ← Project requirements
│   └── OUTPUT_SPEC.md         ← Acceptance criteria
├── decisions/
│   ├── DECISION_LOG.md        ← Architecture choices
│   └── ADR-001.md             ← Individual decisions
├── traces/
│   ├── AU-001-auth.md         ← What AI did for auth
│   └── AU-002-api.md          ← What AI did for API
├── contracts/                  ← (v1.2+) Skill contracts
├── governance/
│   └── TEAM_POLICY.md         ← Your team rules
└── src/
```

### Step 3: Define Team Roles

CVF defines 4 core roles. Map them to your team:

| CVF Role | Team Member | Responsibilities |
|----------|-------------|-----------------|
| **OBSERVER** | Junior devs, interns | Can read, learn, propose ideas |
| **BUILDER** | Regular devs | Can execute tasks, create code with AI |
| **ARCHITECT** | Senior devs, tech leads | Can approve designs, set risk levels |
| **GOVERNOR** | Team lead, VP Eng | Can approve high-risk changes, set policy |

> **One person can hold multiple roles** if your team is small. Just be explicit about which hat you're wearing.

### Step 4: Configure Governance Level

Choose your governance mode:

| Mode | When to Use | Overhead |
|------|------------|----------|
| **Simple** | Small team (2-3), low stakes | ~5 min/task |
| **Rules** | Medium team (4-7), production code | ~15 min/task |
| **Full CVF** | Large team (8+), compliance needed | ~30 min/task |

**Simple mode (recommended to start):**

```markdown
# TEAM_POLICY.md

## Governance Mode: Simple

### Rules
1. Every task needs an INPUT_SPEC before AI execution
2. Every PR needs Phase D checklist completed
3. Decisions that affect architecture → Decision Log
4. High-risk changes (infrastructure, auth, data) → ARCHITECT approval

### Phase Gates
- Phase A → B: Self-service (just write the spec)
- Phase B → C: Peer review of design (any BUILDER)
- Phase C → D: Self-review with checklist
- Phase D → Merge: PR review by someone who didn't write it
```

---

## Team Workflow

### Daily Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Developer picks task from backlog                          │
│  ↓                                                          │
│  Phase A: Write INPUT_SPEC (what + acceptance criteria)     │
│  ↓                                                          │
│  Phase B: Design approach (reviewed by peer)                │
│  ↓                                                          │
│  Phase C: Execute with AI (follow frozen spec)              │
│  ↓                                                          │
│  Phase D: Self-review with checklist                        │
│  ↓                                                          │
│  Create PR with:                                            │
│    • Code                                                   │
│    • INPUT_SPEC.md                                          │
│    • Phase D checklist (completed)                          │
│    • AU trace (what AI did)                                 │
│  ↓                                                          │
│  Reviewer checks: code + spec compliance + governance       │
│  ↓                                                          │
│  Merge                                                      │
└─────────────────────────────────────────────────────────────┘
```

### PR Template

Add this to `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## CVF Checklist

### Phase D Review
- [ ] Output matches INPUT_SPEC requirements
- [ ] Acceptance criteria met (list each)
- [ ] No scope expansion beyond spec
- [ ] Error handling covers edge cases
- [ ] Tests written and passing

### Governance
- [ ] Risk level identified: R__
- [ ] ARCHITECT approval (if R2+): @___
- [ ] Decision(s) logged (if applicable)
- [ ] AU trace attached

### Reviewer Notes
<!-- What the reviewer should focus on -->
```

---

## Shared Skill Library

### Why a Team Skill Library?

Instead of each developer writing prompts from scratch, create reusable skills:

```
your-project/skills/
├── auth-integration.skill.md
├── api-endpoint.skill.md
├── database-migration.skill.md
├── react-component.skill.md
└── test-suite.skill.md
```

### Creating a Team Skill

```markdown
# Skill: API Endpoint

**Version:** 1.0.0
**Owner:** @your-name
**Risk:** R1 (controlled, no external impact)
**Difficulty:** ⭐⭐ Medium

## Prerequisites
- Express/Fastify server running
- Database schema defined
- Authentication middleware configured

## Input (Fill This Form)
| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| Endpoint path | ✅ | RESTful path | `/api/users/:id` |
| HTTP method | ✅ | GET/POST/PUT/DELETE | `GET` |
| Input params | ✅ | Query/body/path params | `id: string (path)` |
| Response format | ✅ | Expected JSON shape | `{ user: { name, email } }` |
| Auth required | ✅ | Who can access | `authenticated users` |
| Error cases | ✅ | Expected errors | `404 Not Found, 403 Forbidden` |

## Expected Output
- Route handler file
- Input validation (Zod/Joi schema)
- Error handling middleware
- Unit tests (≥3 cases)

## Acceptance Checklist
- [ ] Correct HTTP method and path
- [ ] Input validation present
- [ ] Auth middleware applied
- [ ] All error cases handled
- [ ] Tests cover happy path + error cases
- [ ] Response matches specified format
```

### Assigning Skill Ownership

| Skill Domain | Owner | Review Cycle |
|-------------|-------|-------------|
| Auth & Security | Senior Dev A | Monthly |
| API Patterns | Senior Dev B | Monthly |
| Frontend Components | Dev C | Quarterly |
| Database Operations | Dev D | Monthly |
| Testing Patterns | Dev E | Quarterly |

**Rule:** Skill changes require owner review. Anyone can propose changes via PR.

---

## CI/CD Integration (v1.3)

### GitHub Actions: CVF Validation

```yaml
# .github/workflows/cvf-validate.yml
name: CVF Validation

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check Phase D Checklist
        run: |
          # Ensure PR description contains completed checklist
          if ! grep -q "\[x\]" "$GITHUB_EVENT_PATH"; then
            echo "❌ Phase D checklist not completed"
            exit 1
          fi

      - name: Validate Specs
        run: |
          # Check INPUT_SPEC exists for new features
          if [ -d "specs/" ]; then
            echo "✅ Specs directory found"
          else
            echo "⚠️ No specs directory — consider adding INPUT_SPEC.md"
          fi

      - name: Validate Contracts (v1.2+)
        if: hashFiles('contracts/*.yaml') != ''
        run: |
          pip install pyyaml
          python cli/cvf_validate.py --all contracts/
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for INPUT_SPEC if adding new features
if git diff --cached --name-only | grep -q "src/"; then
  if ! git diff --cached --name-only | grep -q "specs/\|traces/"; then
    echo "⚠️  CVF Reminder: New code without spec or trace."
    echo "   Consider adding INPUT_SPEC.md or AU trace."
    # Warning only — doesn't block
  fi
fi
```

---

## Common Team Challenges

### "Too much overhead"

**Solution:** Start with Simple governance mode. Only 2 requirements:

1. Write an INPUT_SPEC before asking AI
2. Complete Phase D checklist in PR

Everything else is optional. Add more structure only when you feel the need.

### "Team members aren't adopting CVF"

**Solution:** Make the CVF path easier than the non-CVF path:

- PR template pre-fills checklist → less work than writing from scratch
- Skill library provides starting points → faster than blank prompts
- Templates mean less thinking → just fill the form

### "Skill library gets stale"

**Solution:**

- Assign owners (see table above)
- Review quarterly: deprecate unused, merge duplicates
- Version skills: changes require PR with diff

### "Risk levels feel arbitrary"

**Solution:** Use these defaults:

| Change | Default Risk | Needs Approval |
|--------|:----------:|:---------:|
| UI changes (colors, text) | R0 | No |
| New API endpoint | R1 | Peer review |
| Auth / payment / data migration | R2 | ARCHITECT |
| Infrastructure / deploy pipeline | R3 | GOVERNOR |

---

## Scaling: From 5 to 10+ Devs

When your team grows beyond 5, consider:

| Signal | Action |
|--------|--------|
| Multiple teams/squads | Split Skill Library by domain |
| Need compliance | Switch to **Rules** governance mode |
| New developers joining often | Create onboarding walkthrough |
| Cross-team dependencies | Use v1.1 Command taxonomy (`CVF:PROPOSE`, `CVF:DECIDE`) |
| Enterprise requirements | Move to [Enterprise Guide](enterprise.md) |

---

## Web UI for Teams (v1.6)

The v1.6 web UI works great for teams:

1. **Shared templates:** Create team-specific templates everyone can use
2. **Governance modes:** Set team-wide governance level (Simple/Rules/Full CVF)
3. **Quality scoring:** AI responses scored 0-100 with accept/reject/retry
4. **Multi-agent workflows:** Orchestrator → Architect → Builder → Reviewer

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
cp .env.example .env.local
# Add your team's API keys
npm install && npm run dev
```

---

## Next Steps

- 📖 [Understand Governance Model](../concepts/governance-model.md)
- 🧪 [Set Up Web UI (Tutorial)](../tutorials/web-ui-setup.md)
- 🛠️ [Create Custom Skills (Tutorial)](../tutorials/custom-skills.md)
- 📊 [Understand Risk Levels](../concepts/risk-model.md)
- 🏢 [Need 10+ devs? → Enterprise Guide](enterprise.md)

---

*Last updated: February 15, 2026 | CVF v1.6*
