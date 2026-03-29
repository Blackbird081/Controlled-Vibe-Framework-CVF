# CVF GC-018 Quality-First Gate Adoption Delta — 2026-03-30
Memory class: SUMMARY_RECORD

> Scope: adopt a mandatory quality-first decision gate before any fresh `GC-018` continuation packet is drafted or authorized
> Authority: `docs/reference/CVF_QUALITY_ASSESSMENT_STANDARD.md`

## What changed

- added a canonical pre-`GC-018` quality-first decision rule:
  - read the active quality assessment first
  - choose `REMEDIATE_FIRST` or `EXPAND_NOW`
- updated the reusable `GC-018` template and drafting checklist so future packets must declare:
  - active quality assessment
  - current weighted total
  - lowest dimension
  - quality-first decision
  - either expansion justification plus quality commitments, or a remediation target
- updated the session bootstrap, roadmap, handoff, and knowledge base so the same rule appears in all front-door guidance
- strengthened `governance/compat/check_gc018_stop_boundary_semantics.py` so changed `GC-018` packets fail if the quality-first gate is missing

## Why

- prevent agents from opening fresh expansion waves by momentum
- force each new `GC-018` packet to compare expansion value against current quality debt
- prefer quality lift first when the active line is below threshold or directly adjacent debt remains material

## Result

- future `GC-018` drafting is now quality-aware by default
- remediation-first becomes the default posture when active quality is below threshold
- expansion-now remains possible, but only with explicit higher-value justification and quality protection commitments
