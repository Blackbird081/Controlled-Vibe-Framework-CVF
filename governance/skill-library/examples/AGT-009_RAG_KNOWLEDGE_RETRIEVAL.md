# SKILL MAPPING RECORD
## AGT-009: RAG Knowledge Retrieval

> **Status:** ✅ Active  
> **Risk Level:** R2  
> **Last UAT:** 2026-02-17 — PASS

---

## 1. Skill Identity

| Field | Value |
|-------|-------|
| Skill ID | AGT-009 |
| Skill Name | RAG Knowledge Retrieval |
| Version | 1.0.0 |
| Source URL | https://github.com/anthropics/anthropic-quickstarts/tree/main/customer-support-agent |
| Original Author | Anthropic (customer-support-agent) |
| Intake Date | 2026-02-17 |
| Intake Owner | CVF Governance Team |

---

## 2. Capability Summary

### 2.1 Core Capability
Retrieves contextual information from a vector-indexed knowledge base using embedding-based semantic search. Inspired by the customer-support-agent quickstart's Amazon Bedrock Knowledge Base integration, which performs Retrieval-Augmented Generation (RAG) to ground agent responses in authoritative source documents. The skill:
- Converts a natural-language query into an embedding vector
- Performs approximate nearest-neighbor search against a configured knowledge base
- Returns ranked document chunks with source attribution and relevance scores
- Enforces citation requirements so that downstream agents never hallucinate references

### 2.2 Inputs
| Input | Type | Sensitivity | Required |
|-------|------|-------------|----------|
| Query text | String | Internal | Yes |
| Knowledge base ID | String (identifier) | Internal | Yes |
| Max results | Integer (1–20) | Public | No (default: 5) |
| Score threshold | Float (0.0–1.0) | Public | No (default: 0.5) |
| Metadata filter | JSON object | Internal | No |

### 2.3 Outputs
| Output | Type | Persistence |
|--------|------|-------------|
| Retrieved document chunks | JSON array | Logged |
| Source citations (URI, title, page) | JSON array | Logged |
| Relevance scores | Float array | Logged |
| Result count | Integer | Logged |
| Retrieval latency (ms) | Integer | Ephemeral |

### 2.4 Execution Model
| Property | Value |
|----------|-------|
| Invocation | Agent-invoked |
| Execution | Async (with timeout) |
| Autonomy level | Supervised |
| Timeout | 10 000 ms |

---

## 3. CVF Risk Mapping

### 3.1 Assigned Risk Level
- ☐ R0 – Informational (Read-only, no side effects)
- ☐ R1 – Advisory (Suggestions only, human confirmation required)
- ☑ **R2 – Assisted Execution** (Bounded actions, explicit invocation)
- ☐ R3 – Autonomous Execution (Multi-step, requires authorization)
- ☐ R4 – Critical / Blocked (Severe damage potential, execution blocked)

### 3.2 Risk Justification
- Connects to an external vector database / knowledge base service (network call)
- Query content may contain sensitive business context
- Incorrect retrieval could propagate misinformation downstream
- Read-only operation — does not modify the knowledge base
- Source citations are enforced, limiting hallucination risk

### 3.3 Failure Scenarios
| Mode | Description | Impact |
|------|-------------|--------|
| Primary | Knowledge base unavailable / timeout | Medium — Agent falls back to parametric knowledge with explicit disclaimer |
| Secondary | Low-relevance results returned (below threshold) | Low — Empty result set returned; agent must disclose lack of grounding |
| Tertiary | Stale or outdated documents retrieved | Medium — Misleading context; mitigated by metadata date filter and review |
| Quaternary | Embedding model mismatch (wrong dimensionality) | High — No results; fail-fast with descriptive error |

### 3.4 Blast Radius Assessment
| Dimension | Assessment |
|-----------|------------|
| Scope of impact | Single agent session / single query |
| Reversibility | Full — Read-only, no state mutation |
| Data exposure risk | Medium — Retrieved chunks may contain internal knowledge |

---

## 4. Authority Mapping

### 4.1 Allowed Agent Roles
- ☑ **Orchestrator**
- ☑ **Architect**
- ☑ **Builder**
- ☑ **Reviewer**

### 4.2 Allowed CVF Phases
- ☑ **Discovery**
- ☑ **Design**
- ☑ **Build**
- ☑ **Review**

### 4.3 Decision Scope Influence
- ☐ Informational
- ☑ **Tactical** (influences immediate task decisions)
- ☐ Strategic (requires human oversight)

### 4.4 Autonomy Constraints
| Constraint | Value |
|------------|-------|
| Invocation conditions | Explicit agent request; rate-limited to 30 req/min |
| Explicit prohibitions | Must not fabricate citations; must not return results below score threshold; must not cache results across sessions without explicit consent |

> ⚠️ Undefined authority is forbidden by default.

---

## 5. Adaptation Requirements

- ☐ No adaptation required
- ☑ **Capability narrowing required** (Read-only retrieval; no write/index operations)
- ☐ Execution sandboxing required
- ☑ **Additional audit hooks required** (Log every query and retrieval for traceability)

### Adaptation Details
1. **Removed:** Write/indexing capabilities present in the original Bedrock KB SDK calls
2. **Added:** Mandatory source citation enforcement — every retrieved chunk must include `sourceURI`, `title`, and `pageNumber` fields
3. **Added:** Score threshold gate — chunks below the configured threshold are silently dropped
4. **Added:** Query sanitization — strip PII patterns (email, SSN, phone) before sending to embedding service
5. **Constrained:** Maximum of 20 results per query to bound latency and cost

---

## 6. UAT & Validation Hooks

### 6.1 Required UAT Scenarios
| Scenario | Description |
|----------|-------------|
| Normal operation | Query returns 3–5 relevant chunks with scores ≥ 0.7 |
| Empty results | Query with no matching content returns empty array, not an error |
| Threshold filtering | Chunks below score threshold are excluded from output |
| Timeout handling | Knowledge base latency > 10 s triggers graceful timeout with error message |
| Citation completeness | Every returned chunk includes all required citation fields |
| PII sanitization | Query containing email/phone is sanitized before embedding |

### 6.2 Output Validation
| Criteria | Check |
|----------|-------|
| Acceptance | All chunks include `sourceURI`, `title`, `relevanceScore` |
| Acceptance | Result count ≤ `maxResults` parameter |
| Rejection | Any chunk missing citation metadata |
| Rejection | Output contains fabricated source URIs not present in knowledge base |

---

## 7. Decision Record

### 7.1 Intake Outcome
- ☐ Reject
- ☑ **Accept with Restrictions**
- ☐ Accept after Adaptation

### 7.2 Decision Rationale
The RAG retrieval pattern from Anthropic's customer-support-agent quickstart provides high-value grounding for agent responses. Accepted at R2 because the skill performs external network calls to a knowledge base service and retrieved content influences agent decisions. Restrictions enforce read-only access, mandatory citations, and query sanitization to align with CVF governance principles.

### 7.3 Decision Authority
| Field | Value |
|-------|-------|
| Name / Role | CVF Governance Team / Skill Intake Owner |
| Date | 2026-02-17 |
| Signature | Approved |

---

## 8. Lifecycle Controls

### 8.1 Review Cycle
| Field | Value |
|-------|-------|
| Review interval | 90 days |
| Next review date | 2026-05-17 |

### 8.2 Deprecation Conditions
- Knowledge base service deprecated or replaced
- Embedding model changed without revalidation
- >3 UAT failures in a review cycle
- CVF authority model revision invalidates R2 classification

---

## 9. Audit References

| Reference | Link |
|-----------|------|
| Source pattern | [anthropic-quickstarts/customer-support-agent](https://github.com/anthropics/anthropic-quickstarts/tree/main/customer-support-agent) |
| CVF documents | `CVF_SKILL_RISK_AUTHORITY_LINK.md` |
| Change log | v1.0.0: Initial intake from customer-support-agent RAG pattern |
| Incident references | None |

---

## 10. Final Assertion

By approving this record, the decision authority confirms that:

- ✅ The skill is bound to CVF governance
- ✅ Its risks are understood and accepted
- ✅ Its authority is explicitly constrained
- ✅ Source citation enforcement is mandatory
- ✅ Query sanitization hooks are active

> ⚠️ Unrecorded usage of this skill constitutes a CVF violation.

---

**Approval Signatures:**

| Role | Name | Date |
|------|------|------|
| Skill Owner | CVF Governance Team | 2026-02-17 |
| Governance Reviewer | CVF Governance Team | 2026-02-17 |
| Security Reviewer | Security Team | 2026-02-17 |
