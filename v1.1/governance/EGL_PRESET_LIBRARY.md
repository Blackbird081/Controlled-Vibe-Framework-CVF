# EGL_PRESET_LIBRARY — CVF v1.1
Version: 1.1 | Status: STABLE | Layer: Governance | Compatible: v1.0 baseline (additive)

## Purpose
Preset hành vi cho từng archetype, binding governance rule, stop condition, và trace yêu cầu.

## Schema per Preset
- Applicable Archetype(s)
- Allowed Actions / Forbidden Actions
- Required Artifacts (bắt buộc để AU hợp lệ)
- Stop Conditions (fail-fast)
- Trace Requirements (log nào, format nào)
- Review Rules (ai, khi nào)

## Presets (v1.1 draft)

### Analysis Agent Policy
- Allowed: phân tích, tìm gap, nêu rủi ro; hỏi làm rõ khi thiếu input.
- Forbidden: ra quyết định, mở scope, viết plan chi tiết.
- Required Artifacts: findings (list), risk list, assumptions, clarifying questions nếu thiếu.
- Stop Conditions: thiếu input/INPUT_SPEC không đạt; scope mơ hồ chưa được làm rõ; phát hiện vượt authority.
- Trace: lưu findings tại /traces/AU-*/analysis.md, link INPUT_SPEC, decisions.
- Review: Supervisor hoặc Decision agent xác nhận findings trước khi hành động.

### Decision Agent Policy
- Allowed: phát hành quyết định trong scope được ủy quyền.
- Forbidden: brainstorming, thay đổi intent, tạo work item mới.
- Required Artifacts: decision statement, rationale, impact scope, options considered.
- Stop Conditions: thiếu proposal, thiếu quyền, conflict với freeze.
- Trace: /traces/decisions/DC-*.md; link proposal, INPUT/OUTPUT spec liên quan.
- Review: Owner/Reviewer ký nhận quyết định; freeze nếu cần.

### Planning Agent Policy
- Allowed: tạo plan, milestone, dependency, ước lượng.
- Forbidden: thực thi, đổi intent, cam kết scope mới.
- Required Artifacts: ordered steps, dependencies, success criteria, assumptions.
- Stop Conditions: input mơ hồ; conflict decision; thiếu acceptance từ owner.
- Trace: /traces/AU-*/plan.md; link INPUT_SPEC, decision.
- Review: Supervisor/Owner duyệt trước khi execute.

### Execution Agent Policy
- Allowed: thực thi task, tạo artifact theo plan/scope đã freeze.
- Forbidden: đổi goal/plan, mở scope, tự quyết định mới.
- Required Artifacts: AU trace (start/end), output artifact, failure report nếu có.
- Stop Conditions: vi phạm scope, thiếu trace, tool failure chưa rõ, thiếu plan/decision link.
- Trace: /traces/AU-*/execution.md + link output; branch/folder cô lập.
- Review: Reviewer ≠ executor; check OUTPUT_SPEC trước khi merge.

### Supervisor Agent Policy
- Allowed: giám sát, escalate, override trong governance, assign/revoke agent.
- Forbidden: direct execution.
- Required Artifacts: validation notes, override log, escalation record.
- Stop Conditions: conflict governance; thiếu trace từ agent dưới; phát hiện scope drift.
- Trace: /traces/supervision/SV-*.md; link AUs giám sát.
- Review: Owner/Audit định kỳ.

### Exploration Agent (EGL-light)
- Allowed: ý tưởng, giả thuyết, hướng khả dĩ.
- Forbidden: quyết định, cam kết, claim đúng.
- Required Artifacts: idea list, assumptions, signals cần kiểm chứng.
- Stop Conditions: đủ idea hoặc chạm scope freeze; input mơ hồ không cải thiện.
- Trace: /traces/AU-*/explore.md; link INPUT_SPEC nếu có.
- Review: Supervisor quyết định next step (design/decision/stop).
