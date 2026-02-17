# CVF Starter Template – Reference Implementation

> **⚠️ ĐÂY LÀ REFERENCE IMPLEMENTATION — KHÔNG PHẢI PRODUCTION RUNTIME**

**Version:** 1.0.0  
**Status:** Reference Example — Controlled Extension of CVF  
**Type:** 📘 Ứng dụng mở rộng có kiểm soát (Controlled Extension)  
**Scope:** Ví dụ minh họa AI Governance Operating Framework  
**Last Updated:** 2026-02-17  
**Parent Framework:** [CVF v1.0–v1.6](../../README.md)  

---

## ⚡ Quan Hệ Với Hệ Thống CVF

```
CVF Core (v1.0/v1.1) ──── FROZEN, không thay đổi
    ↓ extends
CVF Extensions (v1.2–v1.6) ──── Production extensions
    ↓ includes
CVF Web Platform (v1.6/cvf-web) ──── Production runtime (1068 tests, 95.6% coverage)
    
    ┌──────────────────────────────────────────┐
    │  📘 CVF STARTER TEMPLATE REFERENCE       │  ← Bạn đang ở đây
    │  Ví dụ minh họa cách xây dựng project    │
    │  AI mới với governance pipeline bằng     │
    │  Express + TypeScript                    │
    └──────────────────────────────────────────┘
```

**Template này KHÔNG phải là phần core của CVF.** Nó là ví dụ minh họa cách xây dựng một AI project server-side có đầy đủ governance pipeline, giúp developers hiểu cách:

- Triển khai 13-step execution pipeline (risk → governance → AI → audit)
- Tách domain logic khỏi governance framework
- Implement multi-provider AI (OpenAI, Claude, Gemini)
- Xây dựng budget guard, freeze guard, audit logging
- Tổ chức code theo layered architecture

> **Lưu ý:** Production runtime thật của CVF nằm tại `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/`. Template này là tài liệu tham khảo kèm code minh họa cho Express/Node.js stack.

---

## 1. Overview

CVF Starter Template minh họa **AI Governance Operating Framework** pattern được xây dựng dựa trên **Controlled Vibe Framework (CVF)**.

**Mục tiêu minh họa:**

- Tách biệt AI domain logic khỏi governance logic
- Chuẩn hóa risk control, policy enforcement, freeze protocol
- Tạo nền tảng tái sử dụng cho mọi AI project sau này

> Template này là **reference implementation** cho Express/Node.js stack.  
> Production web platform sử dụng Next.js — xem `CVF_v1.6_AGENT_PLATFORM/cvf-web/`.

---

## 2. Kiến trúc tổng thể

```
┌─────────────────────────────────────────┐
│             Extension Layer             │
│  workflows/ · tools/ · domain-engine/   │
├─────────────────────────────────────────┤
│              Provider Layer             │
│      OpenAI  ·  Claude  ·  Gemini       │
├─────────────────────────────────────────┤
│               Core Layer                │
│  Risk · Governance · Budget · Freeze    │
│  Policy · Audit · State Machine · Lock  │
│  Idempotency · Replay · Integrity       │
└─────────────────────────────────────────┘
```

Core đã freeze v1.0.0. Domain layer có thể mở rộng tự do.

---

## 3. Core Responsibilities

**Core chịu trách nhiệm:**

| Capability | Module |
|---|---|
| Phân loại risk | `risk-classifier.service.ts` |
| Chặn HIGH risk | `risk-escalation.service.ts` |
| Kiểm tra provider/model | `governance-gate.service.ts` |
| Áp policy tùy chỉnh | `policy-engine.service.ts` |
| Chặn vượt budget | `budget-guard.service.ts` |
| Freeze nếu fail liên tiếp | `freeze-guard.service.ts` |
| Ghi cost | `cost.repository.ts` |
| Structured logging | `structured-logger.ts` |
| Chống replay | `replay-protection.ts` |
| Chống double-run | `idempotency.service.ts` + `execution-lock.ts` |
| State validation | `execution-state-machine.ts` |
| Integrity check | `cvf-integrity-check.ts` + `audit-integrity.ts` |
| Certification gate | `certification.service.ts` |

**Core KHÔNG:** tính toán tài chính, gọi VNStock, xử lý nghiệp vụ domain, viết prompt domain.

---

## 4. Freeze Policy

| Key | Value |
|-----|-------|
| Version | `1.0.0` |
| Status | **LOCKED** |

Core chỉ được sửa nếu:

1. Có Change Control
2. Có UAT mới
3. Có Certification mới
4. Bump version (MINOR hoặc MAJOR)

---

## 5. Cách sử dụng

### Bước 1 – Clone template

```bash
git clone cvf-starter-template
cd cvf-starter-template/src
npm install
```

### Bước 2 – Cấu hình `.env`

```env
PORT=3000
NODE_ENV=development
PROJECT_NAME=my-ai-project
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GEMINI_API_KEY=AIza-xxx
```

### Bước 3 – Chạy server

```bash
npm run dev
```

### Bước 4 – Gọi API

```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze Q4 revenue data",
    "provider": "openai",
    "model": "gpt-4o"
  }'
```

Providers hỗ trợ: `openai`, `claude`, `gemini`

### Bước 5 – Extend

Viết thêm vào: `workflows/`, `tools/`, `adapters/`  
**Không sửa:** `core/`, `cvf/`, `providers/`

---

## 6. AI Provider Abstraction

| Provider | Models |
|----------|--------|
| **OpenAI** | GPT-4o, GPT-4o-mini |
| **Claude** | Claude 3.5 Sonnet, Claude 3 Haiku |
| **Gemini** | Gemini 1.5 Pro, Gemini 1.5 Flash |

Core không phụ thuộc provider cụ thể — chỉ cần implement `AIProvider` interface.

---

## 7. Production Features

- ✅ Structured JSON logging
- ✅ Health check endpoint (`GET /health`)
- ✅ Metrics service (counter-based)
- ✅ Rate limiting (time-window auto-reset)
- ✅ API key rotation (round-robin, validated)
- ✅ Encryption (AES-256-CTR + HMAC)
- ✅ Immutable audit hash (SHA-256)
- ✅ CVF integrity checksum
- ✅ Freeze guard (auto-freeze on 3+ consecutive failures)
- ✅ Replay protection (timestamp + nonce)
- ✅ Execution lock (with timeout auto-release)
- ✅ Idempotency guard (with TTL auto-cleanup)
- ✅ Model autoscale (configurable per-provider)
- ✅ Certification engine

---

## 8. UAT & Certification

Trước khi freeze:

1. Chạy **UAT Runner** — test các scenarios
2. Generate **Compliance Report** — kiểm tra modules
3. Generate **Certification** — freeze metadata
4. **Lock version** — block deployment nếu chưa certified

---

## 9. Execution Flow

```
REQUEST
  → Replay Protection
  → Idempotency Check
  → Execution Lock
  → Risk Classification
  → Risk Escalation
  → Governance Gate
  → Policy Engine
  → Budget Guard
  → Freeze Guard
  → AI Execution
  → Cost Recording
  → Output Validation
  → Audit Logging
  → COMPLETE
```

**On Failure:** Record failure → Freeze if ≥ 3 fails → Audit failed execution

---

## 10. Extension Guidelines

| Action | Directories |
|--------|-------------|
| ✅ **Viết thêm** | `workflows/`, `tools/`, `adapters/` |
| ❌ **Không sửa** | `core/`, `cvf/`, `providers/` |

---

## 11. Docker

```bash
cd src/docker
docker build -t cvf-starter .
docker run -p 3000:3000 --env-file ../.env cvf-starter
```

---

## 12. Vị Trí Trong Hệ Sinh Thái CVF

| Component | Role | Status |
|-----------|------|--------|
| **CVF Core (v1.0/v1.1)** | Governance principles, phases A–D | ✅ FROZEN |
| **CVF Extensions (v1.2–v1.6)** | Capability, toolkit, usage, UX, agent platform | ✅ Production |
| **CVF Web (v1.6/cvf-web)** | Production web platform, 1068 tests | ✅ Production |
| **📘 CVF Toolkit Reference** | Ví dụ governance engine | 📘 Reference |
| **📘 CVF Starter Template Reference** | **Ví dụ Express project template** | 📘 Reference |

### Khi Nào Dùng Template Reference?

- ✅ Muốn xây dựng Express/Node.js AI server với governance
- ✅ Muốn tham khảo 13-step execution pipeline
- ✅ Muốn hiểu dependency injection pattern cho governance
- ✅ Muốn ví dụ multi-provider AI abstraction

### Khi Nào KHÔNG Dùng?

- ❌ Muốn PRODUCTION web platform → dùng `CVF_v1.6_AGENT_PLATFORM/cvf-web/`
- ❌ Muốn governance specifications → dùng `v1.0/`, `v1.1/`, `governance/`
- ❌ Muốn SDK → dùng `CVF_v1.3_IMPLEMENTATION_TOOLKIT/typescript-sdk/`

## 13. License / Internal Use

Khuyến nghị sử dụng nội bộ tổ chức.  
Reference implementation — tham khảo architecture patterns, không dùng trực tiếp cho production.
