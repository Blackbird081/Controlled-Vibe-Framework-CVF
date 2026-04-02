# CVF P3 Slow-Safe Execution Handoff Delta — 2026-04-02

Memory class: SUMMARY_RECORD

## Purpose

- record the explicit handoff instruction that future `P3` relocation work must prioritize safety over speed
- ensure later agents see the execution posture directly in `AGENT_HANDOFF.md` before opening another relocation wave

## Added Handoff Rule

Future `P3` relocation work must be:

- slow-and-safe rather than speed-first
- bounded in move-set size
- rollback-first and traceability-first
- stopped immediately if runtime path impact, docs canon impact, registry truth, or packaging assumptions become unclear

## Operational Meaning

- do fewer moves per wave if needed
- prefer cleaner recovery and clearer review over faster root cleanup
- treat ambiguity as a stop condition, not as something to push through
