# CVF Baseline Assessment: Skill Library UI Refactor for Non-Coders
*Date: 2026-04-18*
*Target: `cvf-web/src/components/SkillLibrary.tsx`*

## Observation
The original `SkillLibrary` component was overloaded with administrative governance metrics (UAT Coverage filters, Spec gate counts, detailed Domain Reports). This resulted in an overwhelmed, dense layout that was inherently hostile to the targeted "non-coder" end-user audience.

## Intervention
1. **Removed Administrator Telemetry**: Stripped the Right-pane `Domain Report` rendering entirely from the public `.tsx` structure.
2. **Introduced Non-Coder Empty State**: Directed focus back to exploration via a large hero "Select a skill to explore" landing page.
3. **Cleaned Skill Sidebar**: Excluded the governance-heavy badge system (`Trusted benchmark`, `Not Run`, `Open`) in favor of pure semantic titles.
4. **Rescoped Actions**: Elevated "Use Template" and "Copy Raw" as primary focal points when viewing a skill. Relegated Risk/Roles/Autonomy specs to a subtle tracking footer.

## Test Validation
Corresponding standard validations inside `SkillLibrary.test.tsx` and `SkillLibrary.i18n.test.tsx` were rewritten to align to the new non-coder component map.

## Governance Result
This update preserves CVF file structure while permanently delegating internal component analytics away from end-user UX.
