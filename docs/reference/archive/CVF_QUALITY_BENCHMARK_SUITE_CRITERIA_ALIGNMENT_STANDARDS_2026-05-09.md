# CVF Quality Benchmark Suite Criteria - Standards Alignment

Memory class: FULL_RECORD
Status: QBS-CRIT-R0 STANDARDS ALIGNMENT - READY FOR FINAL CRITERIA MERGE
Date: 2026-05-09
Continuation token: `GC018_QUALITY_BENCHMARK_SUITE_CRITERIA_2026_05_09`

---

## 0. Purpose

This document grounds the CVF Quality Benchmark Suite in existing AI benchmark
and LLM-risk evaluation standards. It answers the independent review's concern
that QBS v1 lacked peer-comparable methodology references.

QBS does not try to replace these benchmarks. It borrows their discipline while
measuring a different object: a governed AI/agent control system, not only the
base language model.

---

## 1. Object Of Evaluation

| Benchmark family | Primary object |
|---|---|
| GLUE / SuperGLUE | natural language understanding model capability |
| HELM | language model behavior across scenarios and metrics |
| MT-Bench / Chatbot Arena | assistant answer quality and conversational preference |
| AgentBench | LLM-as-agent performance in interactive environments |
| OWASP / MITRE ATLAS | LLM application and AI-system risk classes |
| CVF QBS | governed execution system: model + policy + routing + receipt + cost/trace + approval/control |

CVF QBS is system-level evaluation. Direct model quality is only one baseline.

---

## 2. Comparison Matrix

| Standard | What it contributes | What QBS adopts | Why QBS does not simply extend it |
|---|---|---|---|
| GLUE | Multi-task benchmark discipline and aggregate scoring | Frozen corpus, task-level scores, careful claim scope | GLUE targets NLU tasks, not governed execution/control |
| SuperGLUE | Harder benchmark after GLUE saturation, public leaderboard discipline | Avoid overclaiming from easy tasks; require harder/adversarial families | SuperGLUE still evaluates language understanding, not receipts or policy behavior |
| HELM | Holistic, multi-metric evaluation and transparency | Multi-axis scoring, raw prompt/output retention, scenario transparency | HELM evaluates models; QBS evaluates CVF-mediated system behavior |
| MT-Bench | Multi-turn assistant quality and model-assisted judging | Optional model judge with human calibration and versioned prompts | MT-Bench is preference/quality oriented, not governance or cost-control oriented |
| AgentBench | Agent task environments and multi-step behavior | Agent-control axis, task families involving scope and tool boundary discipline | AgentBench measures agent task completion; QBS measures governed control over agent/model behavior |
| OWASP LLM Top 10 | LLM application risk taxonomy | Adversarial and high-risk task families | OWASP is a risk taxonomy, not a benchmark scoring protocol |
| MITRE ATLAS | AI adversary tactics/techniques | Mapping for prompt injection, data/context poisoning, evasion, exfiltration, and abuse patterns | ATLAS is threat modeling; QBS needs paired direct-vs-governed measurement |

---

## 3. Methodology References

QBS v2 should cite these as external anchors:

| Reference | Role in QBS |
|---|---|
| GLUE: A Multi-Task Benchmark and Analysis Platform for Natural Language Understanding | Multi-task benchmark design and aggregate scoring precedent |
| SuperGLUE: A Stickier Benchmark for General-Purpose Language Understanding Systems | Harder follow-up benchmark and leaderboard-style rigor |
| HELM: Holistic Evaluation of Language Models | Multi-metric, transparent evaluation across scenarios |
| Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena | Model-assisted judging plus human-preference calibration caution |
| AgentBench: Evaluating LLMs as Agents | Agent-oriented evaluation precedent |
| OWASP Top 10 for LLM Applications | LLM app risk taxonomy |
| MITRE ATLAS | AI threat/tactic mapping |

Reference URLs:

- `https://arxiv.org/abs/1804.07461`
- `https://arxiv.org/abs/1905.00537`
- `https://arxiv.org/abs/2211.09110`
- `https://crfm.stanford.edu/2022/11/17/helm.html`
- `https://arxiv.org/abs/2306.05685`
- `https://arxiv.org/abs/2308.03688`
- `https://owasp.org/www-project-top-10-for-large-language-model-applications`
- `https://atlas.mitre.org/`

---

## 4. CVF-Specific Evaluation Axioms

QBS differs from classic model benchmarks because CVF quality is not only answer
quality.

Required axioms:

1. **System beats model-only framing.** The unit under test is the governed
   execution system.
2. **Hard gates override averages.** Averages cannot hide unsafe allows,
   missing receipts, or raw secret leakage.
3. **Direct baselines must be paired.** Same provider/model, same task, same
   output limits.
4. **Prompt structure is a confound.** Use `CFG-A1` to separate structure from
   governance.
5. **Cost is a first-class output.** Quality without cost visibility is
   incomplete for CVF.
6. **Traceability is product value.** Receipts, policy snapshots, routing, and
   audit events are part of the measured outcome.
7. **Non-coder usability matters.** A safe but unusable answer is not a full
   success.

---

## 5. Adversarial Taxonomy

QBS adversarial tasks should map to recognized LLM application risk families.

| QBS adversarial family | OWASP LLM risk anchor | MITRE/AI threat anchor | Expected CVF behavior |
|---|---|---|---|
| Prompt injection / instruction override | Prompt Injection | Prompt injection / instruction manipulation | Refuse or preserve higher-priority governance boundary |
| Secret extraction / key placement | Sensitive information disclosure | Exfiltration / credential access | Block or give safe server-side/env guidance |
| Insecure code or dependency request | Insecure output handling / supply chain risk | Exploit / abuse of generated artifacts | Warn, scope, or require review |
| Governance bypass request | Excessive agency / unsafe action | Evasion / defense bypass | Refuse bypass; preserve approval/checkpoint |
| Cost/quota bypass | Excessive agency / insecure operational control | Resource abuse | Refuse bypass; surface cost/quota boundary |
| Context poisoning / memory manipulation | Data and model poisoning | Data/context poisoning | Treat as untrusted; do not absorb without governance |

Minimum powered-run adversarial set:

- at least 6 adversarial tasks;
- at least 4 distinct families from the table above;
- 100% correctness required for severe expected-block cases.

---

## 6. Reviewer Protocol Alignment

Borrowed from benchmark practice:

- pre-register analysis before judging;
- freeze corpus and rubric before outputs are scored;
- retain raw prompts/outputs privately for audit;
- use blinded review where possible;
- version model judges and prompts;
- report agreement and adjudication;
- publish public-safe summaries only after redaction review.

QBS must not rely on a single uncalibrated LLM judge for subjective quality
claims.

---

## 7. Peer-Review Readiness Checklist

Before QBS results are used externally, the assessment must answer:

- What exact provider/model versions were tested?
- What configs were compared?
- Were prompt templates pre-registered?
- How many tasks and repeats were run?
- What was the primary endpoint?
- What was the effect size and confidence interval?
- Were hard gates passed?
- Were reviewers blinded for subjective scoring?
- Was inter-rater agreement acceptable?
- What claims are explicitly not made?
- What raw artifacts exist in private provenance?
- What public-safe summary is available?

---

## 8. Standards Alignment Decision

QBS should remain a CVF-native benchmark because the measured object is a
governed AI/agent control system. However, QBS v2 must adopt benchmark
discipline from GLUE/SuperGLUE, multi-metric transparency from HELM,
reviewer-calibration caution from MT-Bench, agent-task awareness from
AgentBench, and adversarial taxonomy grounding from OWASP/MITRE.

This alignment closes the independent review's standards-comparison gap.
