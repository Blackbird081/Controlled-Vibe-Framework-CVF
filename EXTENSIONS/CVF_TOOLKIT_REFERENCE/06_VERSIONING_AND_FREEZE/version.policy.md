# CVF Toolkit Version Policy

This document defines versioning rules for the Toolkit.

## Version Format

MAJOR.MINOR.PATCH

Example:
1.0.0

---

## MAJOR Increment

Increase MAJOR when:

- Governance logic changes
- Risk classification logic changes
- Phase lifecycle model changes
- Breaking API contract changes
- Certification model changes

MAJOR upgrade requires:
- Full regression UAT
- Executive approval (for HIGH/CRITICAL domains)
- Migration guide publication

---

## MINOR Increment

Increase MINOR when:

- New skill packs added
- New AI provider added
- New extension layer added
- Backward-compatible feature enhancement

Requires:
- Targeted UAT
- Risk re-evaluation if domain-sensitive

---

## PATCH Increment

Increase PATCH when:

- Bug fixes
- Logging improvements
- Non-breaking validation updates
- Documentation fixes

No certification reset required unless affecting HIGH/CRITICAL skills.

---

## Skill-Level Versioning

Each skill maintains its own version.

If skill logic changes:
- Skill version must increment
- UAT must re-run
- Certification may be invalidated

---

## Model Provider Changes

Switching AI model provider triggers:

- Risk reclassification
- Mandatory UAT for MEDIUM+
- Certification review for HIGH/CRITICAL
