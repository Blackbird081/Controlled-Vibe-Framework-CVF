# Error Reference — CVF Toolkit

## Error Code Table

| Code | Class | Trigger | Resolution |
|------|-------|---------|------------|
| CVF_ERR_001 | `GovernanceViolationError` | Multiple governance rules violated | Check `reasons[]` array for specific violations |
| CVF_ERR_002 | `PhaseViolationError` | Illegal phase transition (e.g., P1→P4) | Follow sequential phase order P0→P1→...→P6 |
| CVF_ERR_003 | `RiskViolationError` | Risk exceeds environment cap | Lower risk or switch to appropriate environment |
| CVF_ERR_004 | `OperatorViolationError` | Operator lacks required role | Escalate to operator with sufficient role |
| CVF_ERR_005 | `ChangeViolationError` | Change request not approved / invalid state | Complete change approval workflow |
| CVF_ERR_006 | `FreezeViolationError` | Modification attempted during freeze | Request freeze break from ADMIN |
| CVF_ERR_007 | `EnvironmentViolationError` | Operation not allowed in this environment | Deploy to appropriate environment |
| CVF_ERR_008 | `SkillViolationError` | Skill not found, inactive, or duplicate | Register skill or activate existing |
| CVF_ERR_009 | `SecurityException` | Bypass attempt detected | Contact security admin |
| CVF_ERR_010 | `ValidationError` | Input validation failure | Fix input data format |
| CVF_ERR_011 | `ProviderError` | AI provider invocation failed | Check provider health, API key, model approval |
| CVF_ERR_012 | `CertificationError` | Certification issue | Complete UAT and certification process |

## Error Structure

All errors extend `BaseGovernanceError`:

```typescript
{
  name: string       // Error class name
  code: string       // CVF_ERR_xxx
  message: string    // Human-readable description
  timestamp: string  // ISO 8601 when error occurred
}
```

## Common Scenarios

### "GovernanceViolationError: Governance violation: Operator not authorized; Risk exceeds environment cap"
- **Cause**: Multiple governance checks failed
- **Fix**: Ensure operator has required role AND operation risk fits environment

### "PhaseViolationError: Cannot transition from P1_BUILD to P3_UAT"
- **Cause**: Phase skip attempted
- **Fix**: Progress through P2_INTERNAL_VALIDATION first

### "FreezeViolationError: Skill finance-portfolio@1.0.0 is already frozen"
- **Cause**: Trying to freeze an already-frozen skill
- **Fix**: No action needed, or breakFreeze() then re-freeze

### "ProviderError: Model 'gpt-5' is not approved for provider 'openai'"
- **Cause**: Using a model not in model.approval.list.md
- **Fix**: Use an approved model or update the approval list
