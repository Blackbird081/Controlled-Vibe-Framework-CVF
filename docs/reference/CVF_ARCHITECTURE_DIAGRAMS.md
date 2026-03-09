# CVF Architecture Diagrams

This document contains architecture diagrams illustrating the full CVF stack from v1.0 through v1.7.2.

---

## 1. Full Architecture Overview (5 Layers)

```mermaid
flowchart TB
    subgraph "Layer 5: Safety Dashboard (v1.7.2)"
        DASH["🛡️ Safety Dashboard"]
        RISK["Risk View: 🟢🟡🟠🔴"]
        SIM["Policy Simulation"]
    end

    subgraph "Layer 4: Agent Platform (v1.6)"
        WEB["🌐 Web UI (Next.js)"]
        CHAT["AI Agent Chat"]
        TOOLS["34 Agent Tools"]
        GOV["🔐 Governance Engine (v1.6.1)"]
    end

    subgraph "Layer 3: AI Safety Runtime (v1.7/v1.7.1)"
        INTEL["🧠 Controlled Intelligence (v1.7)"]
        GATE["Reasoning Gate"]
        ENTROPY["Entropy Guard"]
        SANITIZE["Prompt Sanitizer"]
        RUNTIME["⚙️ Safety Runtime (v1.7.1)"]
        POLICY["Policy Lifecycle Engine"]
        AUTH["Auth + DI Container"]
        AUDIT["Audit Trail"]
    end

    subgraph "Layer 2: Tools (v1.3)"
        SDK["Python SDK"]
        CLI["cvf-validate CLI"]
        ADP["Agent Adapters"]
        CICD["CI/CD Templates"]
    end

    subgraph "Layer 1: Core (v1.0/v1.1/v1.2)"
        PHASES["Phase A→D"]
        SKILLS["141 Skills"]
        RISKM["Risk Model R0-R3"]
        REGISTRY["Skill Registry"]
    end

    DASH --> WEB
    RISK --> RUNTIME
    SIM --> POLICY
    WEB --> INTEL
    CHAT --> SANITIZE
    GOV --> RUNTIME
    INTEL --> GATE
    INTEL --> ENTROPY
    INTEL --> SANITIZE
    RUNTIME --> POLICY
    RUNTIME --> AUTH
    RUNTIME --> AUDIT
    SDK --> REGISTRY
    CLI --> REGISTRY
    PHASES --> SKILLS
    SKILLS --> RISKM
    RISKM --> REGISTRY

    style DASH fill:#e74c3c,color:#fff
    style WEB fill:#f39c12,color:#fff
    style INTEL fill:#1abc9c,color:#fff
    style RUNTIME fill:#1abc9c,color:#fff
    style SDK fill:#2ecc71,color:#fff
    style PHASES fill:#3498db,color:#fff
```

---

## 2. CVF v1.3 SDK Component Architecture

```mermaid
flowchart LR
    subgraph "sdk/"
        subgraph "models/"
            SC2[SkillContract]
            CAP[Capability]
            RISK2[RiskLevel]
        end
        
        subgraph "registry/"
            REG[SkillRegistry]
            VAL[Validators]
        end
        
        subgraph "adapters/"
            BASE[BaseAdapter]
            CLAUDE[ClaudeAdapter]
            OPENAI[OpenAIAdapter]
            GEN[GenericAdapter]
        end
        
        subgraph "audit/"
            TRACE[AuditTracer]
        end
    end

    SC2 --> REG
    CAP --> REG
    RISK2 --> REG
    REG --> VAL
    REG --> BASE
    BASE --> CLAUDE
    BASE --> OPENAI
    BASE --> GEN
    CLAUDE --> TRACE
    OPENAI --> TRACE
    GEN --> TRACE

    style REG fill:#2ecc71,color:#fff
    style SC2 fill:#3498db,color:#fff
    style BASE fill:#9b59b6,color:#fff
```

---

## 3. Capability Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> PROPOSED: Register Contract
    
    PROPOSED --> APPROVED: Review & Approve
    APPROVED --> ACTIVE: Activate
    
    ACTIVE --> DEPRECATED: Deprecate
    ACTIVE --> RETIRED: Force Retire
    
    DEPRECATED --> RETIRED: Retire
    
    RETIRED --> [*]

    note right of PROPOSED
        Contract submitted
        Pending review
    end note
    
    note right of ACTIVE
        Can be executed
        In production
    end note
    
    note right of DEPRECATED
        Still works
        Not recommended
    end note
```

---

## 4. Execution Flow with Adapter

```mermaid
sequenceDiagram
    participant User
    participant Registry as SkillRegistry
    participant Adapter as Agent Adapter
    participant LLM as AI Model
    participant Audit as AuditTracer

    User->>Registry: resolve(capability_id, archetype, phase)
    Registry->>Registry: Check lifecycle state
    Registry->>Registry: Validate controls
    
    alt Execution Allowed
        Registry-->>User: Return Capability
        User->>Adapter: execute(contract, inputs)
        Adapter->>Adapter: Validate inputs
        Adapter->>LLM: API Call
        LLM-->>Adapter: Response
        Adapter->>Adapter: Parse outputs
        Adapter->>Audit: log(trace)
        Adapter-->>User: ExecutionResult
    else Execution Denied
        Registry-->>User: ExecutionDeniedError
    end
```

---

## 5. Risk Model Hierarchy

```mermaid
flowchart TD
    subgraph "Risk Levels"
        R0["R0 - Passive<br/>No side effects<br/>📊"]
        R1["R1 - Controlled<br/>Small, bounded effects<br/>⚙️"]
        R2["R2 - Elevated<br/>Has authority, may chain<br/>⚠️"]
        R3["R3 - Critical<br/>System changes<br/>🚨"]
    end

    subgraph "Required Controls"
        C0[Logging]
        C1[Logging + Scope Guard]
        C2[Logging + Scope Guard + Approval + Audit]
        C3[All above + Hard Gate + Human-in-the-loop]
    end

    R0 --> C0
    R1 --> C1
    R2 --> C2
    R3 --> C3

    style R0 fill:#27ae60,color:#fff
    style R1 fill:#3498db,color:#fff
    style R2 fill:#f39c12,color:#fff
    style R3 fill:#e74c3c,color:#fff
```

---

## 6. AI Safety Runtime Architecture (v1.7.x)

```mermaid
flowchart TB
    subgraph "Input"
        USER_MSG["User Message"]
    end

    subgraph "v1.7 Intelligence Layer"
        SANITIZE["Prompt Sanitizer"]
        ENTROPY["Entropy Guard"]
        ANOMALY["Anomaly Detector"]
        GATE["Reasoning Gate"]
    end

    subgraph "v1.7.1 Runtime Layer"
        POLICY["Policy Engine"]
        AUTH2["Auth Module"]
        DI["DI Container"]
        AUDIT2["Audit Logger"]
    end

    subgraph "Decision"
        ALLOW["🟢 Allow"]
        STRIP["🟡 Strip & Allow"]
        BLOCK["🔴 Block"]
    end

    USER_MSG --> SANITIZE
    SANITIZE --> ENTROPY
    ENTROPY --> ANOMALY
    ANOMALY --> GATE
    GATE --> POLICY
    POLICY --> AUTH2
    AUTH2 --> DI
    
    POLICY --> ALLOW
    POLICY --> STRIP
    POLICY --> BLOCK

    ALLOW --> AUDIT2
    STRIP --> AUDIT2
    BLOCK --> AUDIT2

    style SANITIZE fill:#1abc9c,color:#fff
    style POLICY fill:#e74c3c,color:#fff
    style ALLOW fill:#27ae60,color:#fff
    style STRIP fill:#f39c12,color:#fff
    style BLOCK fill:#e74c3c,color:#fff
```

---

## 7. CI/CD Integration Flow

```mermaid
flowchart LR
    subgraph "Development"
        DEV[Developer]
        CODE[Code Changes]
        CONTRACT[Contract YAML]
    end

    subgraph "Pre-commit"
        PC[pre-commit hooks]
        LINT[cvf-validate lint]
    end

    subgraph "GitHub Actions"
        PUSH[git push]
        GA[CVF Validate Workflow]
        VAL2[Validate all contracts]
    end

    subgraph "Results"
        PASS[✅ Pass]
        FAIL[❌ Fail]
    end

    DEV --> CODE
    DEV --> CONTRACT
    CONTRACT --> PC
    PC --> LINT
    LINT --> PUSH
    PUSH --> GA
    GA --> VAL2
    VAL2 --> PASS
    VAL2 --> FAIL

    style PASS fill:#2ecc71,color:#fff
    style FAIL fill:#e74c3c,color:#fff
```

---

## 8. Full System Architecture (v1.7.2)

```mermaid
flowchart TB
    subgraph "User Layer"
        DEV2[Developer]
        NONCODER[Non-Coder / Manager]
        CLI2[CLI Tool]
        CICD2[CI/CD Pipeline]
    end

    subgraph "CVF Web Platform (v1.6)"
        UI["Web UI (Next.js)"]
        AGENT["AI Agent Chat"]
        MARKET["Template Marketplace"]
        SAFETY["Safety Dashboard (v1.7.2)"]
    end

    subgraph "AI Safety Runtime (v1.7.x)"
        INTEL2["Intelligence (v1.7)"]
        RUNTIME2["Runtime Engine (v1.7.1)"]
    end

    subgraph "CVF SDK (v1.3)"
        subgraph "Core"
            CONTRACT2[SkillContract]
            REG2[SkillRegistry]
            VALS[Validators]
        end
        
        subgraph "Adapters"
            direction LR
            AD1[Claude]
            AD2[GPT]
            AD3[Ollama]
        end
        
        AUDIT3[AuditTracer]
    end

    subgraph "AI Providers"
        ANTHROPIC[Anthropic API]
        OPENAI2[OpenAI API]
        LOCAL[Local LLM]
    end

    subgraph "Storage"
        YAML[Contract YAML Files]
        JSON[Registry JSON]
        LOGS[Audit Logs]
    end

    DEV2 --> UI
    DEV2 --> CLI2
    DEV2 --> CICD2
    NONCODER --> SAFETY

    UI --> AGENT
    UI --> MARKET
    AGENT --> INTEL2
    INTEL2 --> RUNTIME2

    CLI2 --> VALS
    CICD2 --> VALS
    
    CONTRACT2 --> REG2
    REG2 --> AD1
    REG2 --> AD2
    REG2 --> AD3
    
    AD1 --> ANTHROPIC
    AD2 --> OPENAI2
    AD3 --> LOCAL
    
    AD1 --> AUDIT3
    AD2 --> AUDIT3
    AD3 --> AUDIT3
    
    CONTRACT2 -.-> YAML
    REG2 -.-> JSON
    AUDIT3 -.-> LOGS

    style UI fill:#f39c12,color:#fff
    style SAFETY fill:#e74c3c,color:#fff
    style INTEL2 fill:#1abc9c,color:#fff
    style RUNTIME2 fill:#1abc9c,color:#fff
    style REG2 fill:#2ecc71,color:#fff
    style AUDIT3 fill:#9b59b6,color:#fff
```

---

## Using These Diagrams

These diagrams can be rendered using:

1. **GitHub** — Automatically renders Mermaid in markdown files
2. **VS Code** — Install "Markdown Preview Mermaid Support" extension
3. **Online** — Use [Mermaid Live Editor](https://mermaid.live)

---

*Updated: February 25, 2026*
