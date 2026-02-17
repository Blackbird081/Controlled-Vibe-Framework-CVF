# AUDIT LOGGER SPEC
# CVF-Toolkit Core Module
# Status: Authoritative Specification
# Toolkit Version: 1.0.0

## 1. PURPOSE

Centralized, non-bypassable audit logging for all CVF governance events.
Every governance decision, phase transition, and provider call must be logged.

## 2. CORE INTERFACE

```ts
export interface AuditRecord {
  timestamp?: string        // Auto-populated by log()
  eventType: AuditEventType
  operatorId?: string
  skillId?: string
  riskLevel?: string
  phase?: number
  details?: Record<string, unknown>
  correlationId?: string    // For distributed tracing
}
```

## 3. EVENT TYPES

| Event Type            | When Logged                        |
| --------------------- | ---------------------------------- |
| SKILL_INVOCATION      | skill execution requested          |
| RISK_ASSESSMENT       | risk classification computed       |
| PHASE_VALIDATION      | phase transition attempted         |
| APPROVAL_GRANTED      | change/skill approval granted      |
| APPROVAL_REJECTED     | change/skill approval rejected     |
| FREEZE_APPLIED        | freeze activated                   |
| GOVERNANCE_DECISION   | overall governance pass/fail       |
| PROVIDER_CALL         | AI provider invocation             |
| CERTIFICATION_ISSUED  | skill certified                    |

## 4. OPERATIONS

### 4.1 Log Event
```ts
log(record: AuditRecord): void
```
- Auto-assigns timestamp (ISO 8601)
- Stores in internal log
- Must never throw — logging failures are silent

### 4.2 Retrieve Logs
```ts
getAll(): AuditRecord[]
getByType(eventType: AuditEventType): AuditRecord[]
```

## 5. RETENTION POLICY

- In-memory: max 10,000 records (configurable)
- Overflow: oldest records dropped with warning
- Production: should integrate with external log system

## 6. SANITIZATION RULES

Before logging:
- Redact fields matching: apiKey, password, token, secret, credential
- Replace values with `[REDACTED]`
- Log sanitization failures as separate events

## 7. NON-BYPASSABLE RULE

- Audit logging must execute even if governance rejects the request
- No module may disable or suppress the logger
- Logger must be initialized before any other module

## 8. COMPLIANCE CHECKLIST

✔ All event types supported
✔ Timestamp auto-populated
✔ Retention policy defined
✔ Sanitization rules defined
✔ Non-bypassable design
✔ Correlation ID support
