# CVF Active Archive Active Window Protection Delta 2026-03-28

Memory class: SUMMARY_RECORD

Status: completed hardening batch that prevents generic archive cleanup from moving canonical active windows owned by dedicated rotation guards.

## Scope

- protect all current dedicated active trace/log windows from generic auto-archive
- make the archive policy explicit in both script config and governance docs
- add regression coverage so this protection does not quietly disappear in later cleanup work

## Protected Active Windows

- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md`

## Delivered Changes

1. Added a dedicated active-window protection set in:
   - `scripts/cvf_active_archive.py`
2. Added regression coverage in:
   - `scripts/test_cvf_active_archive.py`
3. Updated archive-governance canon in:
   - `governance/toolkit/05_OPERATION/CVF_ACTIVE_ARCHIVE_GUARD.md`
   - `docs/CVF_ARCHITECTURE_DECISIONS.md`
   - `docs/CVF_CORE_KNOWLEDGE_BASE.md`

## Policy Result

- generic archive cleanup now treats dedicated active windows as permanent inputs, not as ordinary dated archive candidates
- archive hygiene remains free to move normal dated operational documents after screening
- future dedicated rotation guards should extend the same protected active-window model

## Verification

- `python scripts/test_cvf_active_archive.py`
- `python governance/compat/check_incremental_test_log_rotation.py --enforce`
- `python governance/compat/check_conformance_trace_rotation.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
