# CVF CERTIFICATION STATUS

## STATUS TYPES

| Status | Description |
|--------|------------|
| DRAFT | Initial registration, not yet tested |
| INTERNAL_TEST | Under Self-UAT evaluation |
| APPROVED_INTERNAL | Self-UAT PASS, approved for internal use |
| CERTIFIED_ENTERPRISE | Formal audit passed, enterprise-approved |
| SUSPENDED | Temporarily blocked due to incident or FAIL |
| REVOKED | Permanently deactivated |

---

## RULES

- Self-UAT PASS required for APPROVED_INTERNAL.
- Enterprise certification requires formal audit.
- Any FAIL automatically sets status to SUSPENDED.
- Re-validation required after major changes.

---

## STATE TRANSITIONS

```
DRAFT
  ↓
INTERNAL_TEST
  ↓
APPROVED_INTERNAL
  ↓ (optional, via formal audit)
CERTIFIED_ENTERPRISE
  ↓ (if incident)
SUSPENDED
  ↓ (if permanent)
REVOKED
```
