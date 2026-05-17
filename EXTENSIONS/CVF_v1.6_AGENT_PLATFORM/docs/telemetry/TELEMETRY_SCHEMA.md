# Telemetry Schema (Local Events)

## Event Envelope
```json
{
  "id": "evt_...",
  "type": "execution_created",
  "timestamp": 1738900000000,
  "data": { "templateId": "...", "category": "..." }
}
```

## Event Types
- `execution_created`
- `execution_completed`
- `execution_accepted`
- `execution_rejected`
- `execution_retry`
- `template_selected`
- `skill_viewed`
- `skill_copied`
- `analytics_opened`
- `agent_opened`
- `agent_closed`
- `multi_agent_opened`
- `tools_opened`

## Common Fields (by type)
### Template/Execution Events
- `templateId`
- `templateName`
- `category`
- `qualityScore` (execution_completed only)

### Skill Events
- `skillId`
- `skillTitle`
- `domain`
- `difficulty` (skill_viewed)

## Metrics Derived (Aggregation)
- Top skills by views
- Domain usage counts
- Accept/reject ratio
- Average quality score
- 7-day activity trend

---

*Updated: 2026-02-07*
