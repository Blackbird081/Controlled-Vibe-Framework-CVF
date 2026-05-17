# SKILL MAPPING RECORD
## AGT-011: Document Parser

> **Status:** ✅ Active  
> **Risk Level:** R1  
> **Last UAT:** 2026-02-17 — PASS

---

## 1. Skill Identity

| Field | Value |
|-------|-------|
| Skill ID | AGT-011 |
| Skill Name | Document Parser |
| Version | 1.0.0 |
| Source URL | https://github.com/anthropics/anthropic-quickstarts/tree/main/financial-data-analyst |
| Original Author | Anthropic (financial-data-analyst) |
| Intake Date | 2026-02-17 |
| Intake Owner | CVF Governance Team |

---

## 2. Capability Summary

### 2.1 Core Capability
Parses multi-format documents and extracts structured data according to a caller-defined schema. Inspired by the financial-data-analyst quickstart's file upload and processing pipeline, which accepts PDF financial statements, CSV spreadsheets, and image-based documents (via OCR), then extracts tabular and textual data for downstream analysis. The skill:
- Accepts raw file content with a declared MIME type
- Routes to the appropriate parser (PDF text extraction, CSV parsing, image OCR)
- Applies a caller-defined extraction schema to produce structured output
- Detects and flags potential PII (emails, phone numbers, SSNs, credit card numbers) in extracted content
- Returns document metadata (page count, word count, detected language, creation date)

### 2.2 Inputs
| Input | Type | Sensitivity | Required |
|-------|------|-------------|----------|
| File content | Base64-encoded string | Confidential | Yes |
| File type | Enum: `pdf`, `csv`, `tsv`, `png`, `jpg`, `tiff`, `xlsx` | Public | Yes |
| Extraction schema | JSON Schema object | Internal | No (default: raw text) |
| PII detection mode | Enum: `flag`, `redact`, `off` | Public | No (default: `flag`) |
| Max pages | Integer (1–500) | Public | No (default: 50) |
| OCR language | String (ISO 639-1) | Public | No (default: `en`) |

### 2.3 Outputs
| Output | Type | Persistence |
|--------|------|-------------|
| Structured extracted data | JSON (conforming to schema) | Logged |
| Raw text content | String | Ephemeral |
| Document metadata | JSON object | Logged |
| PII detection report | JSON array of findings | Logged |
| Parsing warnings | String array | Logged |

### 2.4 Execution Model
| Property | Value |
|----------|-------|
| Invocation | Agent-invoked |
| Execution | Async (with timeout) |
| Autonomy level | Auto |
| Timeout | 30 000 ms |

---

## 3. CVF Risk Mapping

### 3.1 Assigned Risk Level
- ☐ R0 – Informational (Read-only, no side effects)
- ☑ **R1 – Advisory** (Suggestions only, human confirmation required)
- ☐ R2 – Assisted Execution (Bounded actions, explicit invocation)
- ☐ R3 – Autonomous Execution (Multi-step, requires authorization)
- ☐ R4 – Critical / Blocked (Severe damage potential, execution blocked)

### 3.2 Risk Justification
- Read-only transformation: document bytes → structured data (no side effects)
- Documents may contain sensitive or confidential information
- PII detection and sanitization hooks mitigate data exposure
- Extraction errors could propagate incorrect data downstream
- No external network calls — all processing is local/in-process
- Elevated above R0 because extracted data may contain PII and influences decisions

### 3.3 Failure Scenarios
| Mode | Description | Impact |
|------|-------------|--------|
| Primary | Corrupted or password-protected PDF | Low — Parser returns error, no partial output |
| Secondary | OCR misrecognition on low-quality images | Medium — Incorrect data extracted; mitigated by confidence scores |
| Tertiary | PII missed by detection heuristics | High — Sensitive data propagated downstream; mitigated by configurable redaction mode |
| Quaternary | Schema mismatch (document doesn't match expected schema) | Low — Returns raw text with validation warnings |
| Quinary | File exceeds max page limit | Low — Truncated with warning |

### 3.4 Blast Radius Assessment
| Dimension | Assessment |
|-----------|------------|
| Scope of impact | Single document parse operation |
| Reversibility | Full — No source document modified |
| Data exposure risk | Medium — Documents may contain PII; mitigated by detection/redaction |

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
- ☑ **Informational**
- ☐ Tactical (influences immediate task decisions)
- ☐ Strategic (requires human oversight)

### 4.4 Autonomy Constraints
| Constraint | Value |
|------------|-------|
| Invocation conditions | Explicit agent request with file content payload |
| Explicit prohibitions | Must not persist extracted content beyond session without explicit consent; must not transmit document content to external services; must not disable PII detection when processing documents marked as Confidential |

> ⚠️ Undefined authority is forbidden by default.

---

## 5. Adaptation Requirements

- ☐ No adaptation required
- ☑ **Capability narrowing required** (Parse only; no file storage or re-upload)
- ☐ Execution sandboxing required
- ☑ **Additional audit hooks required** (PII detection logging)

### Adaptation Details
1. **Removed:** File upload endpoint — the original financial-data-analyst uses a Next.js API route to accept multipart uploads; this skill only accepts pre-loaded base64 content
2. **Removed:** Direct Claude vision API calls for image analysis — OCR is handled locally
3. **Added:** PII detection pipeline with three modes: `flag` (annotate findings), `redact` (replace with `[REDACTED]`), `off` (no detection)
4. **Added:** Document metadata extraction (page count, word count, detected language)
5. **Added:** Extraction schema validation — output is validated against the caller's JSON Schema
6. **Constrained:** Maximum 500 pages per document; maximum 50 MB file size

---

## 6. UAT & Validation Hooks

### 6.1 Required UAT Scenarios
| Scenario | Description |
|----------|-------------|
| PDF extraction | Parse a 10-page PDF and extract text matching the provided schema |
| CSV parsing | Parse a 1 000-row CSV into structured JSON array |
| Image OCR | Extract text from a 300 DPI PNG image with ≥ 95% accuracy |
| PII flag mode | Detect and flag email addresses and phone numbers in extracted text |
| PII redact mode | Replace detected SSNs with `[REDACTED]` in output |
| Schema mismatch | Return raw text with warnings when document doesn't match schema |
| Corrupted file | Return descriptive error for password-protected PDF |
| Page limit | Truncate and warn when document exceeds max pages |

### 6.2 Output Validation
| Criteria | Check |
|----------|-------|
| Acceptance | Structured output validates against caller-provided JSON Schema |
| Acceptance | PII report lists all detected PII with type, location, and confidence |
| Acceptance | Document metadata includes page count and detected language |
| Rejection | Extracted output contains un-flagged PII when detection mode is `flag` or `redact` |
| Rejection | Output file size exceeds 10 MB |

---

## 7. Decision Record

### 7.1 Intake Outcome
- ☐ Reject
- ☑ **Accept with Restrictions**
- ☐ Accept after Adaptation

### 7.2 Decision Rationale
The document parsing pattern from Anthropic's financial-data-analyst quickstart is essential for workflows requiring structured data extraction from unstructured documents. Accepted at R1 because the skill is a read-only transformation with no external side effects. Restrictions enforce mandatory PII detection, local-only processing, and schema-validated output to prevent data leakage and ensure extraction quality.

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
- PII detection accuracy falls below 90% on standard test corpora
- Supported file types no longer align with organizational needs
- >3 UAT failures in a review cycle
- Replacement skill with superior multi-modal parsing available

---

## 9. Audit References

| Reference | Link |
|-----------|------|
| Source pattern | [anthropic-quickstarts/financial-data-analyst](https://github.com/anthropics/anthropic-quickstarts/tree/main/financial-data-analyst) |
| CVF documents | `CVF_SKILL_RISK_AUTHORITY_LINK.md` |
| Change log | v1.0.0: Initial intake from financial-data-analyst document parsing pattern |
| Incident references | None |

---

## 10. Final Assertion

By approving this record, the decision authority confirms that:

- ✅ The skill is bound to CVF governance
- ✅ Its risks are understood and accepted
- ✅ Its authority is explicitly constrained
- ✅ PII detection and sanitization hooks are active
- ✅ All processing is local — no external transmission

> ⚠️ Unrecorded usage of this skill constitutes a CVF violation.

---

**Approval Signatures:**

| Role | Name | Date |
|------|------|------|
| Skill Owner | CVF Governance Team | 2026-02-17 |
| Governance Reviewer | CVF Governance Team | 2026-02-17 |
| Security Reviewer | Security Team | 2026-02-17 |
