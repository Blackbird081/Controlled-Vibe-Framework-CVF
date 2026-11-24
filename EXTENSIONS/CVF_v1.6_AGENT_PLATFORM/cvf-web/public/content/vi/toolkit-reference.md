# CVF Toolkit Reference — Ví Dụ Governance Engine

> 📘 **Triển Khai Tham Khảo** — Đây là tài liệu học tập, không phải hệ thống runtime.

## Đây Là Gì?

CVF Toolkit Reference là một **governance enforcement engine viết bằng TypeScript** minh họa cách triển khai các khái niệm governance CVF trong code. Bao gồm:

- **Risk Classifier** — Đánh giá rủi ro ngữ cảnh (R0–R3; R4 blocked) với leo thang domain, environment và capability
- **Phase Controller** — Vòng đời tuần tự P0→P6 với protocol đóng băng
- **Governance Guard** — Bộ điều phối enforcement trung tâm kiểm tra risk + phase + operator + change + freeze + environment
- **Skill Registry** — Đăng ký, truy vấn và vô hiệu hóa skill có kiểm soát
- **Operator Policy** — Phân quyền theo vai trò (VIEWER → ANALYST → REVIEWER → APPROVER → ADMIN)
- **Change Controller** — Vòng đời thay đổi đầy đủ (draft → submitted → approved → implemented → frozen)
- **Audit Logger** — Ghi log sự kiện không thể bỏ qua với sanitize PII
- **AI Provider Abstraction** — Giao diện AI đa nhà cung cấp (OpenAI, Claude, Gemini)

## Kiến Trúc

```
02_TOOLKIT_CORE/        → Engine enforcement (TypeScript)
  ├── interfaces.ts     → Tất cả type dùng chung (nguồn sự thật duy nhất)
  ├── errors.ts         → 12 lớp lỗi (CVF_ERR_001–012)
  ├── cvf.config.ts     → Cấu hình tập trung
  ├── governance.guard.ts → Enforcement trung tâm
  ├── risk.classifier.ts → Tính toán rủi ro
  ├── phase.controller.ts → Máy trạng thái phase
  ├── skill.registry.ts → Quản lý skill
  ├── operator.policy.ts → Phân quyền vai trò
  ├── change.controller.ts → Vòng đời thay đổi
  ├── audit.logger.ts   → Nhật ký kiểm toán
  └── audit.sanitizer.ts → Che giấu PII

03_ADAPTER_LAYER/       → Cầu nối bên ngoài
07_AI_PROVIDER_ABSTRACTION/ → AI đa nhà cung cấp
04_EXTENSION_LAYER/     → Plugin domain (financial, dexter)
```

## Mức Rủi Ro

| Mức | Tên | Giới Hạn Môi Trường | Yêu Cầu |
|-----|-----|---------------------|----------|
| **R0** | Thụ động | Cho phép mọi nơi | — |
| **R1** | Thấp | Cho phép mọi nơi | — |
| **R2** | Trung bình | dev + staging | UAT |
| **R3** | Cao | chỉ dev | UAT + Phê duyệt + Đóng băng |
| **R4** | Bị chặn | Bị chặn | Không bao giờ chạy |

## Mô Hình Phase (P0–P6)

```
P0_DESIGN → P1_BUILD → P2_INTERNAL_VALIDATION → P3_UAT → P4_APPROVED → P5_PRODUCTION → P6_FROZEN
```

- Chỉ tuần tự (không bỏ qua phase)
- R4 bị chặn và không bao giờ chạy; đánh giá R3 theo kiểm soát Local áp dụng
- Chỉ ADMIN có thể rollback P6 → P0

## Luồng Governance

```
Yêu Cầu Skill
    │
    ├── SkillRegistry.get(skillId)     → Xác nhận skill tồn tại & hoạt động
    ├── RiskClassifier.classify()      → Tính toán mức rủi ro
    ├── PhaseController.validate()     → Kiểm tra cổng phase
    ├── OperatorPolicy.check()         → Xác minh quyền vai trò
    ├── ChangeController.validate()    → Kiểm tra tuân thủ thay đổi
    ├── FreezeProtocol.check()         → Xác minh trạng thái đóng băng
    ├── EnvironmentCap.validate()      → Kiểm tra giới hạn môi trường
    │
    ▼
GovernanceDecision { allowed, riskLevel, reasons }
    │
    ▼
AuditLogger.log()
```

## Độ Phủ Test

| Chỉ số | Giá trị |
|--------|---------|
| Test Suites | 9 passed |
| Tests | 111 passed |
| Statements | 98,31% |
| Branches | 86,15% |
| Functions | 100% |
| Lines | 98,29% |

## Khi Nào Sử Dụng

- ✅ Học cách triển khai governance enforcement bằng TypeScript
- ✅ Hiểu các mẫu risk/phase/skill/change của CVF
- ✅ Kiến trúc tham khảo để xây dựng governance engine riêng
- ❌ Không dùng cho production — hãy dùng CVF Web Platform thay thế

## Vị Trí

```
EXTENSIONS/CVF_TOOLKIT_REFERENCE/
```

**Liên quan:** [CVF Web Platform](/docs/web-ui-setup) | [Mô Hình Governance](/docs/governance-model) | [Mô Hình Rủi Ro](/docs/risk-model)

<!-- Text Encoding Exception: preserves localized reader text and existing navigation symbols. -->
