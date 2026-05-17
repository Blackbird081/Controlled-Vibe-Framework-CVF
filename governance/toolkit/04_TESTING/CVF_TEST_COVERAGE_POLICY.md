# CVF Test Coverage Policy

**Effective date:** 2026-02-27  
**Scope:** All software projects managed under CVF

---

## 1) Mandatory Requirements

Every CVF project must have:

1. A runnable coverage command (example: `npm run test:coverage`).
2. A stored baseline coverage report in project docs.
3. Minimum coverage thresholds configured in test runner/CI.
4. Coverage evidence attached to release gate decisions.

---

## 2) Minimum Governance Standard

- Coverage must be measured automatically, not manually estimated.
- Thresholds must fail the pipeline when violated.
- Baseline numbers must include:
  - Statements
  - Branches
  - Functions
  - Lines
- If thresholds are intentionally low at first, roadmap for uplift must be documented.

---

## 3) CVF Gate Mapping

- **Phase C (Build):** Coverage command and config must exist.
- **Phase D (Review):** Coverage report and threshold result must be attached.
- **Pre-release Gate:** No release note without coverage evidence.

---

## 4) Non-compliance

If a project has no coverage command/report/threshold:

- Gate status = **FAIL**
- Project must return to **Phase C** before release.
