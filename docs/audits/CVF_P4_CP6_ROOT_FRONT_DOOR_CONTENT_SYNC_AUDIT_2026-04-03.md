# CVF P4 CP6 Audit - Root Front-Door Content Sync

Memory class: FULL_RECORD

> Decision type: `GC-019` structural/publication-planning audit
> Pre-public phase: `P4`
> Date: `2026-04-03`

---

## 1. Proposal

- Change ID:
  - `GC019-P4-CP6-ROOT-FRONT-DOOR-CONTENT-SYNC-2026-04-03`
- Date:
  - `2026-04-03`
- Proposed target:
  - sync the three root front-door files to the curated navigation map already approved in `P4/CP5`
- proposed outputs:
  - updated `README.md`
  - updated `START_HERE.md`
  - updated `ARCHITECTURE.md`
  - explicit packet receipt that this is content sync, not new publication posture
- proposed change class:
  - `front-door content synchronization`

## 2. Scope

- in scope:
  - root front-door wording and link routing in `README.md`
  - root redirect/orientation wording in `START_HERE.md`
  - front-door architecture follow-up routing in `ARCHITECTURE.md`
- out of scope:
  - public docs mirror execution
  - export-readiness changes
  - package publication
  - any root relocation
  - content edits outside the three root front-door files

## 3. Source-Truth Context

- `P4/CP5` already defined the canonical ring-based front-door navigation map
- `P4/CP2` already defined the docs-mirror boundary for root front-door files
- current root front-door files exist, but still show routing drift:
  - `START_HERE.md` is still acting like an older redirect stub with stale counts and direct extension-first jumps
  - `README.md` still mixes front-door orientation with deeper evidence navigation in a way that can blur the first-click path
  - `ARCHITECTURE.md` still sends readers directly into review/roadmap surfaces from the front door

## 4. Recommended Sync Rules

- `README.md` should:
  - keep the main landing-page role
  - triage by audience before deeper evidence links
  - keep private-core-heavy docs available, but not as the first front-door chain
- `START_HERE.md` should:
  - remain a short redirect-style entry surface
  - route by audience toward ring-2 destinations
  - avoid extension-directory-first navigation as the default first hop
- `ARCHITECTURE.md` should:
  - remain the visual system-shape front door
  - point readers next to architecture depth or guided orientation, not immediately to review-heavy surfaces

## 5. Risk Assessment

- leaving the current front-door files unsynced after `P4/CP5`:
  - `MEDIUM`
  - canonized navigation and live front-door behavior diverge
- bounded content sync for the three root files only:
  - `LOW`
  - aligns actual entry surfaces with existing planning truth
- broader front-door rewrite across multiple docs zones at once:
  - `MEDIUM-HIGH`
  - raises drift risk and mixes navigation sync with deeper docs curation

## 6. Recommendation

- recommended outcome:
  - `APPROVE P4/CP6`
- rationale:
  - this is the smallest real implementation step after `P4/CP5`
  - it improves reader routing without widening exposure posture
  - it keeps the change small enough to verify and roll back easily

## 7. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this packet syncs content only
  - it does not authorize public mirror publication or package release
