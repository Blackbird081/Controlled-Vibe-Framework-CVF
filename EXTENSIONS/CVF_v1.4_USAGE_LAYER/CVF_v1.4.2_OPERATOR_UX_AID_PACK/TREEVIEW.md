CVF_v1.4.2_OPERATOR_UX_AID_PACK/
│
├── README.md
│   └── Định vị v1.4.2: đây KHÔNG phải workflow engine
│
├── 00_POSITIONING_AND_RULES.md
│   └── Ranh giới: giúp hiểu & chuẩn bị, không can thiệp execution
│
├── 01_VISUAL_MAPS/
│   │
│   ├── README.md
│   │   └── Cách đọc các sơ đồ CVF
│   │
│   ├── cvf_lifecycle_map.md
│   │   └── Input → Execution → Output → Audit → Governance
│   │
│   ├── responsibility_boundary_map.md
│   │   └── Operator vs AI vs Governance
│   │
│   ├── misuse_to_escalation_flow.md
│   │   └── Signal → Misuse → Corrective → Escalation
│   │
│   └── stop_rerun_accept_decision_tree.md
│       └── Khi nào dừng, khi nào rerun, khi nào accept failure
│
├── 02_PHASE_BLOCK_TEMPLATES/
│   │
│   ├── README.md
│   │   └── Block là cấu trúc điền, KHÔNG phải node chạy
│   │
│   ├── 00_block_usage_rules.md
│   │   └── Không reorder, không skip, không modify semantics
│   │
│   ├── input_block_template.md
│   │   └── Chuẩn hóa input contract (fill-in)
│   │
│   ├── execution_declaration_block.md
│   │   └── Khai báo execution intent (read-only)
│   │
│   ├── output_expectation_block.md
│   │   └── Định nghĩa “output hợp lệ” trước khi chạy
│   │
│   └── audit_trace_block.md
│       └── Ghi trace để review, không dùng để debug
│
├── 03_INTENT_TO_INPUT_HELPER/
│   │
│   ├── README.md
│   │   └── Tool hỗ trợ chuyển intent → input (operator approve)
│   │
│   ├── intent_intake_form.md
│   │   └── Câu hỏi chuẩn để lấy intent đúng cách
│   │
│   ├── intent_to_input_mapping.md
│   │   └── Mapping intent → input fields (rule-based)
│   │
│   ├── scope_suggestion_rules.md
│   │   └── Gợi ý scope, KHÔNG auto-apply
│   │
│   └── example_transformations.md
│       └── Ví dụ intent → input (đúng / sai)
│
├── 04_OPERATOR_UX_GUARDRAILS/
│   │
│   ├── README.md
│   │   └── Guardrail ≠ enforcement
│   │
│   ├── pre_execution_self_check.md
│   │   └── Checklist nhanh trước khi chạy
│   │
│   ├── interactive_drift_warnings.md
│   │   └── Dấu hiệu operator đang chat hóa AI
│   │
│   ├── common_operator_traps.md
│   │   └── Bẫy UX phổ biến khi dùng AI
│   │
│   └── when_to_stop_instead_of_retry.md
│       └── Ngừng đúng lúc là kỹ năng
│
├── 05_INTEGRATION_REFERENCES/
│   │
│   ├── README.md
│   │   └── Cách gắn v1.4.2 với các version khác
│   │
│   ├── mapping_to_v1.3.1_core.md
│   │   └── File nào của core được tham chiếu
│   │
│   ├── mapping_to_v1.4.1_extensions.md
│   │   └── Không trùng lặp, không override
│   │
│   └── downgrade_and_opt_out.md
│       └── Không dùng v1.4.2 vẫn hợp lệ
│
└── APPENDIX/
    │
    ├── glossary_operator_friendly.md
    │   └── Thuật ngữ CVF viết cho người không kỹ thuật
    │
    ├── visual_notation_legend.md
    │   └── Quy ước ký hiệu cho sơ đồ
    │
    └── design_rationale.md
        └── Vì sao v1.4.2 tồn tại và vì sao nó không vượt quyền
