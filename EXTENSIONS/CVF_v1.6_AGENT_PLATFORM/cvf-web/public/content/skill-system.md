# Skill System

[🇻🇳 Tiếng Việt](../GET_STARTED.md) | 🇬🇧 English

Skills are CVF's mechanism for making AI interactions **repeatable, shareable, and quality-controlled**. Instead of writing prompts from scratch each time, you use a structured template.

---

## What is a Skill?

A skill is a **form-based template** (`.skill.md` file) that:

1. **Guides input** — Tells you exactly what information to provide
2. **Defines output** — Specifies what AI should produce
3. **Includes evaluation** — Provides checklists to verify quality
4. **Documents failures** — Lists common mistakes and how to avoid them

### Skills Are NOT
- ❌ Code libraries
- ❌ Prompt templates (though they inform prompts)
- ❌ AI configurations
- ❌ API wrappers

Skills are **governance artifacts** — structured documents that standardize how humans interact with AI.

---

## Skill Structure

Every skill follows this format:

```
[Skill Name]
├── Metadata (domain, difficulty, version, risk level)
├── 📌 Prerequisites (what you need before using this skill)
├── 🎯 Purpose (when to use / when NOT to use)
├── 📋 Form Input (fields to fill before giving to AI)
├── ✅ Expected Output (what AI should produce)
├── 🔍 Acceptance Checklist (how to verify quality)
├── ⚠️ Common Failures (mistakes and prevention)
├── 💡 Tips (best practices)
├── 📊 Example (complete input → output → evaluation)
├── 🔗 Related Skills
└── 📜 Version History
```

### Example: Metadata Block

```markdown
| Field | Value |
|-------|-------|
| **Domain** | App Development |
| **Difficulty** | ⭐⭐ Medium |
| **CVF Version** | v1.0+ |
| **Skill Version** | 1.2.0 |
| **Last Updated** | 2026-02-15 |
| **Risk Level** | R1 |
```

### Example: Form Input

```markdown
| Field | Required | Description | Example |
|-------|:--------:|-------------|---------|
| Resource name | ✅ | Entity to manage | `User` |
| HTTP method | ✅ | REST method | `POST` |
| Endpoint path | ✅ | URL pattern | `/api/users` |
| Request body | ✅* | JSON schema | `{ name: string }` |
| Error cases | ✅ | Expected errors | `400, 404, 409` |
```

The Form Input section is the core of a skill — it defines exactly what information AI needs.

---

## Skill Library

CVF includes **114 pre-built skills** across 12 domains:

| Domain | Skills | Examples |
|--------|:------:|---------|
| Marketing & SEO | 9 | SEO audit, content strategy, A/B test |
| Product & UX | 8 | User story, wireframe spec, UX audit |
| Security & Compliance | 6 | Threat model, compliance check |
| Finance & Analytics | 8 | Financial model, KPI dashboard |
| App Development | 8 | REST API, database migration, test suite |
| HR & Operations | 5 | Job description, onboarding, OKR |
| Legal & Contracts | 5 | Contract review, NDA, Terms of Service |
| AI/ML Evaluation | 6 | Model evaluation, bias audit |
| Web Development | 6 | Landing page, performance audit |
| Business Analysis | 3 | Market research, competitive analysis |
| Content Creation | 3 | Blog post, technical docs |
| Technical Review | 3 | Code review, architecture review |

**Browse all:** [`EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/`](../../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/)

---

## How to Use a Skill

### Step 1: Find a skill
Browse by domain or search the skill library.

### Step 2: Check prerequisites
Read the Prerequisites section. Make sure you have everything needed.

### Step 3: Fill the form
Copy the Form Input table and fill in your values.

### Step 4: Give to AI
Paste the filled form into your AI tool (ChatGPT, Claude, Copilot, etc.), along with the Expected Output section.

### Step 5: Evaluate
Use the Acceptance Checklist to verify the AI's output. Check for Red Flags.

### Step 6: Accept or retry
- ✅ All boxes checked → Accept
- ❌ Failed items → Fix form input or ask AI to retry

---

## Skill Difficulty Levels

| Level | Symbol | Meaning | Example |
|-------|--------|---------|---------|
| Easy | ⭐ | Fill simple fields, clear output | Blog post, meeting summary |
| Medium | ⭐⭐ | Some domain knowledge needed | API endpoint, test suite |
| Advanced | ⭐⭐⭐ | Expert knowledge + multiple steps | Threat model, architecture review |

---

## Skill Versioning

Skills use semantic versioning: `MAJOR.MINOR.PATCH`

| Change | Version Bump | Example |
|--------|-------------|---------|
| Typo fix, wording | 1.0.0 → 1.0.1 | Fix field description |
| New section, examples | 1.0.0 → 1.1.0 | Add "Common Failures" |
| New form fields, restructure | 1.0.0 → 2.0.0 | Change input schema |

### Version History Example

```markdown
| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-15 | Initial release |
| 1.1.0 | 2026-02-01 | Added Common Failures section |
| 1.1.1 | 2026-02-10 | Fixed example output format |
| 2.0.0 | 2026-02-15 | Added new required field: Error cases |
```

---

## Skill Lifecycle

Skills follow a defined lifecycle:

```
PROPOSED → APPROVED → ACTIVE → DEPRECATED → RETIRED
```

| State | Meaning |
|-------|---------|
| **PROPOSED** | Skill draft submitted for review |
| **APPROVED** | Reviewed and accepted, not yet published |
| **ACTIVE** | Available for use |
| **DEPRECATED** | Still works, but a better alternative exists |
| **RETIRED** | No longer available |

### Lifecycle Rules
- PROPOSED → APPROVED: Requires reviewer sign-off
- ACTIVE → DEPRECATED: Must specify replacement skill
- DEPRECATED → RETIRED: 30-day notice period

---

## Skill Governance (v1.2+)

For teams and enterprise, each skill gets a **governance record** (`.gov.md`):

```markdown
# Governance Record: REST API Endpoint

**Skill ID:** USR-001
**Risk Level:** R1
**Status:** ACTIVE
**Owner:** @team-lead
**Review Cycle:** Quarterly

## Risk Assessment
| Dimension | Level |
|-----------|-------|
| Authority Risk | R0 |
| Scope Expansion Risk | R1 |
| Irreversibility Risk | R0 |
| Interpretability Risk | R0 |
| External Impact Risk | R0 |
| **Aggregate** | **R1** |

## Authority
- BUILDER: Can use freely
- ARCHITECT: Must approve for R2+ contexts
- GOVERNOR: Can override risk assessment
```

### Governance Numbers

The CVF governance tracks:
- **114 user skills** with governance records (`USR-*.gov.md`)
- **8 agent skills** with governance records (`AGT-*.gov.md`)
- Automated validation via `validate_registry.py`

---

## Types of Skills

### User Skills (USR-*)
Form-based templates for humans using AI. No code needed. Fill form → give to AI → evaluate output.

### Agent Skills (AGT-*)
Configuration templates for AI agents in multi-agent workflows. Define what the agent can do, what it can't, and how it reports.

---

## Creating Custom Skills

See the [Custom Skills Tutorial](../tutorials/custom-skills.md) for a step-by-step guide.

### Quick Template

```markdown
# Skill: [Your Skill Name]

## Metadata
| Field | Value |
|-------|-------|
| **Domain** | [Domain] |
| **Difficulty** | ⭐/⭐⭐/⭐⭐⭐ |
| **Skill Version** | 1.0.0 |
| **Risk Level** | R0/R1/R2 |

## 📌 Prerequisites
- [ ] [What you need before using this skill]

## 🎯 Purpose
**Use when:** [scenario]
**Don't use when:** [counter-scenario]

## 📋 Form Input
| Field | Required | Description | Example |
|-------|:--------:|-------------|---------|
| ... | ✅ | ... | ... |

## ✅ Expected Output
[What AI should produce]

## 🔍 Acceptance Checklist
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## ⚠️ Common Failures
| Failure | Prevention |
|---------|-----------|
| ... | ... |
```

---

## Skill Library in Web UI (v1.6)

The v1.6 web app integrates skills as templates:
- Skills appear in the template picker
- Form Input fields become interactive form elements
- Acceptance Checklist becomes part of the review UI
- Export generates spec Markdown with governance metadata

---

## Further Reading

- [Custom Skills Tutorial](../tutorials/custom-skills.md) — Create your own skill
- [Risk Model](risk-model.md) — Risk levels for skills
- [Governance Model](governance-model.md) — How skills fit in governance
- [Skill Library](../../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) — Browse all 114 skills

---

*Last updated: February 15, 2026 | CVF v1.6*
