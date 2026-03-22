# CVF Fast Lane Audit Template

Memory class: POINTER_RECORD

> Decision type: `Fast Lane` additive tranche-local audit  
> Purpose: justify why one bounded additive change may use lightweight governance instead of a full structural packet
> Default output memory class for the filled audit: `FULL_RECORD` under `GC-022`

---

## 1. Proposal

- Change ID:
- Date:
- Tranche:
- Control point:
- Active execution plan:

## 2. Eligibility Check

- already-authorized tranche: `YES / NO`
- additive only: `YES / NO`
- no physical merge: `YES / NO`
- no ownership transfer: `YES / NO`
- no runtime authority change: `YES / NO`
- no target-state claim expansion: `YES / NO`
- no concept-to-module creation: `YES / NO`

## 3. Scope

- files / surfaces touched:
- caller or consumer affected:
- out of scope:

## 4. Why Fast Lane Is Safe

- why this change is low-risk:
- why full-lane governance is not required:
- rollback unit:

## 5. Verification

- tests:
- governance gates:
- success criteria:

## 6. Audit Decision

- `FAST LANE READY`
- `REVISE`
- `ESCALATE TO FULL LANE`

## 7. Notes

- tranche-local notes:
- memory-class note: lane selection does not decide memory class; the filled audit should normally be stored as `FULL_RECORD`
