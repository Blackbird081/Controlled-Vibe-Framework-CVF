# CVF Phase Governance Trace Archives

Trạng thái: archive chain cho các trace/log scoped thuộc `cvf_phase_governance`.

## Purpose

- giữ trace scoped append-only mà không để active trace tăng mãi
- tách active trace khỏi historical windows để human review nhanh hơn
- bảo toàn khả năng lần theo batch cũ khi cần audit

## Current Scope

Hiện tại folder này được chuẩn hóa cho:

- archived windows của `CVF_CONFORMANCE_TRACE_2026-03-07.md`

Các trace scoped khác chỉ được archive vào đây khi đã có rotation guard riêng.
