# Provider Security Specification

## 1. API Key Management

- API keys MUST NOT be hardcoded in source files
- Keys MUST be loaded from environment variables or a secret manager
- Key names follow convention: `CVF_PROVIDER_{NAME}_API_KEY`
  - `CVF_PROVIDER_OPENAI_API_KEY`
  - `CVF_PROVIDER_CLAUDE_API_KEY`
  - `CVF_PROVIDER_GEMINI_API_KEY`

## 2. Key Rotation

- All API keys should support rotation without downtime
- Provider instances should re-read keys on configurable intervals
- Expired/invalid keys must trigger `ProviderError` with code `CVF_ERR_011`

## 3. Key Usage Tracking

Each provider call must log:
- Provider name
- Model used
- Token consumption (prompt + completion)
- Estimated cost (if available)
- Timestamp

## 4. Request Security

- All provider calls must go through `governance.guard` first
- Direct provider instantiation is prohibited outside the abstraction layer
- Provider responses must be validated before returning to caller

## 5. Data Handling

- Sensitive user data must not be included in prompts without sanitization
- Provider responses containing PII must be flagged
- Financial data in prompts must be anonymized when possible

## 6. Network Security

- All provider calls must use HTTPS (enforced by SDK defaults)
- Timeout must be configured (default: 30s per `PROVIDER_CONFIG`)
- Retry logic must respect rate limits (exponential backoff)

## 7. Audit Requirements

Every provider call must generate audit record:
```json
{
  "eventType": "PROVIDER_CALL",
  "details": {
    "provider": "openai",
    "model": "gpt-4",
    "tokensUsed": 1500,
    "latencyMs": 2300,
    "success": true
  }
}
```

## 8. Compliance

- Provider selection must comply with `model.approval.list.md`
- Unapproved models must be rejected at runtime
- Model changes require change request (triggers R3 escalation)
