# AGT-008: File Write

> **Type:** Agent Skill  
> **Domain:** File System  
> **Status:** Active

---

## Source

Implementation in v1.6 AGENT_PLATFORM

---

## Capability

Write and modify files in workspace.

**Actions:**
- Create new files
- Update existing files
- Append to files
- Delete files (restricted)

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R2 – Medium** |
| Allowed Roles | Orchestrator, Builder |
| Allowed Phases | Execute, Deploy |
| Decision Scope | External |
| Autonomy | Supervised |

---

## Risk Justification

- **Modification risk** - Data loss potential
- **Workspace scoped** - Limited but significant
- **Irreversible** - Delete operations
- **Must be audited** - All changes logged

---

## Constraints

- ✅ Workspace scope only
- ✅ All writes logged with content hash
- ✅ Backup before overwrite
- ✅ User confirmation for deletes
- ❌ No system files
- ❌ No parent directory traversal
- ❌ No config/secrets overwrite

---

## Security Controls

- Path validation (no `../`)
- Workspace boundary enforced
- Protected file patterns (`.env`, `*.key`, etc.)
- Pre-write backup
- Change audit trail

---

## Rollback

- Automatic pre-write snapshots
- Restore from backup available
- Undo within session

---

## UAT Binding

**PASS criteria:**
- [ ] Workspace boundary enforced
- [ ] Path traversal blocked
- [ ] All writes logged with hash
- [ ] Protected files blocked
- [ ] Backup created on overwrite

**FAIL criteria:**
- [ ] Write outside workspace
- [ ] Path traversal allowed
- [ ] No write logging
- [ ] Protected file modified
- [ ] No backup on destructive ops
