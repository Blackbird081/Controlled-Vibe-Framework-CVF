# CVF Analysis: ClaudeKit-Skills Repository

> **Date:** February 18, 2026
> **Source:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) (forked as Blackbird081/claudekit-skills)
> **Analyst:** CVF Governance Team
> **Purpose:** Extract framework-level patterns for CVF agent skill library

---

## 1. Executive Summary

ClaudeKit-Skills is a curated collection of **30+ Agent Skills** for Claude Code, organized into 12 plugin categories. Created by @mrgoonie, it represents one of the most mature ecosystem of Claude Code skills with production-tested patterns for context engineering, debugging, problem-solving, and MCP management.

**Key insight from ClaudeKit:** Skills ≠ Documentation. Skills are **active workflow capabilities**, not passive reference material. This philosophical distinction aligns with CVF's governance-first approach.

### What CVF Extracted (Framework Patterns Only)

| New Skill | Pattern | CVF ID |
|-----------|---------|--------|
| Context Engineering Optimizer | Token management, degradation detection, compaction | AGT-021 |
| Problem-Solving Framework Router | Stuck-type → technique dispatch | AGT-022 |
| Systematic Debugging Engine | 4-phase root cause methodology | AGT-023 |
| MCP Context Isolation Manager | Subagent-based MCP delegation | AGT-024 |

**Total CVF agent skills: 20 → 24**

---

## 2. Repository Overview

### Architecture

```
claudekit-skills/
├── .claude-plugin/marketplace.json    ← Plugin marketplace config (12 plugins)
├── .claude/skills/                    ← Actual skill implementations
│   ├── context-engineering/           ← SKILL.md + references/ + scripts/ + tests/
│   ├── debugging/                     ← 4 sub-skills (defense-in-depth, root-cause-tracing, etc.)
│   ├── problem-solving/               ← 6 techniques (collision-zone, inversion, etc.)
│   ├── code-review/                   ← Verification gates pattern
│   ├── mcp-management/               ← MCP server management
│   └── ... (30+ total)
├── docs/                              ← Documentation
└── plugins/                           ← Plugin bundles
```

### Stats
- **Skills:** 30+ (consolidated from 36 tool-specific → 20 workflow-capability groups)
- **Languages:** Python 87.1%, JavaScript 12.1%, Shell 0.8%
- **Plugin Categories:** 12 (ai-ml, web-dev, devops, backend, document, debugging, problem-solving, platform, meta, media, research, specialized)
- **License:** MIT
- **Author:** mrgoonie (@mrgoonie) / ClaudeKit.cc

---

## 3. Key Architectural Insights

### 3.1 Skill Refactoring Philosophy (REFACTOR.md)

ClaudeKit's author documented a critical lesson:

> "I was wrong about Agent Skills. I treated them like documentation dumps instead of context engineering problems."

**Before refactoring:**
- 36 individual skills, 15,000 lines total
- Loading 5-7 skills = 5,000-7,000 lines flooding context
- Relevant information ratio: ~10%

**After refactoring:**
- 20 focused skill groups, 2,200 lines initial load
- 85% reduction on activation
- Relevant information ratio: ~90%

**CVF Alignment:** This validates CVF's Progressive Disclosure Guide (AGT-019) and 4-layer architecture. ClaudeKit discovered through trial-and-error what CVF designed from governance principles.

### 3.2 The 200-Line Rule

ClaudeKit established that SKILL.md entry points should be **≤200 lines**:

```
Tier 1: Metadata (~100 words)     — Always loaded, just for relevance check
Tier 2: SKILL.md (~200 lines max) — Overview + navigation map
Tier 3: References (~200-300 lines each) — Loaded on-demand
```

**CVF Alignment:** Maps directly to CVF's 4-layer model:
| CVF Layer | ClaudeKit Tier | Purpose |
|-----------|---------------|---------|
| Metadata (~50 tokens) | Tier 1: YAML frontmatter | Relevance check |
| Instructions (~200 lines) | Tier 2: SKILL.md | Entry point |
| Resources (on-demand) | Tier 3: References | Detail content |
| Scripts (never auto-loaded) | Scripts directory | Executable code |

### 3.3 Skills = Capabilities, Not Documentation

> "Skills should be organized by workflow capabilities, not by tools."

- ❌ "Here's everything about Cloudflare" (tool-centric)
- ✅ "Here's how to handle DevOps deployment" (capability-centric)

**CVF Alignment:** CVF's governance model already organizes by capability (Safe/Data/External/High-Risk operations), confirming this approach.

### 3.4 MCP Context Isolation Pattern

ClaudeKit solved MCP context bloat by:
1. Moving `.mcp.json` away from main agent discovery
2. Creating "mcp-manager" subagent with mcp-management skill
3. Subagent handles: discover tools → select → execute → return result only
4. Main context stays clean even with 80+ MCP servers

**CVF Adaptation:** Created AGT-024 (MCP Context Isolation Manager) with CVF governance constraints.

---

## 4. Gap Analysis: ClaudeKit vs CVF

### Already Covered in CVF (no action needed)
| ClaudeKit Skill | CVF Equivalent |
|-----------------|----------------|
| web-frameworks | USR-* (web_development domain, 5 skills) |
| databases | USR-* (app_development domain) |
| ai-multimodal | AGT-010 (Data Viz) + AGT-016 (Scientific Research) |
| devops | EXTENSIONS/CVF_v1.3 (CI/CD templates) |
| chrome-devtools | AGT-013 (Browser Automation) |
| document-skills | AGT-011 (Doc Parser) + AGT-017 (Doc Converter) |
| mcp-builder | AGT-014 (MCP Connector) |
| skill-creator | CVF Skill Template + SKILL_SPEC.md |
| sequential-thinking | CVF 4-Phase Process (Discovery→Design→Build→Review) |
| mermaidjs-v11 | AGT-010 (Data Visualization) |

### New in CVF (extracted from ClaudeKit)
| ClaudeKit Pattern | New CVF Skill | Why Framework-Level |
|-------------------|---------------|---------------------|
| context-engineering | AGT-021 | Methodology for agent self-optimization, not a specific tool |
| problem-solving/* (6 techniques) | AGT-022 | Meta-skill dispatch pattern, not individual technique copy |
| debugging/* (4 sub-skills) | AGT-023 | 4-phase methodology with governance gates, not tool-specific debugging |
| mcp-management + subagent | AGT-024 | Architectural pattern for context isolation, not MCP implementation |

### Not Adopted (tool-specific, not framework-level)
| ClaudeKit Skill | Reason Not Adopted |
|-----------------|-------------------|
| better-auth | Too specific (BetterAuth library) |
| shopify | Platform-specific |
| payment-integration | Domain-specific (SePay, Stripe, etc.) |
| aesthetic | Design philosophy, not governance pattern |
| frontend-design | Too specific to React/MUI |
| backend-development | Too specific to Node.js/Python/Go |
| google-adk-python | Vendor-specific (Google ADK) |
| repomix | Specific tool, not pattern |
| threejs | Vendor-specific (Three.js) |
| media-processing | Specific tools (FFmpeg/ImageMagick) |
| docs-seeker | Specific implementation |

---

## 5. Skill Format Comparison

| Aspect | ClaudeKit | CVF |
|--------|-----------|-----|
| Entry point | SKILL.md (≤200 lines) | .skill.md / .gov.md |
| Metadata | YAML frontmatter (name, description, when_to_use) | YAML governance block (risk, roles, phases, constraints) |
| Structure | SKILL.md + references/ + scripts/ + tests/ | .gov.md + governance specs + UAT records |
| Governance | None (no risk model) | R0-R4 risk levels, authority matrix, phase gates |
| Distribution | .claude-plugin marketplace | governance/skill-library registry |
| Versioning | Per-skill version field | CVF version + skill version |
| Testing | Optional tests/ directory | Mandatory UAT framework |
| Audit trail | None | Required for R1+ skills |

**Key Difference:** ClaudeKit optimizes for **developer productivity** (load fast, execute well). CVF optimizes for **controlled governance** (who can, when, how safely). These are complementary, not competing.

---

## 6. Lessons Applied to CVF

### 6.1 Validated Patterns
1. **Progressive Disclosure** — CVF's AGT-019 already implements this correctly
2. **Capability-Centric Organization** — CVF's category model aligns perfectly
3. **200-Line Rule** — CVF should adopt as specification in SKILL_SPEC

### 6.2 New Patterns Adopted
1. **Context Engineering as Discipline** — Not just "load less" but systematic token optimization
2. **Problem-Solving Dispatch** — Route to correct technique instead of random approaches
3. **Debugging Methodology** — Evidence-before-claims, Iron Law (no fix without root cause)
4. **MCP Isolation Architecture** — Keep main context clean via subagent delegation

### 6.3 Philosophical Alignment

> CVF: "Agent AI không được cấp quyền dựa trên trí thông minh, mà dựa trên mức độ kiểm soát."
> ClaudeKit: "Context engineering isn't about loading more information. It's about loading the right information at the right time."

Both frameworks agree: **quality over quantity, control over freedom.**

---

## 7. References

- [ClaudeKit-Skills Repository](https://github.com/mrgoonie/claudekit-skills)
- [REFACTOR.md — Why skills ≠ documentation](https://github.com/mrgoonie/claudekit-skills/blob/main/REFACTOR.md)
- [MCP Management Pattern](https://github.com/mrgoonie/claudekit-skills/blob/main/MCP_MANAGEMENT.md)
- [Anthropic Agent Skills Documentation](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [CVF Progressive Disclosure Guide](CVF_PROGRESSIVE_DISCLOSURE_GUIDE.md)
- [CVF Claude Code Templates Analysis (prior)](CVF_CLAUDE_CODE_TEMPLATES_ANALYSIS_2026-02-18.md)

---

*Generated: February 18, 2026 | CVF v1.6.3*
