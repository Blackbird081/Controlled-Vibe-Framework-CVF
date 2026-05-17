# Telemetry Policy (Local-Only)

**Scope:** CVF v1.6 Agent Platform telemetry is **local-only** by default. No data is sent to external servers.

## ✅ Data Collected (Minimal)
- Event type (e.g., execution_created, skill_viewed)
- Timestamp
- Non-sensitive metadata (template ID, category, skill ID, domain, quality score)

## ❌ Data Not Collected
- Prompt or output content
- User API keys
- Personal identity data
- Files or attachments

## Storage & Retention
- Stored in browser `localStorage`
- Retention window: **30 days** or **max 500 events** (whichever first)
- Users can clear logs at any time

## Opt-Out
- Users can disable analytics via Settings
- When disabled, new events are not stored

## Export
- Users may export telemetry locally in **JSON** or **CSV** format
- No automatic upload or remote sync

---

*Updated: 2026-02-07*
