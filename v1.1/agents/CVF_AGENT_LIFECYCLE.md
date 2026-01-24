# CVF_AGENT_LIFECYCLE — v1.1 FINAL
Version: 1.1 | Status: STABLE | Layer: Agents | Compatible: v1.0 baseline (additive)

6 trạng thái bắt buộc: Invocation → Binding → Activation → Execution → Transition → Termination.

Nguyên tắc:
- Không agent vô hạn; luôn có stop condition.
- Binding bắt buộc: Archetype + Preset + Governance.
- Transition = escalate/delegate/role switch (terminate cũ, spawn mới).
- Termination phải log output + trace, giải phóng quyền.
