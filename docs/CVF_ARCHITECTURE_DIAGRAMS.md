# CVF v1.3 Architecture Diagrams

Tài liệu này chứa các sơ đồ kiến trúc minh họa cho CVF v1.3 Implementation Toolkit.

---

## 1. Tổng quan Kiến trúc CVF

```mermaid
flowchart TB
    subgraph "CVF Core (v1.0/v1.1)"
        A[Phase A: Discovery]
        B[Phase B: Blueprint]
        C[Phase C: Construct]
        D[Phase D: Deliver]
        A --> B --> C --> D
    end

    subgraph "CVF v1.2 Extension"
        SC[Skill Contract Spec]
        RM[Risk Model R0-R3]
        CL[Capability Lifecycle]
        SR[Skill Registry Model]
    end

    subgraph "CVF v1.3 Toolkit"
        SDK[Python SDK]
        CLI[cvf-validate CLI]
        ADP[Agent Adapters]
        CICD[CI/CD Templates]
    end

    SC --> SDK
    RM --> SDK
    CL --> SDK
    SR --> SDK
    SDK --> CLI
    SDK --> ADP
    SDK --> CICD

    style SDK fill:#2ecc71,color:#fff
    style CLI fill:#3498db,color:#fff
    style ADP fill:#9b59b6,color:#fff
    style CICD fill:#e74c3c,color:#fff
```

---

## 2. SDK Component Architecture

```mermaid
flowchart LR
    subgraph "sdk/"
        subgraph "models/"
            SC2[SkillContract]
            CAP[Capability]
            RISK[RiskLevel]
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
    RISK --> REG
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

## 6. CI/CD Integration Flow

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

## 7. Full System Architecture

```mermaid
flowchart TB
    subgraph "User Layer"
        DEV[Developer]
        CLI2[CLI Tool]
        CICD2[CI/CD Pipeline]
    end

    subgraph "CVF v1.3 SDK"
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
        
        AUDIT2[AuditTracer]
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

    DEV --> CLI2
    DEV --> CICD2
    CLI2 --> VALS
    CICD2 --> VALS
    
    CONTRACT2 --> REG2
    REG2 --> AD1
    REG2 --> AD2
    REG2 --> AD3
    
    AD1 --> ANTHROPIC
    AD2 --> OPENAI2
    AD3 --> LOCAL
    
    AD1 --> AUDIT2
    AD2 --> AUDIT2
    AD3 --> AUDIT2
    
    CONTRACT2 -.-> YAML
    REG2 -.-> JSON
    AUDIT2 -.-> LOGS

    style REG2 fill:#2ecc71,color:#fff
    style AUDIT2 fill:#9b59b6,color:#fff
```

---

## Sử dụng Diagrams

Các diagrams này có thể được render bằng:

1. **GitHub** - Tự động render Mermaid trong markdown files
2. **VS Code** - Cài extension "Markdown Preview Mermaid Support"
3. **Online** - Sử dụng [Mermaid Live Editor](https://mermaid.live)

---

*Cập nhật: 29/01/2026*
