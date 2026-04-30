<!-- Memory class: FULL_RECORD -->
# CVF W132 Runtime Stability — DeepSeek Confirmatory

**Run status:** complete
**Captured:** 2026-04-30T14:09:42.909Z
**Provider:** deepseek / deepseek-chat
**Session isolation:** per_journey_browser_context
**Tranche:** W132-T1 CP5 — DeepSeek Confirmatory Run

## Journey Summary

| Metric | Value |
|---|---|
| Attempted | 6 |
| Accepted with receipt | 1 |
| Failure rate (timeout + fallback + provider_error) | 66.7% |
| Live HTTP status | 200 |
| Live decision | ALLOW |

## Outcome Breakdown

| Outcome | Count |
|---|---|
| `accepted_with_exports` | 1 |
| `accepted_missing_receipt` | 0 |
| `accepted_export_failed` | 0 |
| `route_miss` | 1 |
| `clarification_not_recovered` | 0 |
| `api_timeout` | 4 |
| `provider_error` | 0 |
| `mock_fallback_no_receipt` | 0 |
| `ui_flow_error` | 0 |

## Diagnostic Subcode Breakdown (W132 CP2)

| Subcode | Count |
|---|---|
| `provider_timeout` | 3 |
| `execute_route_timeout` | 1 |
| `missing_provider_key` | 0 |
| `provider_disabled` | 0 |
| `receipt_dropped` | 0 |
| `settings_not_hydrated` | 0 |
| `browser_context_closed` | 0 |
| `download_or_clipboard_blocked` | 0 |

## Journey Log

| # | Form Type | Outcome | Subcode | HTTP | Elapsed | Evidence | Pack | Receipt |
|---|---|---|---|---|---|---|---|---|
| 1 | documentation | `accepted_with_exports` | — | 200 | 41356ms | ✅ | ✅ | ✅ |
| 2 | email_template | `api_timeout` | provider_timeout | 400 | 95842ms | ❌ | ❌ | ❌ |
| 3 | risk_assessment | `api_timeout` | execute_route_timeout | — | 96175ms | ❌ | ❌ | ❌ |
| 4 | competitor_review | `api_timeout` | provider_timeout | 400 | 95302ms | ❌ | ❌ | ❌ |
| 5 | user_persona | `route_miss` | — | — | 19190ms | ❌ | ❌ | ❌ |
| 6 | strategy_analysis | `api_timeout` | provider_timeout | 400 | 96037ms | ❌ | ❌ | ❌ |
