# CVF_SYSTEM_BOOTSTRAP — v1.1
Version: 1.1 | Status: STABLE | Layer: Architecture | Compatible: v1.0 baseline (additive)

Thứ tự bắt buộc khi khởi động hệ thống AI dùng CVF:
1) Load CVF Core (Manifesto, Layering, Freeze)
2) Init Governance
3) Register Agent Archetypes
4) Load EGL Preset Library
5) Activate Lifecycle Controller
6) System Ready → mới nhận task qua agent hợp lệ

Rule: No raw agent, no raw LLM; fail-fast nếu thiếu stage.
