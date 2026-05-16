# CVF Quality Benchmark Suite Standards Alignment

Memory class: POINTER_RECORD

Status: `PUBLIC_METHODOLOGY`

## Purpose

Explain how the CVF Quality Benchmark Suite (QBS) relates to existing
benchmark and risk-evaluation traditions, so external evaluators can map
QBS results onto familiar reference frames without expecting parity.

## Scope

Public alignment commentary across NLP, agent, and risk benchmark families.
This file does not contain scored-run results or methodology body details.

## Rule

QBS borrows discipline from existing benchmarks but measures a different
object: a governed AI/agent control system, not only the base language
model. Public CVF docs must respect this distinction when referencing other
benchmark families.

## Requirements

Any external comparison must (a) name the other benchmark, (b) name the
evaluation object on both sides, (c) flag the differences in evaluation
object (model vs governed system), and (d) avoid implying that a QBS run
result substitutes for a public score on the other benchmark.

## Exceptions

No public override path exists. If a future tranche needs to claim parity
with another benchmark, it must publish that claim through a fresh
methodology revision and a scored run that targets the parity claim
directly.

## Enforcement Surface

Public docs, READMEs, and external communication. The CVF claim-boundary
file (`../evidence/claim-boundaries.md`) blocks contradictory claims.

## Related Artifacts

- `quality-benchmark-suite-methodology.md`
- `quality-benchmark-suite-claim-ladder.md`
- `../evidence/claim-boundaries.md`

## 1. Object Of Evaluation

| Benchmark Family | Primary Object |
|---|---|
| GLUE / SuperGLUE | Natural language understanding model capability. |
| HELM | Language model behavior across scenarios and metrics. |
| MT-Bench / Chatbot Arena | Assistant answer quality and conversational preference. |
| AgentBench | LLM-as-agent performance in interactive environments. |
| OWASP / MITRE ATLAS | LLM application and AI-system risk classes. |
| NIST AI RMF | AI risk management functions and trustworthy AI characteristics. |
| ISO/IEC 42001 | AI management system requirements. |
| EU AI Act | Legal risk classes and high-risk AI governance obligations. |
| MLCommons AILuminate | AI risk and reliability benchmark practice. |
| CVF QBS | Governed execution system: model + policy + routing + receipt + cost/trace + approval/control. |

CVF QBS is system-level evaluation. Direct model quality is one baseline, not
the full object being measured.

## 2. Comparison Matrix

| Standard | What It Contributes | What QBS Adopts | Why QBS Does Not Simply Extend It |
|---|---|---|---|
| GLUE | Multi-task benchmark discipline and aggregate scoring. | Frozen corpus, task-level scores, careful claim scope. | GLUE targets NLU tasks, not governed execution/control. |
| SuperGLUE | Harder benchmark after GLUE saturation and leaderboard discipline. | Avoid overclaiming from easy tasks; require harder/adversarial families. | SuperGLUE evaluates language understanding, not receipts or policy behavior. |
| HELM | Holistic, multi-metric evaluation and transparency. | Multi-axis scoring, raw prompt/output retention, scenario transparency. | HELM evaluates models; QBS evaluates CVF-mediated system behavior. |
| MT-Bench | Multi-turn assistant quality and model-assisted judging. | Optional model judge with human calibration and versioned prompts. | MT-Bench is preference/quality oriented, not governance or cost-control oriented. |
| AgentBench | Agent task environments and multi-step behavior. | Agent-control axis and tasks involving scope/tool-boundary discipline. | AgentBench measures agent task completion; QBS measures governed control over behavior. |
| OWASP LLM Top 10 | LLM application risk taxonomy. | Adversarial and high-risk task families. | OWASP is a risk taxonomy, not a benchmark scoring protocol. |
| MITRE ATLAS | AI adversary tactics and techniques. | Mapping for prompt injection, data/context poisoning, evasion, exfiltration, and abuse patterns. | ATLAS is threat modeling; QBS needs paired direct-vs-governed measurement. |
| NIST AI RMF 1.0 | Govern, Map, Measure, and Manage risk functions. | Governance-axis mapping, measurement discipline, and trustworthiness framing. | NIST AI RMF is a risk-management framework, not a paired benchmark. |
| ISO/IEC 42001:2023 | AI management system requirements. | Evidence retention, process control, and review discipline. | ISO 42001 is a management-system standard, not a task corpus or scoring method. |
| EU AI Act | Legal risk classes and high-risk obligations. | Risk-class awareness and public claim discipline for regulated contexts. | QBS is not a legal compliance assessment. |
| MLCommons AILuminate | Industry AI risk and reliability benchmark precedent. | Safety/risk benchmark framing and stricter confidence around safety claims. | AILuminate targets model/system risk categories; QBS adds CVF-specific governance receipts, routing, and cost controls. |

## 3. Methodology References

QBS uses these as external anchors:

| Reference | Role In QBS |
|---|---|
| GLUE: A Multi-Task Benchmark and Analysis Platform for Natural Language Understanding | Multi-task benchmark design and aggregate scoring precedent. |
| SuperGLUE: A Stickier Benchmark for General-Purpose Language Understanding Systems | Harder follow-up benchmark and leaderboard-style rigor. |
| HELM: Holistic Evaluation of Language Models | Multi-metric, transparent evaluation across scenarios. |
| Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena | Model-assisted judging plus human-preference calibration caution. |
| AgentBench: Evaluating LLMs as Agents | Agent-oriented evaluation precedent. |
| OWASP Top 10 for LLM Applications | LLM app risk taxonomy. |
| MITRE ATLAS | AI threat/tactic mapping. |
| NIST AI Risk Management Framework 1.0 | Risk-management functions and trustworthy AI framing. |
| ISO/IEC 42001:2023 | AI management system and process-control reference. |
| Regulation (EU) 2024/1689, Artificial Intelligence Act | Legal risk-class and high-risk AI governance context. |
| MLCommons AILuminate | AI risk and reliability benchmark precedent. |

Reference URLs:

- https://arxiv.org/abs/1804.07461
- https://arxiv.org/abs/1905.00537
- https://arxiv.org/abs/2211.09110
- https://crfm.stanford.edu/2022/11/17/helm.html
- https://arxiv.org/abs/2306.05685
- https://arxiv.org/abs/2308.03688
- https://owasp.org/www-project-top-10-for-large-language-model-applications
- https://atlas.mitre.org/
- https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
- https://www.iso.org/standard/42001
- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689
- https://mlcommons.org/ailuminate/

## 4. Risk Mapping

| QBS Family | External Risk Anchor | Expected CVF Behavior |
|---|---|---|
| High-risk security / secrets | OWASP sensitive information disclosure; MITRE exfiltration and abuse patterns. | Refuse, redact, require approval, or provide safe alternative. |
| Bypass / adversarial governance | OWASP prompt injection and excessive agency; MITRE evasion and manipulation. | Detect bypass intent and preserve policy boundaries. |
| Cost / quota / provider selection | LLM application operational risk. | Surface provider/model/cost signals where available and avoid hidden spend. |
| Ambiguous non-coder requests | Human factors and task ambiguity. | Clarify rather than overconfidently execute. |
| Negative controls | Benchmark validity discipline. | Avoid unnecessary blocking or overhead on harmless tasks. |
| Regulated or high-impact contexts | NIST AI RMF, ISO/IEC 42001, EU AI Act. | Preserve risk labels, receipts, approval boundaries, and claim limitations. |

## 5. Peer-Review Checklist

A QBS result is not peer-review ready unless it publishes or retains:

- corpus version
- criteria version
- provider/model list
- run class
- config prompts
- prompt-diff manifest
- paired output IDs
- scorer rubric
- reviewer agreement report
- hard-gate outcomes
- cost and latency table
- limitations and claim boundary

## 6. Positioning

QBS is closest to a system benchmark for governed AI execution. It combines:

- multi-task discipline from GLUE/SuperGLUE
- multi-metric transparency from HELM
- reviewer-calibration caution from MT-Bench
- agent-task awareness from AgentBench
- adversarial taxonomy grounding from OWASP and MITRE ATLAS
- risk-management and management-system framing from NIST AI RMF and ISO/IEC
  42001
- legal risk-class awareness from the EU AI Act
- AI risk/reliability benchmark precedent from MLCommons AILuminate

The result is CVF-native because the question is not only "did the model answer
well?" The question is "did the user get a useful answer through a controlled,
auditable, cost-aware, policy-bound execution path?"

## Final Clause

This alignment file claims only that QBS borrows discipline from listed
benchmarks while evaluating a different object. It does not claim parity
with any of them, does not claim QBS supersedes any of them, and does not
authorize publishing a comparative score without a fresh methodology
revision.
