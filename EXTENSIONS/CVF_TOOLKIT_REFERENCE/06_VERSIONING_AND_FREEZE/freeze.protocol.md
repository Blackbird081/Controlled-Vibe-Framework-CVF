# Freeze Protocol

Freeze is mandatory for R3 (High Risk) and R4 (Critical Risk) skills.

---

## When Freeze Is Required

- After certification of R3 skill
- After certification of R4 skill
- After production deployment of financial decision systems

---

## Freeze Definition

Freeze means:

- Skill logic cannot change
- Risk level cannot downgrade without review
- Model provider cannot change
- Validation rules cannot relax

---

## Breaking Freeze

To break freeze:

1. Submit Change Request
2. Re-run UAT
3. Re-certify
4. Increment version
5. Log audit event "FREEZE_APPLIED" again

---

## Emergency Override

Only ADMIN role may perform emergency override.

Must:

- Log event
- Generate compliance report
- Trigger automatic re-certification review
