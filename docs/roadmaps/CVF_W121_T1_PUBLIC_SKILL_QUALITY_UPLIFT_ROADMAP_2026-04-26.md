<!-- Memory class: SUMMARY_RECORD -->

# CVF W121-T1 Public Skill Quality Uplift Roadmap

> Date: 2026-04-26
> Status: CLOSED DELIVERED
> Scope class: NONCODER ADOPTION / SKILL PUBLICATION QUALITY
> Predecessor: W119-T1 CLOSED DELIVERED 2026-04-23; W120-T1 help navigation hardening remains separate
> Authorization: User continuation request in-session, 2026-04-26
> Wave ID: W121

---

## 0. Why This Is Next

CVF's core value is not a large skill count. The product value target is a
non-coder giving an intent, CVF selecting a strong capability, and an AI/agent
receiving a governed packet that reduces ambiguity, rework, and token waste.

The previous 62 active source skills were cleaner than the original 131-skill
portfolio, but still too broad for a public Web promise. Public Web must show
only skills that are ready for non-coder activation and agent execution.

---

## 1. Product Claim Target

W121 makes this bounded claim true:

> The Web Skill Library shows only public, agent-ready skills that have a real
> trusted activation template. Skills below the publication gate do not appear in
> Web search, detail routes, related links, or archive categories.

This is not a live governance behavior claim. It is a static catalog and
template-readiness claim.

---

## 2. Delivered

### CP1 — Publication Gate

Created:

- `governance/skill-library/specs/SKILL_PUBLICATION_QUALITY_GATE.md`

Policy now defines:

- public skill as an agent-ready capability packet;
- Full Wizard Template vs Lightweight Execution Template;
- non-public states: Merged, Incubating, Removed;
- public JSON acceptance checks.

### CP2 — Web Public Index Hardening

Changed:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/scripts/build-skill-index.js`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/data/skills-index.json`

Result:

- source scanned: 62 skills;
- public Web skills: 27;
- non-public source skills: 35;
- public categories: 9;
- `archiveCategories`: removed from public JSON.

### CP3 — Template Map Cleanup

Changed:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/data/skill-template-map.json`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/scripts/skill-corpus-governance.js`

Removed stale aliases that pointed to missing templates or non-public surfaces,
including `market_research`, `performance_audit`, `report_writing`,
`presentation`, `collaborative_writing`, `competitor_analysis_seo`,
`ux_writing`, `dependency_management`, and draft finance template ids.

Public linked templates are now serialized only when they are
`TRUSTED_FOR_VALUE_PROOF`.

### CP4 — Web Surface Copy And Detail Route

Changed:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/skills/page.tsx`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/skills/[domain]/[skill]/page.tsx`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/types/skill.ts`

Web copy now describes the public catalog as agent-ready and gated. Detail pages
no longer search archive categories.

### CP5 — Regression Tests

Changed:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/skill-corpus-governance.test.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/skill-template-map.test.ts`

Tests now enforce:

- no `archiveCategories` in public JSON;
- every public skill is `frontDoorVisible`;
- every public skill has linked templates;
- every public linked template is trusted;
- every mapped template id exists in the template registry.

---

## 3. Public Skill Set After W121

The public Web catalog is intentionally reduced to 27 skills:

| Domain | Public count |
| --- | ---: |
| AI/ML Evaluation | 1 |
| App Development | 4 |
| Business Analysis | 4 |
| Content Creation | 2 |
| Finance Analytics | 1 |
| Marketing & SEO | 4 |
| Product & UX | 6 |
| Security & Compliance | 3 |
| Technical Review | 2 |

Finance Analytics now exposes only `Finance Analysis System` until the
forecast, due diligence, and QA skills receive real trusted lightweight
templates.

---

## 4. Verification

```bash
python EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/scripts/validate_skills.py

cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
node scripts/build-skill-index.js
npm run test:run -- src/lib/skill-corpus-governance.test.ts src/lib/front-door-template-standard.test.ts src/lib/skill-template-map.test.ts
```

Observed:

- skill validation: 62 files, 0 issues, 0 warnings;
- build index: 27 front-door skills, 35 non-public skills;
- targeted tests: 3 files passed, 16 tests passed.

---

## 5. Follow-Up Queue

Future work should not bulk-promote the 35 non-public skills. Promote only when
a skill receives a real Full Wizard or Lightweight Execution Template and passes
the publication gate.

Recommended next candidates:

- `Forecast & Scenario Review` — lightweight finance forecast packet;
- `Investment & Risk Due Diligence` — lightweight due diligence packet;
- `Finance QA Checklist` — lightweight final review packet;
- HR and Legal domains — only if non-coder adoption scenarios prove demand.
