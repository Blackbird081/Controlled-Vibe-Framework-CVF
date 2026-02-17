# AGT-017: Document Format Converter

> **Type:** Agent Skill  
> **Domain:** Document Processing  
> **Status:** Active

---

## Source

Inspired by claude-code-templates document-processing skills (pdf-processing-pro, pdf-anthropic, docx, xlsx, pptx) and Anthropic's official document manipulation toolkit.  
Reference: https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/skills/document-processing  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-017_DOCUMENT_FORMAT_CONVERTER.md`

---

## Capability

Converts, creates, and analyzes documents across multiple formats. Supports PDF (forms, tables, OCR), Word (DOCX), Excel (XLSX), PowerPoint (PPTX), and Markdown interchange.

**Actions:**
- Extract text, tables, and metadata from PDF documents
- Generate PDF documents with forms, headers, and structured layouts
- Create and edit Word documents with formatting and styles
- Read and write Excel spreadsheets with formulas and charts
- Build PowerPoint presentations with themes and layouts
- Convert between document formats (PDF↔DOCX↔MD, XLSX↔CSV)
- Perform OCR on scanned documents
- Extract structured data from unstructured documents

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R1 – Low** |
| Allowed Roles | All |
| Allowed Phases | All |
| Decision Scope | Tactical |
| Autonomy | Auto (document operations are contained) |

---

## Risk Justification

- **Data extraction accuracy** – OCR and table extraction may have errors
- **Format fidelity** – Conversion between formats may lose some formatting
- **File size limits** – Large documents may exceed processing capacity
- **Content sensitivity** – Documents may contain confidential information
- **No external access** – All operations performed on local/provided documents
- **Reversible** – Original documents are never modified in-place

---

## Constraints

- ✅ Original documents preserved (read-only source)
- ✅ OCR results include confidence scores
- ✅ Format conversion logs any lost formatting elements
- ✅ Output documents validated for format compliance
- ✅ File size limits enforced (default 50MB)
- ✅ All extracted data logged with source document reference
- ❌ Cannot modify original source documents in-place
- ❌ Cannot process encrypted documents without provided key
- ❌ Cannot bypass file size limits
- ❌ Cannot auto-upload processed documents to external services
- ❌ Cannot infer or fabricate missing document content

---

## UAT Binding

**PASS criteria:**
- [ ] Original documents remain unmodified
- [ ] OCR results include confidence scores for extracted text
- [ ] Format conversion lists any lost formatting elements
- [ ] Output documents open correctly in target application
- [ ] File size limits enforced

**FAIL criteria:**
- [ ] Original document is modified or corrupted
- [ ] OCR output presented without confidence information
- [ ] Conversion silently drops significant content
- [ ] Generated documents are malformed or unopenable
