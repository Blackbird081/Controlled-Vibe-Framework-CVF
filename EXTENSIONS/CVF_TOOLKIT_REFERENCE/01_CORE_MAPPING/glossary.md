# CVF Toolkit Glossary

Term definitions for developers working with the CVF Toolkit.

| Term | Definition |
|------|-----------|
| **CVF** | Competence Validation Framework — the canonical governance framework |
| **Governance Guard** | Central enforcement module — validates every AI operation |
| **Risk Level** | R1 (low) → R4 (critical) — determines control intensity |
| **Phase** | P0–P6 lifecycle stage — Design → Build → Validate → UAT → Approved → Production → Frozen |
| **Skill** | Business-level AI capability (e.g., "portfolio-analysis") — independent from model |
| **Operator** | Human actor with role: ANALYST < REVIEWER < APPROVER < ADMIN |
| **Adapter** | Bridge between external systems and CVF core |
| **Extension** | Domain-specific plugin (e.g., Financial, Dexter) |
| **Freeze** | Immutability lock preventing modification after production deployment |
| **UAT** | User Acceptance Testing — quality gate before production |
| **Change Request** | Formal request to modify skill, governance, or policy |
| **Multi-Approval** | R4 operations require 2+ distinct approvers |
| **Risk Dominance** | In multi-agent context, highest risk takes precedence |
| **Domain** | Business vertical (e.g., "financial", "logistics") |
| **Capability Level** | C1–C4 — measures what the skill can do |
| **Environment Cap** | Maximum risk allowed per environment (dev=R3, staging=R2, prod=R1) |
| **Rollback** | Reverting phase to P0_DESIGN (requires ADMIN) |
| **Certification** | Formal proof that a skill passed UAT for its risk level |
| **SemVer** | Semantic Versioning (MAJOR.MINOR.PATCH) for skill versions |
| **Provider** | AI model backend (OpenAI, Claude, Gemini) |
| **Audit Record** | Immutable log entry for every governance decision |
| **Correlation ID** | Unique ID linking related audit records across modules |
| **Governance Decision** | Pass/fail result with risk, phase, UAT, approval, freeze requirements |
