CVF TOOLKIT (Canonical Edition)
Một framework độc lập, lâu dài, AI-agnostic, Agent-agnostic
Dexter + Financial AI chỉ là 1 implementation.
https://github.com/virattt/dexter

CVF làm Core Constitution

Xây một layer mới tên: CVF-TOOLKIT

CVF-TOOLKIT/
│
├── tsconfig.json
├── package.json
├── jest.config.js
├── CHANGELOG.md
├── REVIEW_BASELINE.md
│
├── 00_CANONICAL_REFERENCE/
│   ├── cvf_version.lock.md
│   └── cvf.version.validator.ts         [NEW]
│
├── 01_CORE_MAPPING/
│   ├── governance.mapping.md
│   ├── risk.phase.mapping.md
│   ├── skill.schema.mapping.md
│   ├── change.control.mapping.md
│   ├── agent.lifecycle.mapping.md
│   ├── mapping.index.md                 [NEW]
│   └── glossary.md                      [NEW]
│
├── 02_TOOLKIT_CORE/
│   ├── interfaces.ts                    [NEW] — shared type definitions
│   ├── errors.ts                        [NEW] — centralized error classes
│   ├── cvf.config.ts                    [NEW] — centralized configuration
│   ├── audit.logger.ts
│   ├── audit.logger.spec.md             [NEW]
│   ├── audit.sanitizer.ts              [NEW]
│   ├── skill.registry.ts
│   ├── skill.registry.spec.md           [NEW]
│   ├── operator.policy.ts
│   ├── operator.policy.spec.md          [NEW]
│   ├── risk.classifier.ts
│   ├── risk.classifier.spec.md
│   ├── phase.controller.ts
│   ├── phase.controller.spec.md
│   ├── change.controller.ts
│   ├── governance.guard.ts
│   ├── governance.guard.spec.md
│   ├── dependency.map.md                [NEW]
│   └── error.reference.md              [NEW]
│
├── 03_ADAPTER_LAYER/
│   ├── cvf.skill.adapter.ts
│   ├── cvf.governance.adapter.ts
│   ├── cvf.change.adapter.ts           [UPDATED]
│   ├── cvf.uat.adapter.ts
│   ├── cvf.agent.adapter.ts
│   └── adapter.factory.ts              [NEW]
│
├── 04_EXTENSION_LAYER/
│   ├── _extension.template/             [NEW]
│   │   ├── README.md
│   │   ├── domain.risk.profile.template.ts
│   │   ├── domain.skill.pack.template.ts
│   │   └── domain.validation.rules.template.ts
│   │
│   ├── financial.extension/
│   │   ├── financial.risk.profile.ts
│   │   ├── financial.skill.pack.ts
│   │   └── financial.validation.rules.ts
│   │
│   └── dexter.integration/
│       ├── dexter.workflow.adapter.ts
│       └── dexter.agent.bridge.ts       [UPDATED]
│
├── 05_UAT_AND_CERTIFICATION/
│   ├── uat.runner.ts
│   ├── uat.rubric.md
│   ├── certification.schema.md
│   └── compliance.report.generator.ts
│
├── 06_VERSIONING_AND_FREEZE/
│   ├── version.policy.md
│   ├── freeze.protocol.md
│   ├── freeze.protocol.ts              [NEW]
│   └── migration.guide.template.md
│
├── 07_AI_PROVIDER_ABSTRACTION/
│   ├── provider.interface.ts
│   ├── provider.registry.ts             [NEW]
│   ├── provider.security.spec.md        [NEW]
│   ├── openai.provider.ts
│   ├── claude.provider.ts               [UPDATED]
│   ├── gemini.provider.ts
│   └── model.approval.list.md
│
├── 08_DOCUMENTATION/
│   ├── architecture.overview.md         [UPDATED — Mermaid diagrams]
│   ├── api.reference.md                 [NEW]
│   ├── onboarding.guide.md              [NEW]
│   ├── sequence.diagrams.md             [NEW]
│   ├── decisions.md                     [NEW — ADR]
│   ├── integration.playbook.md
│   ├── project.bootstrap.guide.md
│   └── agent.behavior.contract.md
│
└── __tests__/                           [NEW]
    ├── risk.classifier.test.ts
    ├── phase.controller.test.ts
    ├── change.controller.test.ts
    ├── governance.guard.test.ts
    └── integration/
        └── governance.flow.test.ts
