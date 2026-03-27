# CVF ADR Guard

**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active architecture-decision recording contract for strategic and structural changes.
**Applies to:** All humans and AI agents making architectural or strategic decisions that affect CVF and must be recorded in `docs/CVF_ARCHITECTURE_DECISIONS.md`.
**Enforced by:** `docs/CVF_ARCHITECTURE_DECISIONS.md`

## Purpose

- preserve the why behind major architectural and strategic changes
- prevent context loss when later contributors revisit a decision
- keep a durable audit trail for decisions that bug and test logs do not cover

Bug and test guards explain what broke and what was tested. The ADR guard explains why the architecture changed.

## Rule

Any commit with an architectural or strategic change pattern listed below MUST have a corresponding ADR entry in `docs/CVF_ARCHITECTURE_DECISIONS.md` within the same push.

### Trigger Patterns

| Commit Pattern | Example | Triggers ADR? |
|---|---|:---:|
| `feat(core-value): ...` | core value correction | Yes |
| `feat(governance): ...` | new governance policy | Yes |
| `feat(domain): ...` | domain added, renamed, or removed | Yes |
| `feat(skills): ...` | multiple skills migrated or restructured | Yes |
| `refactor(arch): ...` | architecture restructuring | Yes |
| `docs(policy): ...` | new or revised policy document | Yes |
| `chore(remove): ...` major | removing a major component or folder | Yes |
| `feat: ...` minor | single template or minor feature addition | No |
| `fix: ...` | bug fix covered by bug guard | No |
| `test: ...` | test work covered by test guard | No |
| `chore: ...` minor | dependency update or formatting | No |

### Required ADR Format

Each entry in `docs/CVF_ARCHITECTURE_DECISIONS.md` MUST include:

| Field | Required? | Description |
|---|:---:|---|
| `ADR-ID` | Yes | Sequential such as `ADR-001`, `ADR-002` |
| `Date` | Yes | `YYYY-MM-DD` |
| `Title` | Yes | Short decision title |
| `Status` | Yes | `Active`, `Superseded by ADR-XXX`, or `Revoked` |
| `Context` | Yes | Situation that triggered the decision |
| `Decision` | Yes | What was decided |
| `Rationale` | Yes | Why this decision was chosen |
| `Consequences` | Yes | What changes and what trade-offs exist |
| `Related commits` | Yes | Git hash references |
| `Related files` | Yes | Key affected files |

### Workflow

1. identify the architectural or strategic change
2. make the code, policy, or domain change
3. write the ADR entry in `docs/CVF_ARCHITECTURE_DECISIONS.md` before committing
4. commit and push with the triggering scope
5. validate the ADR exists before merge

### ADR Lifecycle

| Status | Meaning |
|---|---|
| `Active` | decision currently in effect |
| `Superseded by ADR-XXX` | replaced by a newer decision and kept for history |
| `Revoked` | reversed, with the reason preserved |

Never delete an ADR entry. Mark it as superseded or revoked instead.

## Enforcement Surface

- the canonical enforcement surface is the required ADR entry in `docs/CVF_ARCHITECTURE_DECISIONS.md`
- reviewer and governance validation must reject a structural change that lacks the matching ADR
- architecture decisions made without an ADR are drift triggers and require retroactive documentation before continuing

## Related Artifacts

- `docs/CVF_ARCHITECTURE_DECISIONS.md`
- `governance/toolkit/05_OPERATION/CVF_BUG_DOCUMENTATION_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md`
- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`

## Final Clause

If CVF changes architecture without recording the rationale, it invites the same debate and the same mistakes to return later.
