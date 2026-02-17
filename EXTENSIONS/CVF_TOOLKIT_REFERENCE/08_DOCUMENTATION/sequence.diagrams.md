# Sequence Diagrams — CVF Governance Flows

## 1. Governance Enforcement (Full Flow)

```mermaid
sequenceDiagram
    participant C as Client
    participant GA as Governance Adapter
    participant GG as Governance Guard
    participant SR as Skill Registry
    participant OP as Operator Policy
    participant RC as Risk Classifier
    participant PC as Phase Controller
    participant CC as Change Controller
    participant AL as Audit Logger

    C->>GA: invokeWithGovernance(ctx)
    GA->>GG: enforceGovernance(ctx)
    
    GG->>SR: get(skillId)
    SR-->>GG: SkillDefinition
    
    GG->>OP: validate(role, requiredRole)
    OP-->>GG: authorized: true/false
    
    GG->>RC: classify(input)
    RC-->>GG: RiskAssessmentResult
    
    GG->>PC: validate(phaseState)
    PC-->>GG: phaseValid: true/false
    
    GG->>CC: validate(changeId)
    CC-->>GG: changeApproved: true/false
    
    GG->>AL: log(GOVERNANCE_DECISION)
    GG-->>GA: GovernanceDecision
    GA-->>C: Result / Error
```

## 2. Phase Transition

```mermaid
sequenceDiagram
    participant Admin
    participant PC as Phase Controller
    participant AL as Audit Logger

    Admin->>PC: advancePhase(projectId, P2→P3)
    
    PC->>PC: Check sequential (P2→P3 valid)
    PC->>PC: Check risk gates (R3+ needs UAT)
    PC->>PC: Check freeze status
    
    alt Valid Transition
        PC->>AL: log(PHASE_VALIDATION, success)
        PC-->>Admin: Phase advanced to P3_UAT
    else Invalid
        PC->>AL: log(PHASE_VALIDATION, blocked)
        PC-->>Admin: PhaseViolationError
    end
```

## 3. Change Control Lifecycle

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CC as Change Controller
    participant RC as Risk Classifier
    participant AL as Audit Logger
    participant Approver

    Dev->>CC: register(changeRequest)
    CC->>RC: classify(changeRisk)
    RC-->>CC: R3 (requires approval)
    CC->>AL: log(change registered)
    
    Dev->>CC: submit(changeId)
    CC->>AL: log(change submitted)
    
    CC->>Approver: Request approval
    Approver->>CC: approve(changeId)
    CC->>AL: log(APPROVAL_GRANTED)
    
    Dev->>CC: markImplemented(changeId)
    CC->>AL: log(change implemented)
    
    Dev->>CC: freeze(changeId)
    CC->>AL: log(FREEZE_APPLIED)
```

## 4. Provider Invocation with Fallback

```mermaid
sequenceDiagram
    participant App
    participant PR as Provider Registry
    participant P1 as Primary Provider
    participant P2 as Fallback Provider
    participant AL as Audit Logger

    App->>PR: invokeWithFallback(primary, fallback, req)
    PR->>PR: validateModel(primary, model)
    PR->>P1: invoke(request)
    
    alt Primary Success
        P1-->>PR: AIResponse
        PR->>AL: log(PROVIDER_CALL, success)
        PR-->>App: AIResponse
    else Primary Fails
        P1-->>PR: Error
        PR->>AL: log(fallback_triggered)
        PR->>PR: validateModel(fallback, model)
        PR->>P2: invoke(request)
        P2-->>PR: AIResponse
        PR->>AL: log(PROVIDER_CALL, success)
        PR-->>App: AIResponse
    end
```

## 5. Freeze + Break Flow

```mermaid
sequenceDiagram
    participant Op as Operator
    participant FP as Freeze Protocol
    participant AL as Audit Logger
    participant Admin

    Op->>FP: activate(skillId, version, R3, reason)
    FP->>AL: log(FREEZE_APPLIED)
    FP-->>Op: FreezeState (active)
    
    Note over FP: Skill is now frozen - no modifications allowed
    
    Admin->>FP: breakFreeze(request, ADMIN)
    FP->>FP: Verify ADMIN role
    FP->>AL: log(freeze_broken)
    FP-->>Admin: Freeze deactivated
```
