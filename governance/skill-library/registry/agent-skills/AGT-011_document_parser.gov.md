# AGT-011: Document Parser

> **Type:** Agent Skill  
> **Domain:** Data Extraction  
> **Status:** Active

---

## Source

Inspired by Anthropic financial-data-analyst quickstart (CSV/PDF parsing with schema-based extraction).  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-011_DOCUMENT_PARSER.md`

---

## Capability

Parses documents (PDF, CSV, TXT, images) and extracts structured data based on user-defined schemas, with built-in PII detection.

**Actions:**
- Parse PDF, CSV, TXT, and image files
- Extract structured data using schema definitions
- Perform OCR on image-based documents
- Detect and redact personally identifiable information (PII)
- Validate file types and enforce size limits

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R1 – Low** |
| Allowed Roles | All agent roles |
| Allowed Phases | All (Discovery, Design, Build, Review) |
| Decision Scope | Tactical |
| Autonomy | Automatic (read-only extraction) |

---

## Risk Justification

- **Read-only** – Does not modify source documents
- **PII exposure** – Extracted text may contain sensitive personal data
- **File security** – Must reject executable file types
- **Size limits** – Large files could exhaust resources
- **OCR accuracy** – Image extraction may produce errors

---

## Constraints

- ✅ PII detection runs on all extracted text
- ✅ File size limit enforced (max 10 MB)
- ✅ Supported formats validated (PDF, CSV, TXT, PNG, JPG)
- ✅ Executable files rejected (.exe, .sh, .bat, .ps1)
- ✅ PII-flagged content redacted before logging
- ✅ Max 50 pages per PDF extraction
- ❌ Cannot process executable files
- ❌ Cannot bypass PII detection layer
- ❌ Cannot exceed file size limits

---

## UAT Binding

**PASS criteria:**
- [ ] Correctly extracts data matching the provided schema
- [ ] PII detection identifies and redacts sensitive content
- [ ] Rejects unsupported and executable file types
- [ ] Respects file size limits
- [ ] Extraction results logged with PII redaction

**FAIL criteria:**
- [ ] PII content passed through unredacted
- [ ] Executable file accepted for processing
- [ ] File size limit bypassed
- [ ] Extracted data does not match schema structure
- [ ] Unlogged extraction operations
