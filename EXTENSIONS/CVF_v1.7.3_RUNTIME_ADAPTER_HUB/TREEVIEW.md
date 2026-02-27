# CVF v1.7.3 — Runtime Adapter Hub — Tree View

```
CVF_v1.7.3_RUNTIME_ADAPTER_HUB/
├── README.md                              # Extension overview
├── TREEVIEW.md                            # This file
├── package.json                           # Dependencies (vitest, typescript)
├── tsconfig.json                          # Strict TS config
├── vitest.config.ts                       # Test runner config
│
├── contracts/                             # ── Universal Adapter Contracts ──
│   ├── llm.adapter.interface.ts           # LLM provider contract
│   ├── runtime.adapter.interface.ts       # Runtime execution contract
│   ├── tool.adapter.interface.ts          # Tool execution contract
│   ├── memory.adapter.interface.ts        # Memory/state persistence contract
│   ├── policy.contract.ts                 # Policy evaluation contract
│   └── index.ts                           # Barrel export
│
├── adapters/                              # ── Runtime Implementations ──
│   ├── base.adapter.ts                    # Shared filesystem + HTTP helpers
│   ├── openclaw.adapter.ts                # OpenClaw (fs + shell + http)
│   ├── picoclaw.adapter.ts                # PicoClaw (fs only)
│   ├── zeroclaw.adapter.ts                # ZeroClaw (http only)
│   ├── nano.adapter.ts                    # Nano (sandboxed delegation)
│   └── index.ts                           # Barrel export
│
├── explainability/                        # ── Human-Readable Explanations ──
│   └── explainability.layer.ts            # EN/VI action explanations
│
├── policy/                                # ── Natural Language Policy ──
│   └── natural.policy.parser.ts           # NLP → structured rules
│
├── risk_models/                           # ── JSON Risk Configuration ──
│   ├── risk.matrix.json                   # Base risk scores (0-100)
│   ├── destructive.rules.json             # Destructive pattern detection
│   ├── external.comm.rules.json           # External communication rules
│   └── escalation.thresholds.json         # Escalation threshold bands
│
└── tests/                                 # ── Test Suite ──
    ├── contracts.test.ts                  # Contract compliance tests
    ├── adapters.test.ts                   # Adapter behavior tests
    ├── explainability.test.ts             # Explanation output tests
    └── policy-parser.test.ts              # NLP parser tests
```
