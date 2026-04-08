# CVF W62-T1 Documentation Curation Roadmap (GC-018)

Memory class: SUMMARY_RECORD
> Tranche: W62-T1
> Class: DOCUMENTATION
> Date: 2026-04-08
> Context: Track 4 from Post-MC5 Continuation Strategy — Documentation curation to define PUBLIC_DOCS_MIRROR boundary and refresh root docs to reflect CLOSURE-ASSESSED status.
> Baseline: `v3.7-W46T1` (CLOSURE-ASSESSED); W61-T1 closed delivered; MC1-MC5 complete.

---

## 1. Objective

Execute Track 4 (Documentation Curation) from the Post-MC5 Continuation Strategy to:

1. Audit sensitive content in `docs/` and classify exposure readiness
2. Finalize `PUBLIC_DOCS_MIRROR` boundary definition for future public release
3. Refresh root-level documentation (`README.md`, `START_HERE.md`) to reflect post-MC5 CLOSURE-ASSESSED status

This tranche does NOT require GC-018 authorization (DOCUMENTATION class per Post-MC5 roadmap).

---

## 2. Current State Audit

### Documentation Inventory

- **Total files in docs/**: ~2400 files
- **Governance artifacts** (audits/reviews/baselines/roadmaps/assessments/logs): ~1800 files (PRIVATE_ONLY)
- **Public-facing content** (guides/concepts/tutorials/case-studies/cheatsheets): ~50 files (PUBLIC_READY)
- **Reference docs**: ~100 files (MIXED - needs per-file review)
- **Root-level docs**: 10 files (PUBLIC_READY but needs refresh)

### Existing Boundary Definition

- `docs/reference/CVF_PREPUBLIC_DOCS_MIRROR_BOUNDARY_2026-04-02.md` exists
- Defines high-level categories but lacks explicit file lists
- No `.publicignore` or sensitivity classification exists

### Root Docs Status

- `README.md` - Status table shows "SUBSTANTIALLY ALIGNED" (pre-MC5)
- `START_HERE.md` - Last updated 2026-04-07 (pre-W61-T1)
- `ARCHITECTURE.md` - Not audited in this scope
- No post-MC5 orientation guide exists

---

## 3. Control Points

### CP1: Sensitive Content Classification Audit

**Scope**: Scan high-traffic docs for sensitive content and create classification registry.

**Actions**:
1. Identify top 50 most-referenced files in `docs/reference/`
2. Classify each as: `PUBLIC_READY`, `NEEDS_REVIEW`, or `PRIVATE_ONLY`
3. Create `docs/reference/CVF_DOCS_SENSITIVITY_CLASSIFICATION.md`
4. Document classification criteria and review process

**Exit Criteria**:
- Classification registry created
- All governance artifacts marked `PRIVATE_ONLY`
- Public-facing content marked `PUBLIC_READY`
- Reference docs classified per file

**Governance**: GC-019 Full Lane audit + review

---

### CP2: PUBLIC_DOCS_MIRROR Boundary Finalization

**Scope**: Update existing boundary definition with explicit file lists and create `.publicignore`.

**Actions**:
1. Update `docs/reference/CVF_PREPUBLIC_DOCS_MIRROR_BOUNDARY_2026-04-02.md`:
   - Add explicit file lists for Direct Mirror Candidates
   - Add explicit file lists for Conditional Mirror Zone
   - Add explicit file lists for Private-Core-Only Zone
2. Create `docs/.publicignore` (gitignore-style for future mirror tooling)
3. Verify no sensitive content in PUBLIC_READY files

**Exit Criteria**:
- Boundary document updated with explicit file lists
- `.publicignore` created and covers all PRIVATE_ONLY zones
- No broken references in public-facing content

**Governance**: GC-019 Full Lane audit + review

---

### CP3: Root Documentation Refresh

**Scope**: Update root docs to reflect post-MC5 CLOSURE-ASSESSED status.

**Actions**:
1. Update `README.md`:
   - Status table: reflect MC5 completion, CI coverage 100%, architecture baseline CLOSURE-ASSESSED
   - Test counts: CPF 2929, EPF 1301, GEF 625, LPF 1465, cvf-web 1853, total CI 8294
   - Add W61-T1 CI expansion note
2. Update `START_HERE.md`:
   - Add post-MC5 note
   - Update "Last updated" date
3. Create `docs/POST_MC5_ORIENTATION.md`:
   - Quick guide for post-closure state
   - Link to MC5 closure review
   - Link to Post-MC5 Continuation Strategy

**Exit Criteria**:
- `README.md` status reflects current state
- `START_HERE.md` updated
- `docs/POST_MC5_ORIENTATION.md` created
- All links verified

**Governance**: GC-021 Fast Lane audit + review (additive documentation only)

---

## 4. Execution Sequence

1. **CP1** (Full Lane) - Sensitive content classification
2. **CP2** (Full Lane) - Boundary finalization
3. **CP3** (Fast Lane) - Root docs refresh
4. Tranche closure review

---

## 5. Success Criteria

- [ ] Sensitivity classification registry created
- [ ] PUBLIC_DOCS_MIRROR boundary finalized with explicit file lists
- [ ] `.publicignore` created
- [ ] `README.md` reflects post-MC5 status
- [ ] `START_HERE.md` updated
- [ ] `docs/POST_MC5_ORIENTATION.md` created
- [ ] All governance artifacts pass
- [ ] No sensitive content in PUBLIC_READY files

---

## 6. Governance Artifacts Required

Per CP:
- CP1: audit doc + review doc
- CP2: audit doc + review doc
- CP3: audit doc + review doc (Fast Lane)

Tranche-level:
- Tranche closure review
- Quality assessment (post-W62)
- GC-026 tracker sync (authorization + closure)
- Handoff update

---

## 7. Risk Assessment

**Low Risk** - Documentation-only changes, no code modifications.

**Mitigations**:
- Verify no broken links in public-facing content
- Ensure no accidental exposure of sensitive governance artifacts
- Test `.publicignore` patterns before future mirror implementation

---

## 8. Related Artifacts

- `docs/roadmaps/CVF_POST_MC5_CONTINUATION_STRATEGY_ROADMAP_2026-04-08.md`
- `docs/reference/CVF_PREPUBLIC_DOCS_MIRROR_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `AGENT_HANDOFF.md`

---

*Authorized by: CVF Agent (Documentation Curation)*
*Date: 2026-04-08*
