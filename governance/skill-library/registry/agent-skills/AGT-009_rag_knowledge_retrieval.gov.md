# AGT-009: RAG Knowledge Retrieval

> **Type:** Agent Skill  
> **Domain:** Knowledge Retrieval  
> **Status:** Active

---

## Source

Inspired by Anthropic customer-support-agent quickstart (Amazon Bedrock Knowledge Base RAG pattern).  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-009_RAG_KNOWLEDGE_RETRIEVAL.md`

---

## Capability

Retrieves contextual information from a vector-indexed knowledge base using embedding-based semantic search, returning ranked document chunks with source attribution.

**Actions:**
- Convert natural-language queries into embedding vectors
- Perform approximate nearest-neighbor search against knowledge base
- Return ranked document chunks with relevance scores
- Enforce citation requirements (no hallucinated references)
- Apply metadata filters to narrow search scope

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R2 – Medium** |
| Allowed Roles | Orchestrator, Builder, Architect |
| Allowed Phases | All (Discovery, Design, Build, Review) |
| Decision Scope | Tactical |
| Autonomy | Supervised (human confirms inputs) |

---

## Risk Justification

- **Data exposure** – Query text may reveal project-internal information
- **Retrieval accuracy** – Low-relevance results could mislead downstream agents
- **PII leakage** – Retrieved documents may contain personally identifiable information
- **Source integrity** – Knowledge base must be curated to avoid poisoned data
- **Rate/cost** – Embedding API calls incur compute costs

---

## Constraints

- ✅ All retrieved documents logged with IDs and relevance scores
- ✅ Source citations mandatory in AI output
- ✅ PII filtering applied before context injection
- ✅ Minimum relevance threshold enforced (default 0.5)
- ✅ Max 20 results per query
- ✅ 10-second timeout per retrieval operation
- ❌ Cannot retrieve documents without full audit logging
- ❌ Cannot fabricate sources not present in the knowledge base
- ❌ Cannot bypass PII filtering layer

---

## UAT Binding

**PASS criteria:**
- [ ] Returns results above minimum relevance threshold
- [ ] All results include source citations (URI, title)
- [ ] PII-flagged content redacted before injection
- [ ] Query and results fully logged
- [ ] Timeout enforced (≤10s)

**FAIL criteria:**
- [ ] Returns results below threshold without flagging
- [ ] Missing source citations in output
- [ ] PII content passed through unfiltered
- [ ] Unlogged retrieval operations
- [ ] Fabricated or hallucinated source references
