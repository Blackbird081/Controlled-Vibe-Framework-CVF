<!-- Memory class: FULL_RECORD -->
# CVF W131-T1 Post-W130 Stability Evidence — Alibaba Primary

**Captured:** 2026-04-30T (manual reconstruction from spec run output)
**Provider:** alibaba / qwen-turbo
**Tranche:** W131-T1 CP3 — Alibaba Primary Stability Run
**Note:** Evidence reconstructed manually. Spec ran 40.2 min and hit test.setTimeout(2400000ms). Browser context
closed before writeEvidence() was called. All journey outcomes were logged to console before collapse.

## Flag Posture

| Flag | Value |
|---|---|
| `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` | `true` |
| `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` | `true` |
| `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` | `true` |

## Journey Summary

| Metric | Value |
|---|---|
| Attempted journeys | 24 |
| Counted (accepted) journeys | 1 |
| Test run duration | 40.2 minutes (hit 40-min timeout) |

## Outcome Breakdown

| Outcome | Count | Note |
|---|---|---|
| `accepted_with_exports` | 1 | documentation #1: both evidence + pack fired |
| `accepted_missing_receipt` | 0 | — |
| `accepted_export_failed` | 0 | — |
| `route_miss` | 1 | competitor_review #2: no strong route matched |
| `clarification_not_recovered` | 0 | — |
| `api_timeout` | 2 | email_template #2, documentation #2: no ResultViewer within 90s |
| `provider_error` | 0 | — |
| `mock_fallback_no_receipt` | 2 | email_template #1, competitor_review #1: ResultViewer without receipt |
| `ui_flow_error` | 18 | journeys 7–24: browser context collapsed (session instability) |

## Event Counts (from 1 accepted journey)

| Event | Count |
|---|---|
| evidence_exported | 1 |
| deliverable_pack_exported | 1 |
| execution_created | 1 (minimum — browser analytics not fully collected) |
| execution_accepted | 1 |

## Lane Readout (6 W128 lanes)

Analytics could not be fully collected (browser closed). Readout is estimated from observed journey outcomes.

| Lane | Status | Note |
|---|---|---|
| entry_routing | watch | 1 route_miss in 6 real journeys (17% miss rate) |
| clarification_recovery | no_data | No clarification journeys reached ResultViewer |
| trusted_form | watch | 2 route_miss + 2 mock_fallback in 6 attempts — significant gap |
| followup_continuity | no_data | Follow-up journeys all returned ui_flow_error |
| evidence_export | watch | 1 event from 1 accepted journey — thin but non-zero |
| deliverable_pack | watch | 1 event from 1 accepted journey — thin but non-zero |

## Trusted Form Subset Coverage

| Form Type | Attempted | Accepted | Real Result |
|---|---|---|---|
| `email_template` | 2 | 0 | #1 mock_fallback, #2 api_timeout |
| `documentation` | 2 | 1 | #1 accepted_with_exports ✅, #2 api_timeout |
| `competitor_review` | 2 | 0 | #1 mock_fallback, #2 route_miss |
| `risk_assessment` | 2 | 0 | #1 ui_flow_error, #2 ui_flow_error (browser collapsed) |
| `user_persona` | 2 | 0 | ui_flow_error × 2 (browser collapsed) |
| `feature_prioritization` | 2 | 0 | ui_flow_error × 2 (browser collapsed) |
| `pricing_strategy` | 2 | 0 | ui_flow_error × 2 (browser collapsed) |
| `strategy_analysis` | 2 | 0 | ui_flow_error × 2 (browser collapsed) |

## Live Governance Proof

Not collected — browser closed before postLiveGovernedExecution() was called.

| Field | Value |
|---|---|
| HTTP Status | n/a (browser closed) |
| decision | n/a |
| provider | alibaba |

## Stability Findings

### Finding 1 — Provider instability in real journeys (high severity)

In the 6 journeys before browser session collapse:
- api_timeout rate: 2/6 = 33% (exceeds 25% threshold in GC-018 §9)
- mock_fallback_no_receipt rate: 2/6 = 33%
- route_miss rate: 1/6 = 17%
- accepted rate: 1/6 = 17%

This directly triggers the W131 continuation rule: **next tranche = provider/runtime stability.**

### Finding 2 — Browser session instability (high severity)

The browser context closed at journey 7 (risk_assessment #1) after ~30 minutes of continuous operation.
All subsequent journeys (7–24) returned `ui_flow_error` because `page.goto` threw
"Target page, context or browser has been closed."

Root cause: Playwright `test.setTimeout(2400000ms)` killed the browser context when the test hit the 40-min
limit. The spec's analytics collection happened AFTER all journeys, causing the test to fail.

**Spec fix applied:** writeEvidence() now called before analytics collection. Future runs will persist
evidence even if the browser closes at the analytics step.

### Finding 3 — Clarification and follow-up lanes unmeasured

All clarification (5) and follow-up (3) journeys returned `ui_flow_error` due to browser collapse.
`clarification_recovery` and `followup_continuity` lanes remain `no_data`.

## Continuation Signal

W131 Alibaba CP3 partial run confirms:
- Alibaba `qwen-turbo` is significantly unstable under current conditions
- api_timeout + mock_fallback rate in live journeys = 67% (far above 25% GC-018 threshold)
- Browser session stability is a secondary concern requiring spec architecture fix
- Next tranche recommended: provider/runtime stability hardening

## Cross-Provider Comparison (Alibaba CP3 vs DeepSeek CP4)

Both providers ran the same journey prompts (Alibaba: all 24 matrix journeys, DeepSeek: first 6 journeys).
The results are strikingly consistent across providers.

| Metric | Alibaba qwen-turbo | DeepSeek deepseek-chat |
|---|---|---|
| Attempted journeys | 24 | 6 |
| Accepted (counted) | 1 | 1 |
| api_timeout | 2 (33% of real journeys) | 2 (33%) |
| mock_fallback_no_receipt | 2 (33% of real journeys) | 2 (33%) |
| route_miss | 1 (17% of real journeys) | 1 (17%) |
| accepted_with_exports | 1 (17% of real journeys) | 1 (17%) |
| ui_flow_error | 18 (browser collapse) | 0 |
| Successful form type | documentation | documentation |
| Failed form types | email, competitor_review | email, competitor_review |

**Key insight:** Both providers show identical 17% acceptance rate and identical failure distribution in real journeys.
This confirms the instability is **not provider-specific** — it is systemic to the current noncoder execution path.

## Exact Claim Boundary After W131

After W131, CVF may claim only:

> Under controlled conditions, the CVF noncoder path can produce a governed, accepted execution result
> with evidence export and deliverable pack export on the `documentation` form type, using both
> Alibaba qwen-turbo and DeepSeek deepseek-chat. The acceptance rate across all form types is 17%
> (1 in 6 real journeys). api_timeout and mock_fallback account for 66% of live journey attempts.
> The system is not stable enough for consistent multi-form noncoder operation at this time.

CVF may NOT claim after W131:

- Stable operation across the 8 W126 trusted form types
- Acceptance rates sufficient for production noncoder use
- Equivalence of provider quality
- Clarification recovery or follow-up continuity lane health

## Journey Log (reconstructed from console output)

| Prompt | Kind | Form | Outcome | Evidence | Pack |
|---|---|---|---|---|---|
| Soạn email giới thiệu dịch vụ tư vấn đến khách hàng | standard | email_template | `mock_fallback_no_receipt` | ❌ | ❌ |
| Viết email xác nhận lịch hẹn với đối tác kinh doanh | standard | email_template | `api_timeout` | ❌ | ❌ |
| Viết tài liệu hướng dẫn sử dụng cho nhân viên mới | standard | documentation | `accepted_with_exports` | ✅ | ✅ |
| Tạo tài liệu kỹ thuật cho API tích hợp hệ thống th | standard | documentation | `api_timeout` | ❌ | ❌ |
| Phân tích đối thủ cạnh tranh trong lĩnh vực dịch v | standard | competitor_review | `mock_fallback_no_receipt` | ❌ | ❌ |
| So sánh và đánh giá các phần mềm quản lý nhân sự p | standard | competitor_review | `route_miss` | ❌ | ❌ |
| Đánh giá rủi ro cho dự án triển khai phần mềm quản | standard | risk_assessment | `ui_flow_error` | ❌ | ❌ |
| Phân tích rủi ro khi mở rộng kinh doanh sang thị t | standard | risk_assessment | `ui_flow_error` | ❌ | ❌ |
| Xây dựng hồ sơ khách hàng mục tiêu cho ứng dụng qu | standard | user_persona | `ui_flow_error` | ❌ | ❌ |
| Tạo user persona cho nền tảng học trực tuyến dành c | standard | user_persona | `ui_flow_error` | ❌ | ❌ |
| Lập danh sách ưu tiên tính năng cho phiên bản tiếp | standard | feature_prioritization | `ui_flow_error` | ❌ | ❌ |
| Phân tích và sắp xếp thứ tự các tính năng cần phát | standard | feature_prioritization | `ui_flow_error` | ❌ | ❌ |
| Xây dựng chiến lược định giá cho sản phẩm SaaS B2B | standard | pricing_strategy | `ui_flow_error` | ❌ | ❌ |
| Phân tích mô hình freemium so với subscription cho | standard | pricing_strategy | `ui_flow_error` | ❌ | ❌ |
| Phân tích chiến lược mở rộng sang thị trường miền T | standard | strategy_analysis | `ui_flow_error` | ❌ | ❌ |
| Đánh giá cơ hội và thách thức khi ra mắt sản phẩm m | standard | strategy_analysis | `ui_flow_error` | ❌ | ❌ |
| Tôi cần giúp đỡ về marketing cho công ty | clarification | clarification_path | `ui_flow_error` | ❌ | ❌ |
| Làm thế nào để phát triển kinh doanh hiệu quả | clarification | clarification_path | `ui_flow_error` | ❌ | ❌ |
| Cần một kế hoạch cho sản phẩm mới | clarification | clarification_path | `ui_flow_error` | ❌ | ❌ |
| Phân tích thị trường | clarification | clarification_path | `ui_flow_error` | ❌ | ❌ |
| Viết gì đó giúp tôi tăng doanh số | clarification | clarification_path | `ui_flow_error` | ❌ | ❌ |
| Tôi muốn tìm hiểu thêm về rủi ro chính trong phân | followup | followup | `ui_flow_error` | ❌ | ❌ |
| Cần thêm ví dụ thực tế và số liệu minh họa | followup | followup | `ui_flow_error` | ❌ | ❌ |
| Tập trung vào giải pháp ngắn hạn có thể thực hiện n | followup | followup | `ui_flow_error` | ❌ | ❌ |
