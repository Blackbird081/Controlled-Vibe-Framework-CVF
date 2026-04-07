# CVF W63-T1 Pre-Public Packaging Roadmap (GC-018)

Memory class: SUMMARY_RECORD
> Tranche: W63-T1
> Class: PACKAGING
> Date: 2026-04-08
> Context: Track 3 from Post-MC5 Continuation Strategy — Pre-public packaging to prepare Phase A modules for export readiness.
> Baseline: `v3.7-W46T1` (CLOSURE-ASSESSED); W62-T1 closed delivered; MC1-MC5 complete; Documentation curation complete.

---

## 1. Objective

Execute Track 3 (Pre-Public Packaging) from the Post-MC5 Continuation Strategy to prepare the first wave of modules for public export readiness.

**Phase A Targets**:
1. `CVF_GUARD_CONTRACT` - Shared guard contract, public SDK boundary
2. `CVF_ECO_v2.5_MCP_SERVER` - MCP server for CVF integration
3. `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` - Deterministic hash utilities

**Goals**:
- Add `exportReadiness` status to each module
- Create packaging documentation
- Define export boundaries
- Verify no internal dependencies leak
- Prepare for future `npm publish`

---

## 2. Current State Audit

### Module Inventory

**CVF_GUARD_CONTRACT**:
- Location: `EXTENSIONS/CVF_GUARD_CONTRACT/`
- Tests: 187 passing
- Current status: Used internally by all foundations
- Export boundary: Already defined in P4/CP8 (2026-04-03)
- Documentation: README.md exists
- Package.json: Exists with proper metadata

**CVF_ECO_v2.5_MCP_SERVER**:
- Location: `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/`
- Tests: 71 passing
- Current status: MCP integration layer
- Export boundary: Not yet defined
- Documentation: README.md exists
- Package.json: Exists

**CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY**:
- Location: `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/`
- Tests: Integrated into foundation tests
- Current status: Utility module
- Export boundary: Not yet defined
- Documentation: Minimal
- Package.json: Exists

### Export Readiness Assessment

**Current Export Boundaries** (from P4 pre-public planning):
- Guard Contract: Defined in `CVF_PREPUBLIC_GUARD_CONTRACT_EXPORT_SURFACE_2026-04-03.md`
- MCP Server: Not yet defined
- Deterministic Reproducibility: Not yet defined

**Gaps**:
- No `exportReadiness` field in package.json
- No packaging documentation for MCP Server and Deterministic Reproducibility
- No verification of internal dependency leakage
- No export boundary definitions for 2 of 3 modules

---

## 3. Control Points

### CP1: Export Boundary Definition

**Scope**: Define export boundaries for MCP Server and Deterministic Reproducibility modules.

**Actions**:
1. Create `docs/reference/CVF_PREPUBLIC_MCP_SERVER_EXPORT_SURFACE_2026-04-08.md`
   - Define public API surface
   - List exported functions/classes
   - Document internal-only surfaces
2. Create `docs/reference/CVF_PREPUBLIC_DETERMINISTIC_REPRODUCIBILITY_EXPORT_SURFACE_2026-04-08.md`
   - Define public API surface
   - List exported utilities
   - Document internal-only surfaces
3. Verify Guard Contract export boundary is still current

**Exit Criteria**:
- Export boundary documents created for all 3 modules
- No internal dependencies leak into public API
- All exported surfaces documented

**Governance**: GC-019 Full Lane audit + review

---

### CP2: Export Readiness Metadata

**Scope**: Add `exportReadiness` metadata to package.json for all 3 modules.

**Actions**:
1. Add `exportReadiness` field to each package.json:
   ```json
   {
     "exportReadiness": {
       "status": "CANDIDATE",
       "phase": "A",
       "targetDate": "2026-05-01",
       "blockers": [],
       "documentation": "docs/reference/CVF_PREPUBLIC_*_EXPORT_SURFACE_2026-04-08.md"
     }
   }
   ```
2. Verify package.json metadata is complete (name, version, description, license, repository)
3. Add `publishConfig` if needed

**Exit Criteria**:
- All 3 modules have `exportReadiness` metadata
- All package.json files have complete metadata
- No blockers identified

**Governance**: GC-021 Fast Lane audit + review (additive metadata only)

---

### CP3: Packaging Documentation

**Scope**: Create packaging documentation for all 3 modules.

**Actions**:
1. Update `EXTENSIONS/CVF_GUARD_CONTRACT/README.md`:
   - Add "Export Readiness" section
   - Link to export boundary document
   - Add installation instructions for future npm publish
2. Update `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/README.md`:
   - Add "Export Readiness" section
   - Link to export boundary document
   - Add MCP server setup instructions
3. Update `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/README.md`:
   - Add "Export Readiness" section
   - Link to export boundary document
   - Add usage examples

**Exit Criteria**:
- All 3 modules have updated README.md with export readiness section
- Installation instructions documented
- Usage examples provided

**Governance**: GC-021 Fast Lane audit + review (documentation only)

---

### CP4: Internal Dependency Verification

**Scope**: Verify no internal dependencies leak into public API.

**Actions**:
1. Scan each module's exports for internal references
2. Verify no imports from private-core modules (v1.0/, v1.1/, REVIEW/, etc.)
3. Check for hardcoded paths or internal configuration
4. Verify tests don't expose internal implementation details

**Exit Criteria**:
- No internal dependencies in public API
- No references to private-core modules
- Tests are self-contained

**Governance**: GC-019 Full Lane audit + review

---

## 4. Execution Sequence

1. **CP1** (Full Lane) - Export boundary definition
2. **CP2** (Fast Lane) - Export readiness metadata
3. **CP3** (Fast Lane) - Packaging documentation
4. **CP4** (Full Lane) - Internal dependency verification
5. Tranche closure review

---

## 5. Success Criteria

- [ ] Export boundaries defined for all 3 Phase A modules
- [ ] `exportReadiness` metadata added to all 3 package.json files
- [ ] Packaging documentation complete for all 3 modules
- [ ] No internal dependencies leak into public API
- [ ] All governance artifacts pass
- [ ] Modules ready for future `npm publish` (not executed in this tranche)

---

## 6. Governance Artifacts Required

Per CP:
- CP1: audit doc + review doc (Full Lane)
- CP2: audit doc + review doc (Fast Lane)
- CP3: audit doc + review doc (Fast Lane)
- CP4: audit doc + review doc (Full Lane)

Tranche-level:
- Tranche closure review
- Quality assessment (post-W63)
- GC-026 tracker sync (authorization + closure)
- Handoff update

---

## 7. Risk Assessment

**Medium Risk** - Packaging changes, potential for internal dependency leakage.

**Mitigations**:
- Thorough export boundary definition
- Internal dependency verification
- No actual `npm publish` in this tranche (deferred to future)
- Test all modules after changes

**Blockers**:
- None identified (all modules have passing tests)

---

## 8. Out of Scope

**Not in this tranche**:
- Actual `npm publish` execution (requires separate human-gated approval)
- Public repository creation
- Physical docs mirror creation
- License file updates (already CC BY-NC-ND 4.0)
- Version bumps (keep current versions)

**Future tranches**:
- Phase B modules (additional foundations, web UI)
- Public CI/CD setup
- npm registry configuration
- Public documentation site

---

## 9. Related Artifacts

- `docs/roadmaps/CVF_POST_MC5_CONTINUATION_STRATEGY_ROADMAP_2026-04-08.md`
- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_GUARD_CONTRACT_EXPORT_SURFACE_2026-04-03.md`
- `docs/reference/CVF_PUBLICATION_DECISION_RECORD_2026-04-03.md`

---

*Authorized by: CVF Agent (Pre-Public Packaging)*
*Date: 2026-04-08*
