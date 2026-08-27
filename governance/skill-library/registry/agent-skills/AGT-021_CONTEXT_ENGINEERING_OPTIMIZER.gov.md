# AGT-021: Context Engineering Optimizer

Text Encoding Exception: preserves pre-existing Unicode punctuation and symbols during semantic-preserving structural normalization.

> **Category:** Agent Intelligence
> **Status:** Active
> **Version:** 1.0.0
> **Created:** 2026-02-18
> **Source:** claudekit-skills → context-engineering (mrgoonie/claudekit-skills)

---

## Source

- **Provenance:** claudekit-skills/context-engineering (mrgoonie/claudekit-skills)
- **Source link:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) — context-engineering skill
- **License:** MIT (source) → CC BY-NC-ND 4.0 (CVF adaptation)
- **CVF Adaptation:** Added governance constraints, risk classification, phase mapping, metric thresholds
- **Pattern Type:** Framework-level context optimization methodology

---

## Capability

Framework-level skill for **optimizing token context** in agent workflow. Not a concrete tool — a methodology for the agent to manage its own context quality, detect degradation, and perform compaction when needed.

- **Context Health Analysis** — Measure token utilization, detect degradation patterns
- **Four-Bucket Strategy** — Write (save external) → Select (pull relevant) → Compress (reduce tokens) → Isolate (split sub-agents)
- **Compaction Triggers** — Auto-trigger at 70-80% context utilization
- **Attention Position Optimization** — Place critical info at beginning/end (U-shaped curve)
- **Cache Hit Rate Monitoring** — Target 70%+ for stable workloads
- **Multi-Agent Cost Tracking** — Baseline: ~15x single agent cost
- **Degradation Detection** — Lost-in-middle, poisoning, hallucination triggers

**Key Principle:** Context quality > context quantity. High-signal tokens beat exhaustive content.

### Anti-Patterns Detected

| Anti-Pattern | Correction |
|-------------|------------|
| Exhaustive context loading | Curated high-signal tokens only |
| Critical info in middle positions | Move to beginning/end |
| No compaction before limits | Trigger at 70-80% utilization |
| Single agent for parallel tasks | Isolate via sub-agents |
| Tools without descriptions | 4-question framework: what, when, inputs, returns |

### Key Metrics

| Metric | Warning | Critical / Action |
|--------|---------|--------|
| Token utilization | 70% | Trigger optimization at 80% |
| Token variance | Explains 80% of performance | Monitor continuously |
| Compaction quality loss | >5% | >10% |
| Compaction target | 50-70% reduction | < 5% quality loss |
| Cache hit rate | <70% | <50% |
| Relevant info ratio | <50% | <30% |

Legacy action retained: when cache hit rate falls below 70%, optimize prompt
structure.

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R1 – Low** |
| Autonomy | Auto + Audit |
| Category | Agent Intelligence |
| Allowed Roles | Orchestrator, Architect, Builder, Reviewer |
| Allowed Phases | Discovery, Design, Build, Review (All) |
| Requires Approval | false |
| Audit Log | true |
| Max Token Budget | 2000 |
| Fallback on Failure | Report context health metrics without optimization |

Evidence reconciliation: the corrupted flattened header stated `Auto`, while
the readable governance summary and trailing metadata stated `Auto + Audit`
and `auto_audit`. The conservative canonical value `Auto + Audit` is retained.

### Authority Mapping

| Role | Permission |
|------|-----------|
| Orchestrator | Full: analyze, recommend, auto-compact |
| Architect | Full: design context strategies |
| Builder | Read: apply strategies, report utilization |
| Reviewer | Read: audit context quality reports |

### Phase Applicability

| Phase | Usage |
|-------|-------|
| A – Discovery | Analyze context requirements |
| B – Design | Design compaction & isolation strategies |
| C – Build | Apply optimization during execution |
| D – Review | Audit context quality, measure improvements |

---

## Risk Justification

- **R1 – Low risk** — read/analysis and compaction guidance operating on the agent's own context, no external I/O
- MUST alert when approaching 80% utilization threshold
- MUST preserve semantic equivalence after compression (>95% fidelity)
- MUST log all compaction decisions for audit trail
- MUST NOT delete user-provided context without HITL approval

---

## Constraints

- MUST alert when approaching 80% utilization threshold
- MUST preserve semantic equivalence after compression (>95% fidelity)
- MUST log all compaction decisions for audit trail
- MUST NOT delete user-provided context without HITL approval

### Anti-Patterns (CVF-Governed)

- ❌ Exhaustive context over curated context
- ❌ Critical info in middle positions (attention dead zone)
- ❌ No compaction triggers before limits
- ❌ Single agent for parallelizable tasks
- ❌ Tools without clear descriptions

---

## Dependencies

- **AGT-019** (Skill Progressive Loader) — Uses progressive disclosure for skill loading (runtime loading dependency)
- **AGT-018** (Agent Team Orchestrator) — Context isolation via sub-agents (complements)
- **AGT-012** (Agentic Loop Controller) — Compaction within iterative loops (complements)

---

## Validation

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Token savings per session | ≥30% reduction |
| Relevant information ratio | ≥80% |
| Quality loss after compaction | <5% |
| Degradation detection accuracy | ≥90% |

---

## UAT Binding

**UAT Link:** `governance/skill-library/uat/results/UAT-AGT-021.md`

**PASS criteria:**
- [ ] Token savings per session ≥30% reduction
- [ ] Relevant information ratio ≥80%
- [ ] Quality loss after compaction <5%
- [ ] Degradation detection accuracy ≥90%
- [ ] All compaction decisions logged for audit trail

**FAIL criteria:**
- [ ] User-provided context deleted without HITL approval
- [ ] No alert raised approaching 80% utilization threshold
- [ ] Semantic fidelity after compression falls below 95%
- [ ] Compaction decisions not logged

---

*Last Updated: February 18, 2026*
