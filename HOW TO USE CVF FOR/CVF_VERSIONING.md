File này khóa logic nâng version
# CVF VERSIONING POLICY

This document defines how CVF versions are selected,
pinned, upgraded, and frozen.

CVF versioning reflects governance maturity,
not feature completeness.

---

## 1. VERSIONING PRINCIPLE

CVF versions are:
- Repository-bound
- Governance-driven
- Forward-compatible only by decision

Agents do NOT choose CVF versions.
Repositories do.

---

## 2. VERSION TIERS

### CVF v0.x — Exploratory Governance

Purpose:
- Learning
- Prototyping
- Skill discovery

Characteristics:
- Lightweight logging
- Flexible phase transitions
- Human override allowed (but visible)

Allowed Contexts:
- Personal repos
- PoC
- Early agent experimentation

---

### CVF v1.x — Operational Governance

Purpose:
- Team collaboration
- Shared responsibility
- Repeatable workflows

Characteristics:
- Mandatory phase records
- Skill intake enforcement
- Output invalidation on violation

Allowed Contexts:
- Team repos
- Internal tools
- Production-adjacent systems

---

### CVF v2.x — Regulated Governance

Purpose:
- Audit
- Compliance
- High-impact autonomy control

Characteristics:
- No implicit decisions
- Mandatory documentation
- Agent refusal by default

Allowed Contexts:
- Enterprise systems
- Regulated domains
- Long-lived agent infrastructure

---

## 3. VERSION PINNING (MANDATORY)

Each repository MUST pin exactly ONE CVF version
in:

.cvrfc/CVF_VSCODE_BOOTSTRAP.md

Example:
CVF Version: 0.1

Agents MUST refuse to operate
if the version is missing or ambiguous.

---

## 4. VERSION UPGRADE RULES

A CVF version upgrade requires:
- Explicit human decision
- Justification document
- Update of bootstrap file

Silent upgrades are FORBIDDEN.

---

## 5. DOWNGRADE POLICY

CVF version downgrades are:
- Allowed ONLY with justification
- Must be explicitly recorded
- Considered a governance risk signal

---

## 6. FREEZE CONDITIONS

A CVF version may be declared FROZEN when:
- The repository enters maintenance mode
- Audit stability is required
- No further autonomy expansion is desired

Frozen versions:
- Cannot accept new skills
- Cannot change authority rules

---

## 7. AGENT BEHAVIOR ON VERSION CONFLICT

If an agent detects:
- Conflicting CVF versions
- Instructions targeting a different version
- Missing version reference

The agent MUST:
→ STOP
→ Report the conflict
→ Request human resolution

---

## FINAL RULE

CVF versions define responsibility.
Higher versions mean heavier consequences.

Upgrade slowly.
Governance debt is worse than technical debt.

End of versioning policy.
