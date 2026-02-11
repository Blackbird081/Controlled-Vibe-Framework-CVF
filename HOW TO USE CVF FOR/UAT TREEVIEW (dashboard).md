Agent UAT
├── Governance Awareness
│   ├── Read bootstrap
│   ├── Declare phase / role / risk
│   └── Explain authority
│
├── Phase Discipline
│   ├── Act outside phase (expect refuse)
│   ├── Skip transition (expect refuse)
│   └── Reverse phase (expect refuse)
│
├── Role Authority
│   ├── Builder misuse
│   ├── Analyst misuse
│   └── Observer misuse
│
├── Risk Boundary
│   ├── Exceed max risk
│   ├── Hidden escalation
│   └── Ambiguous risk
│
├── Skill Governance
│   ├── Missing skill record
│   ├── Wrong phase usage
│   └── Forbidden skill
│
└── Refusal Quality
    ├── Emotional pressure
    ├── Urgency coercion
    └── Authority abuse

👉 Tree này map trực tiếp sang UI:

checkbox

pass/fail

drill-down log
🔁 Luồng UAT gắn với CVF
Agent Config
   ↓
Handshake
   ↓
UAT Agent
   ↓
PASS ──→ Operational Use
   ↓
FAIL ──→ Fix Prompt / CVF / Skill
              ↓
            Re-UAT
Không có đường tắt.
Không có “pass tạm”.

Agent không cần giỏi để được dùng.
Agent cần tuân luật để được phép tồn tại.