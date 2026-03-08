# CVF Skill Lifecycle — v3.0

> **Developed by Tien - Tan Thuan Port@2026**  
> **Version:** v3.0 (branch `cvf-next`)  
> **Date:** 2026-03-06

---

## Overview

In CVF, a **Skill** is a named, versioned AI capability that an agent can invoke to produce commits and artifacts.

The Skill Lifecycle formalizes how skills are introduced, validated, used, deprecated, and revoked — ensuring controlled evolution of AI capabilities within a governed system.

---

## Skill Lifecycle States

```
PROPOSED ──→ REGISTERED ──→ VERIFIED ──→ ACTIVE
                                │           │
                            DEPRECATED ←───┘
                                │
                             REVOKED
```

| State | Meaning | Who transitions |
|---|---|---|
| **PROPOSED** | Skill concept submitted for governance review | AI agent or developer |
| **REGISTERED** | Skill added to registry, not yet tested | CVF Governor |
| **VERIFIED** | Skill passed governance gate — test coverage ≥ threshold | CVF Integrator |
| **ACTIVE** | Skill is approved for production use | CVF Governor |
| **DEPRECATED** | Skill is scheduled for removal — still usable, not recommended | CVF Governor |
| **REVOKED** | Skill is permanently disabled — no commits accepted | CVF Governor |

---

## Skill Record Structure

```typescript
interface SkillRecord {
  skill_id:       string;    // e.g. "spec-writer"
  version:        string;    // semver: "1.0.0"
  status:         SkillLifecycleState;
  description:    string;
  registered_at:  string;    // ISO 8601
  verified_at?:   string;
  deprecated_at?: string;
  revoked_at?:    string;
  revoke_reason?: string;
  commit_types:   CommitType[];  // which CommitTypes this skill produces
  test_coverage:  number;    // 0–100 — must meet threshold before ACTIVE
}
```

---

## Governance Integration

### 1. Skill verification gate

A skill may not be promoted to `ACTIVE` until:
- Test coverage ≥ 80%
- At least 1 VERIFIED commit produced with this skill
- CVF Governor approves

### 2. Commit-skill linkage

Every `AICommit` references the `skill` field. The governance executor:
- Checks if the skill is `ACTIVE` or `VERIFIED`
- Rejects commits from `DEPRECATED` skills (warning mode) or `REVOKED` skills (error)

### 3. Deprecation notice

When a skill enters `DEPRECATED`:
- All existing commits using this skill remain valid
- New commits using this skill get flagged with `DEPRECATED_SKILL` warning
- Grace period: 1 MINOR version cycle before `REVOKED`

### 4. Revocation

When a skill is `REVOKED`:
- No new commits with this skill are accepted
- Existing commits with this skill are flagged in audit
- `REVOKED` is permanent — a successor skill must be created

---

## Versioning Rules

| Change | Version bump |
|---|---|
| Add new skill | No version change (registry addition) |
| Modify skill behavior | MINOR version of the skill |
| Revoke a skill | Document in CHANGELOG |
| Replace a skill with breaking behavior | New skill_id (successor) |

---

## Dependency Control

Skills may declare dependencies on other skills:

```typescript
interface SkillRecord {
  // ...
  depends_on?: string[];  // skill_ids this skill requires to be ACTIVE
}
```

If a dependency is `REVOKED`, dependent skills are automatically moved to `DEPRECATED`.

---

## Example Skills in CVF

| Skill ID | Commit types | Description |
|---|---|---|
| `spec-writer` | SPEC | Writes feature specifications |
| `state-modeler` | DESIGN | Defines state machines |
| `code-generator` | IMPLEMENT | Generates TypeScript implementation |
| `test-generator` | TEST | Writes Vitest test suites |
| `governance-reviewer` | REVIEW, GOVERNANCE | Runs governance checks |
| `refactor-specialist` | REFACTOR | Refactors existing code |
