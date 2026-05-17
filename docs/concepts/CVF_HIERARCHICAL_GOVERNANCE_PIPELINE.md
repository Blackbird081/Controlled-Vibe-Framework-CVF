# CVF Hierarchical Governance Pipeline

> **Type:** Concept Document
> **Date:** 2026-03-08
> **Status:** Active — Blueprint for Phase 2-3
> **Origin:** Formalized from historical `CVF_Restructure/Information for non_coder.md` notes; after `P3/CP1`, any local recovery copy belongs under `.private_reference/legacy/CVF_Restructure/`

---

## 1. Overview

This document defines how CVF translates human intent ("Vibe") into governed AI execution through a **5-tier hierarchy** and a **Hierarchical RAG pipeline**. It is the architectural blueprint for making governance **automatic** rather than manual.

**Core Problem:**

CVF has rules. But rules only work if agents are **forced** to pass through them before acting. Today, agents can act first and check later — this is the gap this architecture closes.

**Design Principle:**

```
No AI action without governance check.
Every Vibe must pass through the full hierarchy before execution.
```

---

## 2. The 5-Tier Document Hierarchy

Information flows **top-down** — from broad intent to precise execution constraints:

```
┌─────────────────────────────────────────────────┐
│ Tier 1: CORE PRINCIPLES                         │
│ What the system values (safety, cost, ethics)    │
│ Audience: Non-Coder / Business Owner             │
│ Example: "Customer data safety above all else"   │
└─────────────────────┬───────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│ Tier 2: GOVERNANCE POLICIES                      │
│ Measurable rules derived from principles         │
│ Format: Policy-as-Code (JSON/YAML/DSL)           │
│ Example: max_daily_spend = 5000000               │
└─────────────────────┬───────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│ Tier 3: DOMAIN GUARDRAILS                        │
│ Industry-specific protection rules               │
│ Scope: Finance, Privacy, Code Security, Legal    │
│ Example: allowed_domains: ["@company.com"]       │
└─────────────────────┬───────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│ Tier 4: AGENT CONSTRAINTS & TOOLS                │
│ Execution-level constraints injected into agent  │
│ Format: System prompt + JSON Schema + Limits     │
│ Example: Tool withdraw_money() requires approval │
└─────────────────────┬───────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│ Tier 5: AUDIT & LEDGER LOGS                      │
│ Immutable record of everything that happened     │
│ Content: Execution traces, violations, decisions │
│ Example: "Agent blocked: Rule_01 max_spend"      │
└─────────────────────────────────────────────────┘
```

### Mapping to CVF Components

| Tier | CVF Component | Status |
|------|--------------|--------|
| Tier 1 | `ECOSYSTEM/doctrine/` + VOM | ✅ Available |
| Tier 2 | v1.6.1 Policy-as-Code DSL (`RULE/WHEN/THEN`) | ✅ Production |
| Tier 3 | Domain Guards (Finance/Privacy/Code) | 🔲 Phase 2: `CVF_ECO_v1.2_DOMAIN_GUARDS` |
| Tier 4 | v1.7.1 Safety Runtime Pipeline | ✅ Production (manual injection) |
| Tier 5 | v3.0 artifact_ledger + hash-chain | ✅ Production |

---

## 3. Hierarchical RAG Pipeline

Traditional RAG dumps all documents into one search. CVF uses **structured, tiered retrieval**:

### 3.1 Three-Step Retrieval

```
User Vibe (natural language)
     │
     ▼
Step 1: INTENT ROUTING
     │  Lightweight model identifies Domain
     │  (Finance? Privacy? Code? HR?)
     │  → Narrows search scope immediately
     ▼
Step 2: POLICY FILTERING
     │  Retrieve: Global Guards + Domain-specific Policies
     │  Source: Tier 2 + Tier 3 documents
     │  → Returns only relevant 3-5 rules
     ▼
Step 3: CONSTRAINT INJECTION
     │  Extract technical parameters (JSON Schema)
     │  Inject into Agent execution prompt
     │  → Agent cannot bypass injected constraints
     ▼
GOVERNED EXECUTION
```

### 3.2 Indexed Metadata Structure

Each document in the knowledge base carries hierarchical metadata:

| Tier | Metadata Tags | Example Content |
|------|--------------|-----------------|
| Tier 1 (Core) | `type: "principle"` | "Safety first", "Minimize cost" |
| Tier 2 (Policy) | `domain: "finance"`, `type: "rule"` | `{max_spend: 5000000, require_approval: true}` |
| Tier 3 (Guard) | `action: "api_call"`, `risk: "high"` | API blacklist, sensitive functions |
| Tier 5 (Audit) | `session_id: "xyz"`, `status: "violation"` | Past violations as learning examples |

### 3.3 Example Workflow

**User Vibe:** "Use AI to write Python code that auto-sends weekly expense reports to the boss via email."

| Step | Action | Result |
|------|--------|--------|
| Intent Routing | Identifies domains: `Coding` + `Communication` | Scope narrowed |
| Policy Filtering | Finds: "No external data transfer" + "All Python code must pass security scan" | 2 rules retrieved |
| Constraint Injection | Retrieves `send_email()` schema with constraint: `allowed_domains: ["@company.com"]` | Constraint injected |
| Execution Prompt | Agent receives: "Only use standard libraries. Email only to @company.com. If boss has different domain, raise error." | Governed execution |

---

## 4. Graph-Based Governance (Future Architecture)

For advanced conflict detection and traceability, CVF can evolve from document-based rules to a **Knowledge Graph**:

### 4.1 Graph Ontology

**Nodes:**

| Node Type | Description |
|-----------|-------------|
| `:Vibe` | User intent (natural language) |
| `:Policy` | Governance rules (JSON Schema) |
| `:Constraint` | Technical hard limits (thresholds, whitelists) |
| `:Agent` | Executing AI agents |
| `:Action` | Sensitive operations (withdraw, send_email, delete) |

**Relationships:**

| Relationship | Meaning |
|-------------|---------|
| `[:TRIGGERS]` | Vibe activates Policy |
| `[:ENFORCES]` | Policy imposes Constraint |
| `[:REQUIRES_APPROVAL]` | Action needs human confirmation |
| `[:CONFLICTS_WITH]` | Two rules contradict each other |
| `[:DEPENDS_ON]` | Policy requires another Policy |
| `[:PROTECTS]` | Security Policy protects a Resource |

### 4.2 Graph vs Vector Search (RAG)

| Capability | Vector RAG | Graph |
|-----------|-----------|-------|
| Semantic similarity search | ✅ | ✅ |
| **Inference** (find related policies automatically) | ❌ | ✅ |
| **Conflict detection** (contradicting rules) | ❌ | ✅ |
| **Traceability** ("why was I blocked?") | Partial | ✅ Full chain |
| **Inheritance** (update Tier 1 → all Tier 4 agents update) | ❌ Manual | ✅ Auto |

### 4.3 Implementation Stack (Phase 4+)

- **Storage:** Neo4j (Graph) + Vector Index (semantic search within nodes)
- **Query:** Cypher templates (no AI-generated queries)
- **Integration:** Connects to CVF Governance Decision Engine

---

## 5. Triple-S Architecture: Vibe → Policy Translation

The core engine for converting natural language "Vibes" into enforceable constraints uses a 3-layer funnel:

```
┌──────────────────────────────────────────────────┐
│ Layer S1: SEMANTIC (Vibe Interpretation)          │
│ LLM parses user's natural language to extract:   │
│ → Object being controlled                        │
│ → Action being restricted                        │
│ → Trigger condition                              │
│                                                  │
│ Input:  "Never let Agent spend over $50/day      │
│          on ads without asking me"               │
│ Output: {domain: Finance, action: Payment,       │
│          limit: 50, require: Human_Approval}     │
└──────────────────────┬───────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────┐
│ Layer S2: SCHEMATIC (Logic Mapping)               │
│ Convert to structured Policy JSON Schema         │
│                                                  │
│ Output: governance_rules[] with enforcement      │
│         levels: HARD_BLOCK / HUMAN_IN_THE_LOOP / │
│         LOG_ONLY                                 │
└──────────────────────┬───────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────┐
│ Layer S3: STRICT (Hard-Constraint Generation)     │
│ Generate code-based runtime checks               │
│ Agent CANNOT bypass — even with hallucination    │
│                                                  │
│ Output: Executable guards injected into runtime  │
└──────────────────────────────────────────────────┘
```

### Enforcement Levels

| Level | Behavior | Use Case |
|-------|----------|----------|
| `HARD_BLOCK` | Auto-block, no override | Financial limits, data deletion |
| `HUMAN_IN_THE_LOOP` | Pause + send notification for approval | Risky investments, external data transfer |
| `LOG_ONLY` | Allow but record for audit | Low-risk actions, monitoring |

### Latency Strategy

Adding governance creates a "latency tax". Solution:

| Risk Level | Strategy | Latency |
|-----------|----------|--------|
| Low risk | Asynchronous Audit (log after execution) | ~0ms |
| Medium risk | Async check + post-validation | ~10ms |
| High risk | Synchronous Blocking (check BEFORE execution) | ~100-500ms |

---

## 6. Governance Canvas: Non-Coder Interface

Non-Coders should not configure JSON. CVF provides a visual "Governance Canvas":

### 6.1 Interface Components

| Component | Description |
|-----------|------------|
| **Smart Toggles** | Pre-built switches for common risks: `☐ Block external data access`, `☐ Daily spend limit` |
| **Natural Language Box** | Single chat input: "Hey CVF, stop Agent if it finds a scammer partner" |
| **Visual Feedback** | Mind-map showing: Your Vibe → Policy → Constraint → How Agent is restricted |
| **Risk Templates** | Pre-built profiles: "Personal Finance Safety", "Internal Data Privacy" |

### 6.2 Visual Feedback Example

```
User types: "Never send internal data outside the company"
                    │
                    ▼
CVF responds: "I understood:
  ✅ I will block any data_transfer action
     where target.scope = external
  ✅ Enforcement: HARD_BLOCK
  ✅ Applies to: All agents

  Is this correct? [Yes] [Edit] [Cancel]"
```

### 6.3 Deployment Options

| Option | Description |
|--------|------------|
| SDK Wrapper | Developers wrap agents: `guard.wrap(myAgent)` |
| Browser Extension | Non-coders install CVF Layer on top of ChatGPT/Claude |
| Smart Proxy | CVF sits as middleware between user and AI platform |

---

## 7. Policy Schema Templates

Pre-built schemas that Non-Coders can activate immediately:

### 7.1 Financial Governance

```json
{
  "governance_rules": [
    {
      "intent_domain": "FINANCE_TRANSACTION",
      "action_trigger": "WITHDRAW_FUNDS",
      "constraints": { "max_value": 5000000, "currency": "VND" },
      "enforcement": "HARD_BLOCK"
    },
    {
      "intent_domain": "INVESTMENT_STRATEGY",
      "action_trigger": "BUY_ASSET",
      "asset_class_filter": ["CRYPTO", "MEMECOIN"],
      "enforcement": "HUMAN_IN_THE_LOOP"
    }
  ]
}
```

### 7.2 Quality & Persona Guard

```json
{
  "quality_rules": [
    {
      "trigger": "CODE_GENERATION",
      "mandatory_steps": ["UNIT_TEST_INCLUDED", "ERROR_HANDLING_REQUIRED"],
      "forbidden_patterns": ["hard-coded credentials"],
      "enforcement": "REJECT_AND_RETRY"
    }
  ]
}
```

### 7.3 Transparency Guard (Glass Box)

```json
{
  "interceptors": [
    {
      "event": "AGENT_COLLABORATION",
      "action": "PAUSE_FOR_SUMMARY",
      "condition": "When Agent A delegates to Agent B"
    },
    {
      "event": "TOOL_USAGE",
      "action": "EXPLAIN_WHY",
      "threshold": "Critical_System_Call"
    }
  ]
}
```

### 7.4 Budget & Resource Ledger

```json
{
  "resource_limits": {
    "daily_token_budget": 500000,
    "max_cost_per_task": 2.0
  },
  "efficiency_rules": [
    { "condition": "Task_Complexity == LOW", "action": "FORCE_CHEAP_MODEL" },
    { "condition": "Cost_Exceeded_80_Percent", "action": "NOTIFY_HUMAN" }
  ]
}
```

---

## 8. Why This Matters for Non-Coders

| Benefit | Explanation |
|---------|-------------|
| **No hallucination** | Agent cannot invent rules — constraints are injected as hard JSON from Tier 2 |
| **Context window efficiency** | RAG retrieves only 3-5 relevant rules, not 100-page documents |
| **Automatic inheritance** | Update a Tier 1 principle → all Tier 4 agents change behavior without code changes |
| **Visual trust** | Governance Canvas shows exactly how Vibe connects to enforcement |
| **Proof of Compliance** | Audit log for humans: "CVF blocked Agent from transferring because invoice was missing" |
| **Personal governance** | Each user's "Vibe" creates a unique protection layer — no one-size-fits-all |
| **Low cost at runtime** | Setup uses LLM tokens once; runtime enforcement uses cheap JSON/code checks |

---

## 9. Market Positioning

| Competitor | Focus | CVF Difference |
|-----------|-------|-----------------|
| Guardrails AI | Data structure + content filtering | CVF = **Governance-centric** (execution rights + policy compliance) |
| Pillar/Prompt Security | Prompt injection prevention | CVF = **Behavioral control** (not just prompt safety) |
| AgentOps | Observability + audit logging | CVF = **Active enforcement** (not just passive logging) |
| NeMo Guardrails (NVIDIA) | Layer 7 AI filters | CVF = **Non-Coder accessible** (Natural Language Policy) |

**CVF's unfair advantage:** Most tools help AI write code faster. CVF keeps AI from going off-rails during execution. This is what CTOs fear most when deploying Agentic AI.

---

## 10. Implementation Timeline

| Phase | What | CVF Component |
|-------|------|---------------|
| **Phase 2** (Q3 2026) | Intent Routing + Domain Guards | `CVF_ECO_v1.0_INTENT_VALIDATION` + `CVF_ECO_v1.2_DOMAIN_GUARDS` |
| **Phase 2** (Q3 2026) | Natural Language Policy (Vibe → Rule) | `CVF_ECO_v1.1_NL_POLICY` |
| **Phase 3** (Q4 2026) | Agent Guard SDK (mandatory gateway) | `CVF_ECO_v2.0_AGENT_GUARD_SDK` |
| **Phase 4** (2027) | Graph-based Governance | Knowledge Graph + Conflict Detection |

---

## 11. Relationship to Other CVF Documents

| Document | Relationship |
|----------|-------------|
| `ECOSYSTEM/doctrine/CVF_ARCHITECTURE_PRINCIPLES.md` | Tier 1 principles defined there |
| `ECOSYSTEM/operating-model/CVF_BUILDER_MODEL.md` | Non-Coder workflow defined there |
| v1.6.1 Policy-as-Code (`RULE/WHEN/THEN`) | Tier 2 implementation (evolves to Triple-S) |
| v1.7.1 Safety Runtime Pipeline | Tier 4 execution enforcement |
| v3.0 artifact_ledger | Tier 5 audit implementation |
| `CVF_EXTENSION_VERSIONING_GUARD.md` | Naming convention for new Phase 2-3 modules |
| historical `CVF_Restructure/Information for non coder.md` (if locally retained: `.private_reference/legacy/CVF_Restructure/Information for non coder.md`) | Original raw notes (historical reference) |
