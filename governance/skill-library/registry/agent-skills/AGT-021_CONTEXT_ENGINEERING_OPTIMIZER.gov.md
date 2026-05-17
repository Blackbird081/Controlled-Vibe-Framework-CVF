# AGT-021: Context Engineering Optimizer# AGT-021: Context Engineering Optimizer






































































































*Last Updated: February 18, 2026*---- **License:** MIT (source) → CC BY-NC-ND 4.0 (CVF adaptation)- **CVF Adaptation:** Added governance constraints, risk classification, phase mapping, metric thresholds- **Pattern Type:** Framework-level context optimization methodology- **Source:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) — context-engineering skill## 📚 Attribution---`governance/skill-library/uat/results/UAT-AGT-021.md`### UAT Link| Degradation detection accuracy | ≥90% || Quality loss after compaction | <5% || Relevant information ratio | ≥80% || Token savings per session | ≥30% reduction ||-----------|--------|| Criterion | Target |### Success Criteria## 📊 Validation---- **AGT-012** (Agentic Loop Controller) — Compaction within iterative loops- **AGT-018** (Agent Team Orchestrator) — Context isolation via sub-agents- **AGT-019** (Skill Progressive Loader) — Uses progressive disclosure for skill loading## 🔗 Dependencies---- MUST alert when approaching 80% utilization threshold- MUST preserve semantic equivalence after compression (>95% fidelity)- MUST log all compaction decisions for audit trail- MUST NOT delete user-provided context without HITL approval### Constraints| D – Review | Audit context quality, measure improvements || C – Build | Apply optimization during execution || B – Design | Design compaction & isolation strategies || A – Discovery | Analyze context requirements ||-------|-------|| Phase | Usage |### Phase Applicability| Reviewer | Read: audit context quality reports || Builder | Read: apply strategies, report utilization || Architect | Full: design context strategies || Orchestrator | Full: analyze, recommend, auto-compact ||------|-----------|| Role | Permission |### Authority Mapping## 🔐 CVF Governance---- ❌ Tools without clear descriptions- ❌ Single agent for parallelizable tasks- ❌ No compaction triggers before limits- ❌ Critical info in middle positions (attention dead zone)- ❌ Exhaustive context over curated context### Anti-Patterns (CVF-Governed)| Compaction quality loss | >5% | >10% || Cache hit rate | <70% | <50% || Relevant info ratio | <50% | <30% || Token utilization | 70% | 80% ||--------|---------|----------|| Metric | Warning | Critical |### Key Metrics5. **Degradation Detection** — Lost-in-middle, poisoning, hallucination triggers4. **Four-Bucket Optimization**: Write → Select → Compress → Isolate3. **Attention Positioning** — Place critical information at beginning/end (U-shaped curve)2. **Compaction Strategy** — Summarize/evict low-signal tokens at 70-80% utilization1. **Context Health Analysis** — Monitor token utilization, detect degradation patterns### Core Functions## 🎯 Capabilities---**Key Principle:** Context quality > context quantity. High-signal tokens beat exhaustive content.Framework skill for managing AI agent context quality, degradation prevention, and optimization. Teaches agents HOW to manage their own context window — not just what to load, but when to compact, what to evict, and how to measure quality.## 📋 Overview---> **Provenance:** claudekit-skills/context-engineering (mrgoonie/claudekit-skills)> **Category:** Agent Intelligence  > **Autonomy:** Auto  > **Risk Level:** R1 – Low  > **Status:** Active  > **Version:** 1.0.0  
> **Status:** Active
> **Risk Level:** R1 – Low
> **Autonomy:** Auto + Audit
> **Version:** 1.0.0
> **Created:** 2026-02-18
> **Source:** claudekit-skills → context-engineering (mrgoonie/claudekit-skills)

---

## Purpose

Framework-level skill cho việc **tối ưu hóa token context** trong agent workflow. Không phải tool cụ thể — mà là phương pháp luận để agent tự quản lý context quality, phát hiện degradation, và thực hiện compaction khi cần.

## Capability

- **Context Health Analysis** — Đo token utilization, phát hiện degradation patterns
- **Four-Bucket Strategy** — Write (save external) → Select (pull relevant) → Compress (reduce tokens) → Isolate (split sub-agents)
- **Compaction Triggers** — Auto-trigger at 70-80% context utilization
- **Attention Position Optimization** — Place critical info at beginning/end (U-shaped curve)
- **Cache Hit Rate Monitoring** — Target 70%+ for stable workloads
- **Multi-Agent Cost Tracking** — Baseline: ~15x single agent cost

## Anti-Patterns Detected

| Anti-Pattern | Correction |
|-------------|------------|
| Exhaustive context loading | Curated high-signal tokens only |
| Critical info in middle positions | Move to beginning/end |
| No compaction before limits | Trigger at 70-80% utilization |
| Single agent for parallel tasks | Isolate via sub-agents |
| Tools without descriptions | 4-question framework: what, when, inputs, returns |

## Key Metrics

| Metric | Warning | Action |
|--------|---------|--------|
| Token utilization | 70% | Trigger optimization at 80% |
| Token variance | Explains 80% of performance | Monitor continuously |
| Compaction target | 50-70% reduction | < 5% quality loss |
| Cache hit rate | Below 70% | Optimize prompt structure |

## Integration

- **Depends on:** AGT-019 (Skill Progressive Loader) — runtime loading
- **Complements:** AGT-018 (Agent Team Orchestrator) — multi-agent context isolation
- **Complements:** AGT-012 (Agentic Loop Controller) — loop context management

---

## Governance Summary

```yaml
skill_id: AGT-021
skill_name: Context Engineering Optimizer
risk_level: R1
autonomy: auto_audit
allowed_roles:
  - Orchestrator
  - Architect
  - Builder
  - Reviewer
allowed_phases:
  - Discovery
  - Design
  - Build
  - Review
requires_approval: false
audit_log: true
max_token_budget: 2000
fallback_on_failure: "Report context health metrics without optimization"
```

## CVF Compliance

- [x] Risk level assigned (R1)
- [x] Authority mapping defined
- [x] Phase restrictions set (All)
- [x] Audit logging enabled
- [x] Fallback behavior specified
- [x] Source attribution documented
