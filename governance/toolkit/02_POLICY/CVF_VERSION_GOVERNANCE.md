# CVF VERSION GOVERNANCE

## 1. VERSIONING PRINCIPLE

CVF versions are:
- Repository-bound
- Governance-driven
- Forward-compatible only by decision

Agents do NOT choose CVF versions.
Repositories do.

---

## 2. VERSION STRUCTURE

MAJOR.MINOR.PATCH

- **MAJOR** → Structural governance change → re-UAT of ALL agents
- **MINOR** → Rule extension → re-UAT of affected agents
- **PATCH** → Clarification → registry update only

---

## 3. VERSION TIERS

### CVF v0.x — Exploratory Governance

Purpose: Learning, Prototyping, Skill discovery

Characteristics:
- Lightweight logging
- Flexible phase transitions
- Human override allowed (but visible)

Allowed Contexts: Personal repos, PoC, Early agent experimentation

---

### CVF v1.x — Operational Governance

Purpose: Team collaboration, Shared responsibility, Repeatable workflows

Characteristics:
- Mandatory phase records
- Skill intake enforcement
- Output invalidation on violation

Allowed Contexts: Team repos, Internal tools, Production-adjacent systems

---

### CVF v2.x — Regulated Governance

Purpose: Audit, Compliance, High-impact autonomy control

Characteristics:
- No implicit decisions
- Mandatory documentation
- Agent refusal by default

Allowed Contexts: Enterprise systems, Regulated domains, Long-lived agent infrastructure

---

## 4. VERSION PINNING (MANDATORY)

Each repository MUST pin exactly ONE CVF version in:

`.cvrfc/CVF_VSCODE_BOOTSTRAP.md`

Agents MUST refuse to operate if the version is missing or ambiguous.

---

## 5. UPGRADE / DOWNGRADE RULES

**Upgrade requires:**
- Explicit human decision
- Justification document
- Update of bootstrap file

Silent upgrades are FORBIDDEN.

**Downgrade:**
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

## 7. CHANGE CONTROL

Every change must include:
- Changelog entry
- Risk impact assessment
- Approval record

---

## 8. AGENT BEHAVIOR ON VERSION CONFLICT

If an agent detects conflicting CVF versions,
instructions targeting a different version,
or a missing version reference:

→ STOP → Report the conflict → Request human resolution

---

## FINAL RULE

CVF versions define responsibility.
Higher versions mean heavier consequences.

Upgrade slowly.
Governance debt is worse than technical debt.
