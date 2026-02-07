# AGT-007: File Read

> **Type:** Agent Skill  
> **Domain:** File System  
> **Status:** Active

---

## Source

Implementation in v1.6 AGENT_PLATFORM

---

## Capability

Read file contents from workspace.

**Actions:**
- Read text files
- Read configuration files
- Read data files
- Access file metadata

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R1 – Low** |
| Allowed Roles | All roles |
| Allowed Phases | All phases |
| Decision Scope | Workspace |
| Autonomy | Auto |

---

## Risk Justification

- **Read-only** - No modification risk
- **Workspace scoped** - Limited access
- **Data exposure** - Potential sensitive content
- **Audit trail** - Access logged

---

## Constraints

- ✅ Workspace scope only
- ✅ All access logged
- ✅ File types validated
- ❌ No system files
- ❌ No parent directory traversal
- ❌ No secrets/credentials files

---

## Security Controls

- Path validation (no `../`)
- Workspace boundary enforced
- Sensitive file patterns blocked
- Access audit trail

---

## UAT Binding

**PASS criteria:**
- [ ] Workspace boundary respected
- [ ] Path traversal blocked
- [ ] Access logged
- [ ] Sensitive files protected

**FAIL criteria:**
- [ ] Access outside workspace
- [ ] Path traversal allowed
- [ ] No access logging
