# CVF ADR GUARD — Architecture Decision Records Policy

> **Type:** Governance Policy
> **Effective:** 2026-02-27
> **Status:** Active
> **Enforced by:** Convention + PR review (automated check: future roadmap)

---

## 1. PURPOSE

Every **architectural or strategic decision** affecting CVF must be recorded in `docs/CVF_ARCHITECTURE_DECISIONS.md` before or within the same push.

This ensures:
- **Full traceability** — every major change has a documented *why*, not just *what*
- **No context loss** — future contributors understand the reasoning behind each design choice
- **Audit trail** — governance decisions can be reviewed, challenged, or reversed with full context

> This guard fills the gap that Bug Guard and Test Guard do NOT cover:
> those guards handle *what broke* and *what was tested*.
> **ADR Guard handles *why we changed the architecture*.**

---

## 2. RULE

> ⚠️ **NON-NEGOTIABLE:**
> Any commit with a scope or message pattern listed below **MUST** have a corresponding ADR entry in `docs/CVF_ARCHITECTURE_DECISIONS.md` within the same push.

### What Triggers This Guard?

| Commit Pattern | Example | Triggers ADR? |
|---|---|---|
| `feat(core-value): ...` | Core value correction | ✅ |
| `feat(governance): ...` | New governance policy | ✅ |
| `feat(domain): ...` | Domain added / renamed / removed | ✅ |
| `feat(skills): ...` (batch) | Multiple skills migrated / restructured | ✅ |
| `refactor(arch): ...` | Architecture restructuring | ✅ |
| `docs(policy): ...` | New or revised policy document | ✅ |
| `chore(remove): ...` (major) | Removing a major component or folder | ✅ |
| `feat: ...` (single template/bugfix) | Minor feature addition | ❌ |
| `fix: ...` | Bug fix (covered by Bug Guard) | ❌ |
| `test: ...` | Test (covered by Test Guard) | ❌ |
| `chore: ...` (minor) | Dependency update, formatting | ❌ |

---

## 3. REQUIRED ADR FORMAT

Each entry in `docs/CVF_ARCHITECTURE_DECISIONS.md` MUST include:

| Field | Required | Description |
|---|:---:|---|
| **ADR-ID** | ✅ | Sequential: `ADR-001`, `ADR-002`, ... |
| **Date** | ✅ | `YYYY-MM-DD` |
| **Title** | ✅ | Short decision title |
| **Status** | ✅ | `Active` / `Superseded by ADR-XXX` / `Revoked` |
| **Context** | ✅ | What situation triggered this decision? |
| **Decision** | ✅ | What was decided? (concrete, specific) |
| **Rationale** | ✅ | WHY this decision over alternatives |
| **Consequences** | ✅ | What does this change? What are the trade-offs? |
| **Related commits** | ✅ | Git commit hash(es) |
| **Related files** | ✅ | Key files affected by this decision |

Template:
```markdown
## ADR-NNN: [Title]

| Field | Value |
|---|---|
| Date | YYYY-MM-DD |
| Status | Active |
| Related commits | `abc1234` |

### Context
[What situation or problem prompted this decision?]

### Decision
[What was decided — specific and concrete]

### Rationale
[Why this decision? What alternatives were considered and rejected?]

### Consequences
[What changes as a result? Any trade-offs or risks?]

### Related Files
- `path/to/file.md`
```

---

## 4. WORKFLOW

```
ARCHITECTURAL CHANGE IDENTIFIED
    ↓
MAKE THE CHANGE (code / policy / domain)
    ↓
WRITE ADR ENTRY in docs/CVF_ARCHITECTURE_DECISIONS.md   ← BEFORE committing
    ↓
COMMIT with scope trigger (feat(governance):, feat(domain):, etc.)
    ↓
PUSH
    ↓
REVIEWER / GOVERNANCE CHECK validates ADR exists
    ↓
✅ PASS or ❌ FAIL (missing ADR = push rejected by reviewer)
```

---

## 5. ADR LIFECYCLE

| Status | Meaning |
|---|---|
| **Active** | Decision currently in effect |
| **Superseded by ADR-XXX** | Replaced by a newer decision — keep for history |
| **Revoked** | Decision reversed — document why |

> Never delete an ADR entry. Mark it as Superseded or Revoked and add the reason.

---

## 6. RELATION TO EXISTING GOVERNANCE

| Guard | Covers | Does NOT cover |
|---|---|---|
| **Bug Guard** | What broke + how fixed | *Why* architecture changed |
| **Test Guard** | What was tested + results | *Why* design changed |
| **Skill Intake Record** | What skills were added | *Why* domain mapping was chosen |
| **ADR Guard** ← **THIS** | *Why* every architecture/strategy decision | Code-level bugs or tests |

All four guards together form **complete traceability** for CVF:

```
Bug → Bug Guard
Test → Test Guard
Skill added → Skill Intake Record
Architecture/Strategy decision → ADR Guard
```

---

## 7. INTEGRATION WITH CONTINUOUS GOVERNANCE LOOP

Architecture decision made WITHOUT a corresponding ADR entry is a **drift trigger**:
- Agent state → `REVALIDATING`
- ADR entry must be added retroactively
- Re-validation required before continuing

---

End of ADR Guard Policy.
