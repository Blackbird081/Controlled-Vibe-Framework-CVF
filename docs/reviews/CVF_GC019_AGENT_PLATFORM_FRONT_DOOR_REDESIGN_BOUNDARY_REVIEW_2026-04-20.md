# CVF GC-019 Agent Platform Front Door Redesign Boundary Review

- Decision type: `GC-019`
- Date: `2026-04-20`
- Scope: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`
- Reviewer posture: `Independent review for UI-shell restructuring and front-door boundary changes`

## 1. Structural Change Summary

The current redesign wave changes the active front door for the CVF agent platform by:

- promoting the governed landing experience into the dashboard shell
- tightening modal ownership so only one overlay owns focus at a time
- normalizing auth/session behavior between public front-door routes and protected workspace routes
- re-aligning bilingual rendering so server and client content remain hydration-safe
- reworking user-facing presentation surfaces to remove internal version-heavy or admin-heavy copy

This is a `wrapper/re-export merge` style change rather than a physical merge. Source lineage remains inside `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`, but public entry behavior, presentation boundaries, and route expectations shift in a user-visible way.

## 2. Evidence Reviewed

- landing route implementation and dashboard shell integration
- auth/session handling for public vs protected routes
- modal ownership and floating action overlap behavior
- bilingual content rendering and hydration stability
- mobile-fit and user-facing copy updates applied across the redesign surfaces

## 3. Risk Review

- Structural risk: `Moderate`
  The primary risk is boundary confusion between landing/front-door content and the authenticated workspace shell.
- Runtime risk: `Moderate`
  Hydration mismatch, stale session state, and overlapping dialogs can degrade the user-facing experience if left unmanaged.
- Rollback risk: `Low to moderate`
  The changes remain localized to the agent platform web surface and can be reverted without cross-plane data migration.
- Governance risk: `Low`
  No plane ownership transfer or new extension root is introduced in this redesign wave.

## 4. Review Conclusion

- Audit soundness: `ACCEPTABLE`
- Recommended change class: `wrapper/re-export merge`
- Review decision: `APPROVE`

The redesign wave is acceptable to execute because it improves the governed front door without physically relocating the extension or changing the underlying plane lineage. The main requirement is to preserve clear separation between public discovery routes and protected in-app workspaces while keeping the UI shell responsive across desktop and mobile.

## 5. Required Safeguards

- keep protected workspace routes behind session checks
- keep the public front-door copy user-facing rather than operator-facing
- maintain exclusive modal ownership to avoid layered focus traps
- verify mobile spacing, shell fit, and bilingual coverage before release promotion

## 6. Approval Note

This review approves the current redesign wave for continued delivery and publication as long as the guarded route/auth boundary and responsive-shell verification remain part of the release checklist.
