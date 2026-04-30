<!-- Memory class: FULL_RECORD -->
# CVF W132 Runtime Stability — Alibaba Primary

**Run status:** in_progress
**Captured:** 2026-04-30T12:49:53.452Z
**Provider:** alibaba / qwen-turbo
**Session isolation:** per_journey_browser_context
**Tranche:** W132-T1 CP4 — Alibaba Isolated Stability Run

## Journey Summary

| Metric | Value |
|---|---|
| Attempted | 10 |
| Accepted with receipt | 1 |
| Failure rate (timeout + fallback + provider_error) | 80.0% |
| Live HTTP status | n/a |
| Live decision | n/a |

## Outcome Breakdown

| Outcome | Count |
|---|---|
| `accepted_with_exports` | 1 |
| `accepted_missing_receipt` | 0 |
| `accepted_export_failed` | 0 |
| `route_miss` | 1 |
| `clarification_not_recovered` | 0 |
| `api_timeout` | 6 |
| `provider_error` | 0 |
| `mock_fallback_no_receipt` | 2 |
| `ui_flow_error` | 0 |

## Diagnostic Subcode Breakdown (W132 CP2)

| Subcode | Count |
|---|---|
| `provider_timeout` | 1 |
| `execute_route_timeout` | 5 |
| `missing_provider_key` | 0 |
| `provider_disabled` | 0 |
| `receipt_dropped` | 2 |
| `settings_not_hydrated` | 0 |
| `browser_context_closed` | 0 |
| `download_or_clipboard_blocked` | 0 |

## Journey Log

| # | Form Type | Outcome | Subcode | HTTP | Elapsed | Evidence | Pack | Receipt |
|---|---|---|---|---|---|---|---|---|
| 1 | documentation | `accepted_with_exports` | — | 200 | 13294ms | ✅ | ✅ | ✅ |
| 2 | email_template | `mock_fallback_no_receipt` | receipt_dropped | 400 | 4329ms | ❌ | ❌ | ❌ |
| 3 | risk_assessment | `api_timeout` | execute_route_timeout | — | 93787ms | ❌ | ❌ | ❌ |
| 4 | competitor_review | `mock_fallback_no_receipt` | receipt_dropped | 400 | 4548ms | ❌ | ❌ | ❌ |
| 5 | user_persona | `route_miss` | — | — | 1812390ms | ❌ | ❌ | ❌ |
| 6 | strategy_analysis | `api_timeout` | provider_timeout | 400 | 94897ms | ❌ | ❌ | ❌ |
| 7 | feature_prioritization | `api_timeout` | execute_route_timeout | — | 94580ms | ❌ | ❌ | ❌ |
| 8 | pricing_strategy | `api_timeout` | execute_route_timeout | — | 97971ms | ❌ | ❌ | ❌ |
| 9 | documentation | `api_timeout` | execute_route_timeout | — | 97647ms | ❌ | ❌ | ❌ |
| 10 | email_template | `api_timeout` | execute_route_timeout | — | 22424ms | ❌ | ❌ | ❌ |
