# CVF vs claude-code-templates: Analysis & Gap Report

> **Date:** 2026-02-18  
> **Source:** https://github.com/davila7/claude-code-templates  
> **Analyst:** CVF Framework Team  
> **Purpose:** Extract learnings and identify gaps to enhance CVF Skill Library

---

## 1. Executive Summary

The `claude-code-templates` repository (MIT license, npm package `claude-code-templates@latest`) is a comprehensive CLI tool for configuring AI coding assistants. It aggregates **500+ components** across 6 types from 8+ attribution sources. This analysis identifies **5 major gaps** in CVF's skill library and **4 architectural patterns** worth adopting.

### Key Findings

| Dimension | claude-code-templates | CVF Current | Gap |
|-----------|----------------------|-------------|-----|
| Skill Categories | 18 domains | 12 domains | **+6 new domains needed** |
| Agent Skills | 200+ agents (25 categories) | 14 agent tools | Pattern difference (quantity vs governance) |
| Hooks/Triggers | 10 categories, pre/post-tool | 0 | **Critical gap** |
| Scientific Skills | 139 (biology, chemistry, computational) | 0 | **Major gap** |
| Document Processing | PDF, DOCX, XLSX, PPTX | Basic content_creation | **Functional gap** |
| Workflow Automation | n8n, Zapier, Inngest, Trigger.dev | 0 | **New domain needed** |
| Progressive Disclosure | Core pattern (metadata→instructions→resources→scripts) | Not implemented | **Architectural pattern** |
| Agent Teams | Multi-agent orchestration (dev-team, research-team) | Single-agent skills | **Design pattern gap** |

---

## 2. Repository Architecture Analysis

### 2.1 Component Types (6)

```
┌─────────────────────────────────────────────────────────┐
│                   claude-code-templates                   │
├──────────┬──────────┬──────┬──────────┬──────┬──────────┤
│  Agents  │ Commands │ MCPs │ Settings │Hooks │  Skills  │
│  200+    │  142+    │  10+ │  15+     │ 30+  │  500+    │
│ AI specs │ /slash   │ APIs │ Configs  │Triggers│Modules │
└──────────┴──────────┴──────┴──────────┴──────┴──────────┘
```

### 2.2 Skill Categories (18 domains)

| # | Category | Skill Count | CVF Equivalent | Gap? |
|---|----------|-------------|----------------|------|
| 1 | development | ~120+ | app_development (41) | Partial overlap |
| 2 | scientific | 139 | — | **MISSING** |
| 3 | web-development | ~12 | web_development (5) | Partial overlap |
| 4 | business-marketing | ~50+ | marketing_seo (11) | Partial overlap |
| 5 | security | ~15 | security_compliance (8) | Partial overlap |
| 6 | document-processing | ~10 | content_creation (4) | **MISSING as domain** |
| 7 | workflow-automation | ~8 | — | **MISSING** |
| 8 | creative-design | ~10 | product_ux (14) | Partial overlap |
| 9 | database | ~5 | — | **MISSING** |
| 10 | enterprise-communication | ~5 | business_analysis (6) | Partial overlap |
| 11 | media | ~5 | — | **MISSING** |
| 12 | video | ~5 | — | **MISSING** |
| 13 | analytics | ~3 | finance_analytics (10) | Partial overlap |
| 14 | productivity | ~10 | — | **Subsumed** |
| 15 | railway | ~3 | — | Too specific |
| 16 | sentry | 6 | — | Too specific |
| 17 | utilities | ~10 | — | **Subsumed** |
| 18 | ai-research | ~10 | ai_ml_evaluation (10) | Partial overlap |

### 2.3 Agent Categories (25)

Notable agent team patterns NOT in CVF:
- **deep-research-team** — Multi-agent research orchestration
- **development-team** — Coordinated dev workflow agents
- **mcp-dev-team** — MCP server development specialists
- **podcast-creator-team** — Content pipeline agents
- **ocr-extraction-team** — Document extraction pipeline
- **ffmpeg-clip-team** — Media processing pipeline
- **blockchain-web3** — Decentralized app agents
- **game-development** — Game engine agents

### 2.4 Hook System (10 categories)

| Hook Category | Examples | CVF Parallel |
|--------------|----------|--------------|
| pre-tool | console.log cleaner before production | ❌ None |
| post-tool | PostToolUse automation triggers | ❌ None |
| git-workflow | Commit validation, branch checks | Partial (devops_git_push contract) |
| git | Pre-commit hooks | ❌ None |
| security | Secret scanner (stdin JSON parsing) | Partial (security_compliance skills) |
| monitoring | LangSmith integration | ❌ None |
| automation | Telegram PR webhook notifications | ❌ None |
| testing | Auto-test on code change | ❌ None |
| performance | Performance monitoring hooks | ❌ None |
| development-tools | Debug window, close on session end | ❌ None |

---

## 3. Attribution Sources

The repo aggregates skills from these open-source projects:

| Source | Count | License | Relevance to CVF |
|--------|-------|---------|-------------------|
| K-Dense-AI/claude-scientific-skills | 139 | Open | 🔴 Major gap — CVF has 0 scientific skills |
| antigravity-awesome-skills | 244 | Open | 🟡 Partial overlap with CVF domains |
| anthropics/skills | 21 | Apache 2.0 / Ref | 🟢 Already covered via AGT-009–014 |
| anthropics/claude-code | 10 | Apache 2.0 | 🟢 Already covered |
| obra/superpowers | 14 | Open | 🟡 Workflow patterns partially missing |
| alirezarezvani/claude-skills | 36 | Open | 🟡 Professional roles partially covered |
| wshobson/agents | 48 | Open | 🔴 Agent team patterns missing |
| VoltAgent/awesome-claude-code-subagents | 119 | Open | 🔴 Multi-agent patterns missing |
| OpenAI skills | 21 | Open | 🟡 Cross-platform patterns |
| addyosmani/web-quality-skills | 6 | Open | 🟡 Web quality audit patterns |

---

## 4. Key Architectural Patterns to Adopt

### 4.1 Progressive Disclosure Pattern ⭐

**What it is:** Skills are structured with 4 layers that load incrementally:

```
Layer 1: Metadata    — Always loaded (name, description, triggers)
Layer 2: Instructions — Loaded when skill is activated
Layer 3: Resources    — Reference files loaded only when needed
Layer 4: Scripts      — Execute without loading code into context
```

**Why CVF should adopt:** Reduces context window usage, improves performance, enables lazy-loading of skill instructions.

**CVF Implementation:** Create a `PROGRESSIVE_DISCLOSURE_GUIDE.md` as a standard for writing CVF skills.

### 4.2 Agent Teams Pattern ⭐

**What it is:** Multiple specialized agents collaborate as a coordinated unit:

```
┌──────────────────────────────────┐
│       Agent Team Orchestrator     │
├──────────┬──────────┬────────────┤
│ Planner  │ Executor │ Reviewer   │
│ Agent    │ Agent    │ Agent      │
└──────────┴──────────┴────────────┘
```

**Examples from repo:**
- `deep-research-team`: Research → Analyze → Synthesize → Present
- `development-team`: Design → Code → Test → Review
- `podcast-creator-team`: Script → Record → Edit → Publish

**CVF Implementation:** New AGT-018 Agent Team Orchestrator skill.

### 4.3 Hook/Trigger System ⭐

**What it is:** Automation scripts that run before or after specific AI tool actions:

```
PreToolUse  → [Security Check] → Tool Executes → [PostToolUse] → Log Result
                secret-scanner                      auto-test
                lint-check                          notification
```

**CVF Implementation:** New AGT-015 Workflow Automation Hook skill.

### 4.4 Skill Composability Pattern

**What it is:** Skills reference and chain to each other:

```
systematic-debugging
  └─ references: test-driven-development (Phase 4, Step 1)
  └─ references: verification-before-completion (Phase 4 verify)
  └─ includes: root-cause-tracing.md, defense-in-depth.md, condition-based-waiting.md
```

**CVF Implementation:** Add `dependencies` and `references` fields to CVF_SKILL_SPEC.

---

## 5. Gap Analysis: New Skills for CVF

Based on this analysis, **6 new agent skills** are recommended:

| New ID | Skill Name | Risk | Inspired By |
|--------|-----------|------|-------------|
| AGT-015 | Workflow Automation Hook | R2 | Hooks system (pre/post-tool triggers, security scanners) |
| AGT-016 | Scientific Research Assistant | R1 | 139 scientific skills (literature review, data analysis) |
| AGT-017 | Document Format Converter | R1 | Document Processing (PDF, DOCX, XLSX, PPTX) |
| AGT-018 | Agent Team Orchestrator | R3 | Multi-agent teams (dev-team, research-team) |
| AGT-019 | Skill Progressive Loader | R0 | Progressive disclosure pattern |
| AGT-020 | Analytics Dashboard Generator | R1 | Real-time analytics dashboard |

### New Risk Distribution (after additions)

| Risk Level | Before | After | Skills |
|------------|--------|-------|--------|
| R0 – Minimal | 3 | **4** | +Skill Progressive Loader |
| R1 – Low | 3 | **6** | +Scientific Research, Document Converter, Analytics Dashboard |
| R2 – Medium | 5 | **6** | +Workflow Automation Hook |
| R3 – High | 3 | **4** | +Agent Team Orchestrator |
| R4 – Critical | 0 | 0 | — |
| **Total** | **14** | **20** | +6 new skills |

---

## 6. Domain Expansion Recommendations

### 6.1 New Domains for User Skills

| Proposed Domain | Source Inspiration | Suggested Skills |
|----------------|-------------------|------------------|
| scientific_research | K-Dense-AI (139 skills) | literature-review, hypothesis-generation, data-visualization, statistical-analysis, citation-management |
| workflow_automation | n8n, Zapier, Inngest, Trigger.dev | ci-cd-pipeline, webhook-manager, event-trigger, scheduled-task |
| document_processing | PDF/DOCX/XLSX/PPTX skills | pdf-extraction, spreadsheet-analysis, presentation-builder, format-converter |
| media_production | video, media, podcast teams | video-editing, audio-processing, image-generation, content-pipeline |

### 6.2 Enhancement to Existing Domains

| Domain | Current | Enhancement |
|--------|---------|-------------|
| app_development (41) | General app dev | Add: systematic-debugging, TDD-workflow, playwright-testing, subagent-driven-dev |
| web_development (5) | Basic web | Add: core-web-vitals, SEO-audit, web-performance-optimization, accessibility |
| security_compliance (8) | General security | Add: secret-scanner, pre-commit-hooks, security-audit-automation |

---

## 7. Skill Format Comparison

### claude-code-templates Format (SKILL.md)

```markdown
---
name: systematic-debugging
description: Use when encountering any bug...
---

# Systematic Debugging

## Overview
[Instructions loaded on activation]

## When to Use
[Trigger conditions]

## The Four Phases
[Detailed methodology]

## Supporting Techniques
[References to other skills and included .md files]
```

**Supporting files:** `.ts` examples, `.sh` scripts, `.md` reference docs

### CVF Format (.skill.md / .gov.md)

```markdown
# AGT-XXX: Skill Name
> **Type:** Agent Skill
> **Domain:** Category
> **Status:** Active

## Capability
[What the skill does]

## Governance
[Risk, Roles, Phases, Autonomy]

## Constraints
[✅ Can / ❌ Cannot]

## UAT Binding
[PASS/FAIL criteria]
```

### Recommendation

CVF's governance-first approach is **stronger** for enterprise use but should adopt:
1. **Progressive disclosure layers** (metadata → instructions → resources)
2. **Skill references/dependencies** (composability)
3. **Example scripts** alongside governance docs

---

## 8. Summary of Actions Taken

1. ✅ Created 6 new agent skills (AGT-015 to AGT-020)
2. ✅ Created 6 `.gov.md` governance records
3. ✅ Updated INDEX.md (14 → 20 skills)
4. ✅ Created Progressive Disclosure Guide
5. ✅ Created bilingual documentation page
6. ✅ Updated docs-data.ts with new tutorial
7. ✅ All tests pass

---

## 9. References

- **claude-code-templates repo:** https://github.com/davila7/claude-code-templates
- **K-Dense-AI scientific skills:** https://github.com/K-Dense-AI/claude-scientific-skills
- **Anthropic official skills:** https://github.com/anthropics/skills
- **obra/superpowers:** https://github.com/obra/superpowers
- **CVF Skill Spec:** `governance/skill-library/specs/CVF_SKILL_SPEC.md`
- **CVF Risk Authority Mapping:** `governance/skill-library/specs/CVF_RISK_AUTHORITY_MAPPING.md`
