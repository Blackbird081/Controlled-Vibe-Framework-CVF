# CVF Skill Governance - Integration Roadmap

> **Created:** Feb 07, 2026  
> **Status:** Planning  
> **Owner:** CVF Team

---

## 🎯 Objective

Tích hợp historical `CVF_SKILL_LIBRARY` lineage vào **Governance Layer** để kiểm soát:
1. **User Skills** (v1.5.2 SKILL_LIBRARY_FOR_END_USERS - 131 skills)
2. **Agent Skills** (v1.6 AGENT_PLATFORM - 8 tools)
3. **Agent Output Quality** (UAT framework)

---

## 📐 Architecture

```
governance/skill-library/          ← canonical governance layer
├── specs/                         ← Governance specifications
│   ├── CVF_SKILL_SPEC.md
│   ├── CVF_RISK_AUTHORITY_MAPPING.md
│   ├── CVF_SKILL_RISK_AUTHORITY_LINK.md
│   ├── SKILL_MAPPING_RECORD.md
│   ├── EXTERNAL_SKILL_INTAKE.md
│   ├── SKILL_ADAPTATION_GUIDE.md
│   ├── SKILL_DEPRECATION_RULES.md
│   └── GOVERNANCE_DASHBOARD_DESIGN.md
│
├── registry/                      ← NEW: Skill governance records
│   ├── user-skills/               → References v1.5.2 (114 files)
│   │   ├── USR-001_code_review.gov.md
│   │   ├── USR-002_architecture_review.gov.md
│   │   └── ... (114 total)
│   │
│   └── agent-skills/              → References v1.6 tools (8 files)
│       ├── AGT-001_web_search.gov.md
│       ├── AGT-002_code_execute.gov.md
│       └── ... (8 total)
│
├── uat/                           ← UAT framework
│   ├── AGENT_AI_UAT_CVF_TEMPLATE.md
│   ├── SKILL_MAPPING_UAT_BINDING.md
│   ├── generate_uat_records.py
│   ├── score_uat.py
│   ├── results/
│   └── reports/
│
└── examples/
    └── SK-001_CODE_REVIEW_ASSISTANT.md
```

---

## 🔗 Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              governance/skill-library/ (NEW)                 │
│                                                             │
│  specs/          registry/           uat/                   │
│  (rules)         (metadata)          (testing)              │
│     │               │                   │                   │
└─────┼───────────────┼───────────────────┼───────────────────┘
      │               │                   │
      │    ┌──────────┴──────────┐        │
      │    ↓                     ↓        │
      │  user-skills/      agent-skills/  │
      │    │                     │        │
      │    ↓                     ↓        │
      │  v1.5.2              v1.6         │
      │  SKILL_LIBRARY       AGENT        │
      │  (131 skills)        PLATFORM     │
      │  [Content]           (8 tools)    │
      │                      [Execution]  │
      │                                   │
      └───────────────┬───────────────────┘
                      ↓
              AI Agent Output
                      ↓
              UAT Validation ←─────────────┘
```

---

## 📋 Tasks

### Phase 1: Structure Setup
| # | Task | Est. | Status |
|---|------|------|--------|
| 1.1 | Create `governance/skill-library/` folder | 5 min | ⬜ |
| 1.2 | Keep historical `CVF_SKILL_LIBRARY` lineage retained while canonical governance content lives in `governance/skill-library/specs/` | 10 min | ☑ |
| 1.3 | Create `registry/user-skills/` folder | 2 min | ⬜ |
| 1.4 | Create `registry/agent-skills/` folder | 2 min | ⬜ |
| 1.5 | Create `uat/` folder structure | 5 min | ⬜ |
| 1.6 | Update README.md with new structure | 15 min | ⬜ |

### Phase 2: User Skills Registry (131 skills)
| # | Task | Est. | Status |
|---|------|------|--------|
| 2.1 | Create `.gov.md` template | 10 min | ⬜ |
| 2.2 | Create Python script to generate registry files | 30 min | ⬜ |
| 2.3 | Run script to generate 114 .gov.md files | 5 min | ⬜ |
| 2.4 | Manually assign Risk Levels (batch by domain) | 1 hour | ⬜ |
| 2.5 | Validate all registry files | 15 min | ⬜ |

### Phase 3: Agent Skills Registry (8 tools)
| # | Task | Est. | Status |
|---|------|------|--------|
| 3.1 | Document 8 agent tools from v1.6 | 30 min | ⬜ |
| 3.2 | Create AGT-001 to AGT-008 .gov.md files | 45 min | ⬜ |
| 3.3 | Define Risk Levels for each tool | 30 min | ⬜ |
| 3.4 | Link to v1.6 implementation | 15 min | ⬜ |

### Phase 4: UAT Integration
| # | Task | Est. | Status |
|---|------|------|--------|
| 4.1 | Move UAT templates to `uat/` | 10 min | ⬜ |
| 4.2 | Create UAT binding for user skills | 30 min | ⬜ |
| 4.3 | Create UAT binding for agent skills | 30 min | ⬜ |
| 4.4 | Create sample UAT results | 20 min | ⬜ |
| 4.5 | Seed UAT cases by domain | 20 min | ⬜ |
| 4.6 | Auto-score UAT + export report | 20 min | ⬜ |

### Phase 5: Documentation & Links
| # | Task | Est. | Status |
|---|------|------|--------|
| 5.1 | Update main README.md (root) | 15 min | ⬜ |
| 5.2 | Update v1.5.2 README with governance link | 10 min | ⬜ |
| 5.3 | Update v1.6 README with governance link | 10 min | ⬜ |
| 5.4 | Update docs/INDEX.md | 10 min | ⬜ |
| 5.5 | Create governance/README.md | 20 min | ⬜ |

### Phase 6: Validation & Commit
| # | Task | Est. | Status |
|---|------|------|--------|
| 6.1 | Validate all links work | 15 min | ⬜ |
| 6.2 | Run skill validation tool | 10 min | ⬜ |
| 6.3 | Review changes | 15 min | ⬜ |
| 6.4 | Commit & push to GitHub | 5 min | ⬜ |

---

## ⏱️ Time Estimate

| Phase | Est. Time |
|-------|-----------|
| Phase 1: Structure Setup | 40 min |
| Phase 2: User Skills Registry | 2 hours |
| Phase 3: Agent Skills Registry | 2 hours |
| Phase 4: UAT Integration | 1.5 hours |
| Phase 5: Documentation | 1 hour |
| Phase 6: Validation | 45 min |
| **Total** | **~8 hours** |

---

## 📁 .gov.md Template

```markdown
# [SKILL-ID]: [Skill Name]

> **Type:** User Skill | Agent Skill  
> **Source:** [link to source file]  
> **Status:** Active | Restricted | Deprecated

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | R0 / R1 / R2 / R3 / R4 |
| Allowed Roles | [roles] |
| Allowed Phases | [phases] |
| Decision Scope | Informational / Tactical / Strategic |
| Autonomy | None / Conditional / Auto |

---

## UAT Binding

**PASS criteria:**
- [ ] Output follows expected format
- [ ] Stays within declared scope

**FAIL criteria:**
- [ ] Actions outside authority
- [ ] Missing required validation
```

---

## 🎯 Success Criteria

- [ ] All 114 user skills have .gov.md files
- [ ] All 8 agent tools have .gov.md files
- [ ] Risk Levels assigned to all skills
- [ ] UAT templates linked to registry
- [ ] Main README updated
- [ ] All links validated
- [ ] Pushed to GitHub

---

## 📝 Notes

1. **v1.5.2 skills unchanged** - Only governance metadata added separately
2. **Governance as metadata layer** - Separation of concerns
3. **Scalable** - New skills just need new .gov.md file
4. **Script-assisted** - Bulk generation where possible

---

## 🚀 Next Action

Ready to execute Phase 1 on approval.
