1️⃣ Governance → Verification Engine
verification.engine.ts

Inject vào phase exit

Enforce:

Test pass

Diff size threshold

Risk compliance

Logs clean

Proof artifact exists

Không có proof → không Done.

phase.exit.criteria.ts

Defines:
interface PhaseExitCriteria {
  requiredTestsPassed: boolean
  diffWithinScope: boolean
  riskValidated: boolean
  logsClean: boolean
  eleganceChecked: boolean
}
proof.of.correctness.ts

Yêu cầu:

Test result

Output sample

Diff snapshot

Risk assessment reference

2️⃣ Elegance Policy Layer
elegance.scorer.ts

Heuristic:

Cyclomatic complexity delta

File count increase

Dependency growth

LOC delta ratio

Score 0–100.

Trigger refactor suggestion nếu:
complexity_growth > 15%
AND risk ≤ R2
elegance.guard.ts

Ngăn:

Infinite refactor loop

Refactor on trivial fix

Refactor when risk ≥ R3

3️⃣ Bug Fix Protocol
bug.classifier.ts

Phân loại:

Syntax

Failing test

Runtime error

Logic flaw

Security

Architectural

autonomy.matrix.ts
R0–R1 → auto-fix allowed
R2 → limited auto-fix
R3 → escalate mandatory

fix.scope.guard.ts

Không cho:

Cross-module rewrite

Architecture change

Schema change

4️⃣ Role Transition Guard (Single Agent)
role.graph.ts

Allowed transitions:

PLAN → RESEARCH
PLAN → DESIGN
BUILD → TEST
TEST → DEBUG
DEBUG → BUILD
REVIEW → RISK

Không được:

DEBUG → PLAN (unless restart)
TEST → DESIGN
loop.detector.ts

Detect:

Same role repeated > N times

Oscillation pattern

depth.limiter.ts

Max transition depth = 8 (configurable)

5️⃣ Context Segmentation

Không spawn real agent.

session.fork.ts:

Fork reasoning branch

Compress output

Inject summary back

context.pruner.ts:

Trim history > threshold

memory.boundary.ts:

Separate temporary reasoning

Preserve core memory

6️⃣ Lessons Registry

lesson.schema.ts

interface Lesson {
  id: string
  severity: 'low' | 'medium' | 'high'
  category: string
  rootCause: string
  preventionRule: string
  riskLevel: string
  version: string
  createdAt: Date
}

lesson.injector.ts

On session start → load relevant lessons

Match via keyword + category

conflict.detector.ts

Detect contradicting preventionRule

7️⃣ Telemetry

mistake_rate_tracker.ts

Track corrections per task

elegance_score_tracker.ts

Track score trend

verification_metrics.ts

Pass/fail per phase

governance_audit_log.ts

Immutable log entries

🔒 INTEGRATION STRATEGY

Hook points:

Before Phase Exit → verification.engine
On Role Switch → transition.policy
On Bug Report → bug.classifier
After Correction → lesson.store
On Session Start → lesson.injector

Zero bypass allowed.

🚦RISK ANALYSIS (Self Audit)

Potential risks:

Token overhead ↑
Mitigation: context.pruner

Over-governance
Mitigation: elegance guard threshold

Infinite reasoning
Mitigation: depth.limiter + loop.detector

Lesson explosion
Mitigation: severity filter + pruning

🏷 VERSION DECLARATION
## v1.7.0 – Controlled Intelligence Extension

Added:
- Continuous Verification Enforcement
- Role Transition Governance
- Controlled Autonomous Bug Fix Protocol
- Structured Lessons Registry
- Elegance Quality Guard
- Governance Telemetry Metrics

No changes to:
- Core 4-phase workflow
- Risk tier model
- Authority matrix
- Multi-agent architecture
🎯 FINAL DECISION

Đây là kiến trúc tối ưu nhất:

Không phá CVF core

Không mesh hóa uncontrolled

Không biến thành creative chaos

Gia cố governance

Tăng autonomy nhưng có rào chắn