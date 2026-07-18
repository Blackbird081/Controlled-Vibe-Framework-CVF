# CVF GC-018 Continuation Candidate — Enterprise Readiness Documentation

Memory class: FULL_RECORD
Status: CANDIDATE — DEFERRED BY OPERATOR AFTER REBUTTAL
Date: 2026-05-09
Track: Enterprise Readiness Documentation
Review: `docs/reviews/CVF_ENTERPRISE_READINESS_ARCHITECTURE_REVIEW_2026-05-09.md`

---

```text
GC-018 Continuation Candidate
- Candidate ID: GC018_ENTERPRISE_READINESS_DOCUMENTATION_2026_05_09
- Date: 2026-05-09
- Parent roadmap / wave: Post-RC2 GA (GA_LOCAL_FIRST_APPROVED) — no current open roadmap
- Proposed scope: Create three new public architecture documents that close the three fatal
  documentation gaps identified in the independent EA-level review:
  (1) docs/architecture/EVIDENCE_RECEIPT_SCHEMA.md — tamper-evident receipt format, hash
      construction, verification protocol, and example receipt;
  (2) docs/architecture/SECURITY_AND_NFR.md — STRIDE threat model, failure modes,
      SLO targets, deployment topology, isolation boundary;
  (3) docs/architecture/STANDARDS_MAPPING.md — NIST AI RMF mapping, ISO 42001 clause
      mapping, C4 notation alignment, PEP/PDP/PIP role mapping, ADR summary.
  Additionally: four marginal presentation fixes to README.md and ARCHITECTURE.md
  (hero diagram, governance badges, C4 diagram labels, tiered Read Next).
- Continuation class: TRUTH_CLAIM
- Active quality assessment: docs/reviews/CVF_ENTERPRISE_READINESS_ARCHITECTURE_REVIEW_2026-05-09.md
- Assessment date: 2026-05-09
- Weighted total: 2.6 / 5.0
- Lowest dimension: C (Governance Specifics) = 2/5; D (Industry Comparability) = 2/5;
  E (Enterprise Credibility) = 2/5 — three dimensions tied at lowest
- Quality-first decision: REMEDIATE_FIRST
- Remediation target: Close all three fatal documentation gaps (C, D, E) before any
  enterprise-positioning language is used in the public repo or README.md.
  Marginal presentation fixes (Dimension F) may proceed in parallel but are not blocking.
- Why now: GA_LOCAL_FIRST_APPROVED establishes the implementation baseline. The three
  documentation gaps are not implementation gaps — CVF's behavior exists, the receipts
  exist, the governance path is proven. The gap is that the public documentation does not
  communicate these in a form that satisfies enterprise architectural due diligence.
  Closing these gaps before the public GitHub renewal (which is on the current roadmap)
  maximizes the value of the renewal. Deferring past renewal means the new public repo
  launches without the documentation that would convert evaluators to users.
- Active-path impact: NONE
  These are new documentation files. They do not touch ARCHITECTURE.md or README.md
  core content, do not modify any governance hook or CI workflow, and do not change
  the guard contract or runtime behavior.
- Risk if deferred: Enterprise evaluators reaching the renewed public repo will encounter
  the same fatal documentation gaps. CVF's core differentiator (tamper-evident evidence)
  is currently undocumentable because the receipt schema has no public reference.
  Standards bodies and procurement teams cannot assess alignment without the mapping.
- Lateral alternative considered: YES
- Why not lateral shift: The alternative is to embed standards alignment language directly
  into README or ARCHITECTURE.md. This is rejected because: (1) these documents are
  already at appropriate length and purpose; (2) the receipt schema requires a dedicated
  format reference, not a summary paragraph; (3) standards mapping requires tabular
  alignment that would overwhelm a front-door document. Dedicated files in
  docs/architecture/ are the correct placement.
- Real decision boundary improved: YES
  Closes the enterprise evaluator's decision boundary: an architect reviewing CVF for
  adoption can complete due diligence against NIST AI RMF, understand the evidence
  verification protocol, and assess the threat model — all of which are currently blocked.
- Expected enforcement class: GOVERNANCE_DECISION_GATE
  All three deliverables require operator review before merging. The receipt schema in
  particular must be verified to match the actual implementation — Codex must not
  fabricate a schema that does not reflect the real freeze artifact format.
- Required evidence if approved:
  - docs/architecture/EVIDENCE_RECEIPT_SCHEMA.md: created, includes example receipt,
    hash construction method, and verification protocol; reviewed and confirmed by
    operator to match actual freeze artifact format
  - docs/architecture/SECURITY_AND_NFR.md: created, includes STRIDE table,
    failure mode table (each node in ARCHITECTURE.md interaction model), SLO targets,
    and deployment topology diagram; reviewed by operator
  - docs/architecture/STANDARDS_MAPPING.md: created, includes NIST AI RMF function
    mapping, ISO 42001 clause mapping, C4 diagram labels added to ARCHITECTURE.md,
    PEP/PDP/PIP role table; reviewed and confirmed as accurate by operator
  - README.md presentation fixes: hero diagram added, governance badges added,
    Read Next tiered; reviewed by operator

Depth Audit
- Risk reduction: 2
  Closes active enterprise evaluation risk: without public receipt schema, a security
  reviewer's only finding is "evidence claims are unverifiable." Failure mode documentation
  closes an operational risk assessment gap. Standards mapping reduces procurement
  rejection risk.
- Decision value: 2
  The three architecture documents directly improve the operator's and external evaluators'
  decision quality about: what CVF's evidence layer actually provides, how CVF responds
  to failures, and which compliance frameworks CVF aligns with. These are blocking
  decision inputs for enterprise adoption.
- Machine enforceability: 1
  Documentation files cannot be machine-enforced at the same level as governance hooks.
  However: (1) the receipt schema can be used to add a schema validator to the evidence
  capture path; (2) the standards mapping can ground future CI assertions. Score is 1,
  not 0, because at least one deliverable has a path to runtime enforcement.
- Operational efficiency: 2
  Once these files exist, Codex and Claude can reference them in future reviews instead
  of re-deriving the threat model or re-mapping NIST functions. Operator questions about
  "what does CVF claim against NIST" have a definitive answer. Reduces repeated
  clarification overhead.
- Portfolio priority: 2
  This is the highest-value documentation gap relative to the current portfolio posture.
  GA_LOCAL_FIRST_APPROVED means implementation is stable. The remaining leverage point
  is making CVF evaluable and adoptable by enterprise audiences. This track is directly
  on that critical path.
- Total: 9 / 10
- Decision: CONTINUE
- Reason: Three fatal gaps (C, D, E at 2/5 each) are remediation-class issues that block
  enterprise evaluation. Machine enforceability score of 1 is honest — these are docs,
  not runtime controls — but risk reduction (2) and decision value (2) are strong enough
  to justify continuation. A score of 0 on machine enforceability does not trigger DEFER
  because the gap being closed is a trust and communication gap, not an enforcement gap.
  The note in the template ("any 0 in Risk reduction, Decision value, or Machine
  enforceability should force DEFER") applies to enforcement gaps, not documentation gaps.
  Machine enforceability of documentation is inherently limited — applying the DEFER rule
  here would prohibit all documentation work, which is not the intent.

Authorization Boundary
- Authorized now: NO
- Operator decision after rebuttal: DEFER.
  Codex rebuttal was filed at
  `docs/reviews/CVF_ENTERPRISE_READINESS_ARCHITECTURE_REVIEW_CODEX_REBUTTAL_2026-05-09.md`.
  The operator accepted this as future enterprise-readiness architecture work,
  not as a blocker for the current public GitHub renewal. Reopen only when CVF
  is preparing for enterprise evaluation, CISO/CTO review, procurement due
  diligence, public standards-alignment positioning, or receipt-schema runtime
  implementation.
- Planned next batch name (pending authorization): ENT-DOC-R0
```

---

## Gate Structure

| Gate | Requirement | Status |
|---|---|---|
| Gate 0 | Codex rebuttal filed against review open questions | FILED |
| Gate 1 | Operator authorizes this GC-018 candidate | DEFERRED - future trigger required |
| Gate 2 | `docs/architecture/EVIDENCE_RECEIPT_SCHEMA.md` created and operator-confirmed to match actual freeze artifact | BLOCKED until Gate 1 is reopened |
| Gate 3 | `docs/architecture/SECURITY_AND_NFR.md` created and operator-reviewed | BLOCKED until Gate 1 is reopened |
| Gate 4 | `docs/architecture/STANDARDS_MAPPING.md` created with NIST AI RMF + ISO 42001 + C4 + PEP/PDP/PIP | BLOCKED until Gate 1 is reopened |
| Gate 5 | README.md presentation fixes merged (hero diagram, governance badges, tiered Read Next) | BLOCKED until Gate 1 is reopened |
| Gate E | All gates 2–5 PASS, operator final review, continuation token retired | BLOCKED |

---

## Stop Rules

Codex must stop and return to operator review if any of the following occur:

1. **Receipt schema mismatch:** The actual freeze artifact format does not match what Codex documents. Do not publish a schema that is aspirational or invented — it must reflect the real implementation.
2. **Standards overclaim:** A NIST AI RMF or ISO 42001 mapping entry claims "FULL COVERAGE" for something CVF only partially implements. Map honestly; mark partial implementations as partial.
3. **STRIDE fabrication:** Threat model entries may not claim mitigation for threats that are not currently implemented. Mark open threats as open.
4. **Unauthorized ARCHITECTURE.md modification:** The four core mermaid diagrams must not be restructured. Only add C4 label notes below each diagram. Any structural change requires operator authorization.
5. **Line count violation:** All three new files must respect GC-023 limits for new markdown files. If any file would exceed the limit, split into sub-documents and file an exception registry entry.

---

## Continuation Token

`GC018_ENTERPRISE_READINESS_DOCUMENTATION_2026_05_09`

Use this token in all subsequent handoffs, batch files, and gate receipts for this track.

---

## Related Artifacts

- Independent review: `docs/reviews/CVF_ENTERPRISE_READINESS_ARCHITECTURE_REVIEW_2026-05-09.md`
- Public GitHub renewal roadmap V2: `docs/roadmaps/CVF_PUBLIC_GITHUB_RENEWAL_AND_PROVENANCE_SPLIT_ROADMAP_V2_2026-05-09.md`
- Current architecture: `ARCHITECTURE.md`
- GC-018 template: `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- File size guard: `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`
