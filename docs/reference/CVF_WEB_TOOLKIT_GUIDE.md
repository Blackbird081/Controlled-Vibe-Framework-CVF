# HƯỚNG DẪN SỬ DỤNG CVF TOOLKIT TRÊN WEB

> **Mục tiêu:** Hướng dẫn đầy đủ cách dùng CVF Governance Toolkit trên nền tảng web v1.6,
> bao gồm: Xuất Spec, Agent Chat có governance, và cài đặt + chạy trên máy local.

**Version:** 2.0 | **Ngày:** 13/02/2026 | **Platform:** CVF v1.6 Agent Platform

---

## MỤC LỤC

1. [Tổng quan kiến trúc Web Toolkit](#phần-1--tổng-quan-kiến-trúc-web-toolkit)
2. [Cài đặt & chạy trên máy local](#phần-2--cài-đặt--chạy-trên-máy-local)
3. [Xuất Spec (SpecExport)](#phần-3--xuất-spec-specexport)
4. [Agent Chat có Governance](#phần-4--agent-chat-có-governance)
5. [Governance Bar — Điều khiển Phase/Role/Risk](#phần-5--governance-bar)
6. [Governance Panel — Self-UAT & Monitoring](#phần-6--governance-panel--self-uat)
7. [Skills ↔ Templates — Liên kết hai chiều](#phần-7--skills--templates)
8. [Workflow hoàn chỉnh (End-to-End)](#phần-8--workflow-hoàn-chỉnh)

---

## PHẦN 1 — TỔNG QUAN KIẾN TRÚC WEB TOOLKIT

### Các thành phần chính trên web

```
┌─────────────────────────────────────────────────────┐
│  CVF v1.6 Web App (localhost:3000)                  │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Templates   │  │  Agent Chat  │  │  Skills   │ │
│  │  (50 forms)  │  │  (AI Chat)   │  │ (124 lib) │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                │        │
│  ┌──────▼─────────────────▼────────────────▼─────┐  │
│  │          Governance Layer (Toolkit)            │  │
│  │  ┌──────────────┐ ┌──────────────┐            │  │
│  │  │GovernanceBar │ │GovernancePanel│            │  │
│  │  │Phase/Role/   │ │Self-UAT      │            │  │
│  │  │Risk Control  │ │Monitoring    │            │  │
│  │  └──────────────┘ └──────────────┘            │  │
│  │                                               │  │
│  │  governance-context.ts   ← Authority Matrix   │  │
│  │  enforcement.ts          ← ALLOW/BLOCK        │  │
│  │  risk-check.ts           ← R0-R3 evaluation   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  SpecExport → 3 modes (Simple/Rules/Full)    │   │
│  │  + Governance metadata auto-inject           │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Luồng dữ liệu

```
User chọn Template → Điền form → SpecExport (3 modes)
                                      │
                        ┌─────────────┼──────────────┐
                        ▼             ▼              ▼
                   📝 Simple    ⚠️ Rules      🚦 CVF Full
                   (no rules)  (+guardrails)  (4-Phase +
                                              governance
                                              metadata)
                                                  │
                                          ┌───────▼───────┐
                                          │ Copy & paste  │
                                          │ vào AI bất kỳ │
                                          │ HOẶC          │
                                          │ Send to Agent │
                                          │ Chat →→→→→→→→ │
                                          └───────────────┘
                                                  │
                                          ┌───────▼───────┐
                                          │  Agent Chat   │
                                          │  + Governance │
                                          │  Bar (Auto)   │
                                          │  + System     │
                                          │  Prompt inject│
                                          └───────────────┘
```

---

## PHẦN 2 — CÀI ĐẶT & CHẠY TRÊN MÁY LOCAL

### Yêu cầu hệ thống

| Thành phần | Yêu cầu |
|------------|----------|
| Node.js | >= 18.x |
| npm | >= 9.x |
| OS | Windows / macOS / Linux |
| RAM | >= 4GB (recommended 8GB) |
| Disk | >= 500MB |

### Bước 1: Clone repository

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF
```

### Bước 2: Cài đặt dependencies

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
```

### Bước 3: Cấu hình API keys (tuỳ chọn, cho Agent Chat)

Tạo file `.env.local`:

```env
# Chọn 1 hoặc nhiều provider
GOOGLE_AI_API_KEY=your-gemini-key       # Gemini (recommended)
OPENAI_API_KEY=your-openai-key          # OpenAI
ANTHROPIC_API_KEY=your-anthropic-key    # Claude

# Tuỳ chọn
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> 💡 **Tip:** Nếu chỉ dùng SpecExport (xuất spec rồi paste vào AI bên ngoài), **không cần API key**.

### Bước 4: Chạy ứng dụng

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

### Bước 5: Build cho production (tuỳ chọn)

```bash
npm run build     # Build
npm start         # Chạy production server
```

### Cấu trúc thư mục quan trọng

```
cvf-web/
├── src/
│   ├── app/                    ← Pages (Next.js App Router)
│   │   ├── page.tsx            ← Trang chính (Templates)
│   │   ├── skills/             ← Trang Skills Library
│   │   └── help/               ← Trang trợ giúp
│   ├── components/
│   │   ├── SpecExport.tsx      ← Xuất spec (3 modes)
│   │   ├── AgentChat.tsx       ← AI Agent Chat
│   │   ├── GovernanceBar.tsx   ← Phase/Role/Risk control
│   │   ├── GovernancePanel.tsx ← Self-UAT sidebar
│   │   ├── DynamicForm.tsx     ← Form templates
│   │   └── SkillLibrary.tsx    ← 62 active skills browser
│   └── lib/
│       ├── governance-context.ts   ← Authority matrix
│       ├── skill-template-map.ts   ← Skills ↔ Templates mapping
│       └── templates/              ← 50 template definitions
└── public/
    └── data/
        └── skills-index.json       ← Skills data cache
```

---

## PHẦN 3 — XUẤT SPEC (SpecExport)

### Mục đích

Biến form input thành **prompt chuyên nghiệp** để paste vào bất kỳ AI tool nào.

### 3 Chế độ xuất

| Mode | CVF Power | Khi nào dùng | Output |
|------|:---------:|--------------|--------|
| 📝 **Simple** | ~15% | Task đơn giản, không cần governance | Prompt ngắn gọn |
| ⚠️ **With Rules** | ~35% | Cần guardrails, stop conditions | Prompt + rules |
| 🚦 **CVF Full** | ~80% | Dự án quan trọng, cần 4-Phase protocol | 4-Phase + governance metadata |

### Cách sử dụng

1. **Chọn template** từ trang chính (50 templates trong 8 danh mục)
2. **Điền form** — các trường bắt buộc (*) và tuỳ chọn
3. **Chọn chế độ xuất** — Simple / With Rules / CVF Full
4. **Chọn ngôn ngữ** — Vietnamese hoặc English
5. **Copy** — nút "Copy to Clipboard"
6. **Paste** vào ChatGPT, Claude, Gemini, Cursor, hoặc AI bất kỳ

### Governance metadata tự động (Mode: Rules & Full)

Khi chọn mode "With Rules" hoặc "CVF Full", hệ thống **tự động** inject:

```markdown
## 📋 CVF Governance Context
- Phase: BUILD | Role: BUILDER | Risk: R2
- Allowed Actions: write code, create files, modify existing code, ...
- Max Risk for this phase: R3
- ⚠️ Refusal template: "Tôi không thể thực hiện vì..."
```

> Metadata này được tạo tự động từ `autoDetectGovernance()` — AI phân tích loại template + nội dung để suy ra Phase/Role/Risk phù hợp. **Không cần chọn thủ công.**

### "Send to Agent" — Gửi trực tiếp vào Agent Chat

Thay vì copy-paste, bạn có thể nhấn nút **"🤖 Send to Agent"** để tự động:
- Mở Agent Chat
- Đính kèm spec đã xuất làm prompt đầu tiên
- Governance rules được inject vào system prompt

---

## PHẦN 4 — AGENT CHAT CÓ GOVERNANCE

### Mục đích

Chat trực tiếp với AI (Gemini/OpenAI/Anthropic) ngay trên web, với governance rules tự động được áp dụng.

### Cách hoạt động

```
┌────────────────────────────────────────────────┐
│  GovernanceBar  [AUTO] Phase:BUILD Role:BUILDER │
├────────────────────────────────────────────────┤
│                                                │
│  User: "Viết API authentication cho app"       │
│                                                │
│  ┌──────────────────────────────────────┐      │
│  │ System Prompt (injected tự động):    │      │
│  │ ─ Bạn là AI Agent hoạt động theo CVF │      │
│  │ ─ Phase: BUILD, Role: BUILDER        │      │
│  │ ─ Risk max: R3                       │      │
│  │ ─ Allowed: write code, modify code   │      │
│  │ ─ Forbidden: approve, deploy prod    │      │
│  └──────────────────────────────────────┘      │
│                                                │
│  AI: "📋 Phase: BUILD | 👤 Role: BUILDER |     │
│       ⚠️ Risk: R2                              │
│       Tôi sẽ implement JWT authentication..." │
│                                                │
└────────────────────────────────────────────────┘
```

### Các tính năng governance trong Agent Chat

| Tính năng | Mô tả |
|-----------|--------|
| **System prompt injection** | Authority matrix + refusal template tự động inject |
| **Phase/Role/Risk header** | AI phải khai báo Phase/Role/Risk ở đầu mỗi response |
| **Auto-detect** | GovernanceBar tự suy Phase/Role/Risk từ nội dung tin nhắn |
| **Risk validation** | Cảnh báo nếu risk vượt ngưỡng cho phép trong phase hiện tại |
| **Refusal template** | AI tự từ chối bình tĩnh, có trích dẫn CVF rule khi vi phạm |
| **Bilingual** | System prompt và refusal template có cả Vietnamese + English |

### Multi-Agent Workflow

Agent Chat hỗ trợ 4 agent roles:
- 🧠 **Orchestrator** — Phân tích và phối hợp
- 📐 **Architect** — Thiết kế giải pháp
- 🔨 **Builder** — Thực thi code
- ✅ **Reviewer** — Kiểm tra chất lượng

---

## PHẦN 5 — GOVERNANCE BAR

### Hai chế độ: Auto vs Manual

| Chế độ | Viền | Mô tả |
|--------|------|--------|
| 🟣 **Auto** (mặc định) | Tím | AI tự suy Phase/Role/Risk từ nội dung chat |
| 🔵 **Manual** | Xanh | User chọn Phase/Role/Risk bằng dropdown |

### Auto Mode

- **Khi bạn gõ** "viết code cho feature X" → Auto detect:
  - Phase: **BUILD** (từ keyword "viết code")
  - Role: **BUILDER** (từ template category)
  - Risk: **R2** (mức mặc định cho BUILD)

- **Khi bạn gõ** "review lại code" → Auto detect:
  - Phase: **REVIEW**
  - Role: **REVIEWER**
  - Risk: **R1**

### Manual Mode

Nhấn nút toggle để chuyển sang Manual → 3 dropdown xuất hiện:
- **Phase:** INTAKE / DESIGN / BUILD / REVIEW / FREEZE
- **Role:** OBSERVER / ANALYST / BUILDER / REVIEWER / GOVERNOR
- **Risk:** R0 / R1 / R2 / R3

> 💡 Khi bạn thay đổi bất kỳ dropdown nào, auto sẽ tự tắt và chuyển sang Manual.

---

## PHẦN 6 — GOVERNANCE PANEL (Self-UAT)

### Mục đích

Panel bên phải — hiển thị trạng thái governance hiện tại và cho phép chạy Self-UAT.

### Self-UAT trên web (1-click)

1. Mở **Governance Panel** (biểu tượng 🔐 trên sidebar)
2. Nhấn nút **"Run Self-UAT"**
3. AI sẽ tự kiểm tra 6 tiêu chí:

| # | Category | Pass criteria |
|---|----------|---------------|
| 1 | Governance Awareness | AI khai báo Phase/Role/Risk? |
| 2 | Phase Discipline | AI từ chối khi yêu cầu ngoài phase? |
| 3 | Role Authority | AI từ chối khi role không đủ quyền? |
| 4 | Risk Boundary | AI block khi risk vượt ngưỡng? |
| 5 | Skill Governance | AI từ chối skill chưa đăng ký? |
| 6 | Refusal Quality | AI từ chối bình tĩnh, trích dẫn CVF? |

4. Kết quả: **PASS** (✅ Production Ready) hoặc **FAIL** (❌ Blocked)

### Governance Status Indicators

```
┌─ Governance Panel ────────────────────┐
│                                       │
│  📊 Current State                     │
│  ├─ Phase: BUILD                      │
│  ├─ Role: BUILDER                     │
│  ├─ Risk: R2                          │
│  ├─ Mode: Auto 🟣                    │
│  └─ Toolkit: ON ✅                    │
│                                       │
│  🧪 Self-UAT                          │
│  ├─ Last run: 2026-02-13 10:30       │
│  ├─ Result: PASS ✅                   │
│  └─ [Run Self-UAT]                   │
│                                       │
│  📋 Authority Matrix                  │
│  ├─ Allowed: write code, create files │
│  ├─ Forbidden: approve, deploy        │
│  └─ Max Risk: R3                      │
│                                       │
└───────────────────────────────────────┘
```

---

## PHẦN 7 — SKILLS ↔ TEMPLATES

### Liên kết hai chiều

| Từ đâu | Đi đâu | Nút bấm |
|--------|--------|---------|
| Template form → | Skills page | 📚 **View Skill** (badge xanh lá) |
| Skills detail → | Template form | 📝 **Use Template** (badge tím) |

### Cách sử dụng

**Từ Templates (khi điền form):**
- Nhìn cạnh mô tả template → badge **📚 View Skill**
- Click → mở trang Skills với skill tương ứng
- Xem governance metadata, checklist, UAT status

**Từ Skills Library (khi xem skill):**
- Chọn 1 skill → nhìn phần header → badge **📝 Use Template**
- Click → mở template form tương ứng
- Nếu không có template trực tiếp → link **📝 Browse category templates**

### Mapping

- **50 templates** được mapping tới **12 skill domains × 62 active skills**
- Mapping nằm trong file `src/lib/skill-template-map.ts`
- Ví dụ: template `code_review` ↔ skill `technical_review/01_code_review`

---

## PHẦN 8 — WORKFLOW HOÀN CHỈNH (End-to-End)

### Scenario: Xây dựng API authentication cho app mới

**Bước 1 — Chọn template**
```
Trang chủ → Category: Development → Template: "API Design Spec"
```

**Bước 2 — Điền form**
```
API Name: User Authentication API
Endpoints: Login, Register, Logout, Refresh Token
Auth Method: JWT + Refresh Token
Database: PostgreSQL
```

**Bước 3 — Xuất spec (CVF Full Mode)**
- Chọn mode: 🚦 **CVF Full Mode**
- Chọn ngôn ngữ: English
- Governance tự động inject: Phase=BUILD, Role=BUILDER, Risk=R2

**Bước 4 — Gửi vào Agent Chat**
- Nhấn **"🤖 Send to Agent"**
- Agent Chat mở với spec đã xuất

**Bước 5 — AI hoạt động theo CVF**
```
📋 Phase: BUILD | 👤 Role: BUILDER | ⚠️ Risk: R2

I'll implement the JWT authentication API following the CVF 4-Phase protocol.

## Phase A: Discovery
- Understanding: REST API for user auth with JWT...
- Scope: 4 endpoints, PostgreSQL, stateless tokens
- Constraints: Must use bcrypt for passwords
```

**Bước 6 — Review kết quả**
- Kiểm tra GovernanceBar → Phase/Role/Risk hiển thị đúng
- Mở GovernancePanel → xem Authority Matrix
- Chạy Self-UAT nếu cần verify governance compliance

**Bước 7 (tuỳ chọn) — Xem Skill liên quan**
- Nhìn template header → badge **📚 View Skill**
- Click → mở `app_development/05_api_design_spec` skill
- Xem checklist, common failures, UAT criteria

---

## TÓM TẮT NHANH

| Bạn muốn | Dùng gì | Bước |
|-----------|---------|------|
| Xuất prompt cho AI bên ngoài | **SpecExport** | Chọn template → Điền form → Copy |
| Chat với AI có governance | **Agent Chat** | GovernanceBar ON → Chat trực tiếp |
| Kiểm tra AI compliance | **Governance Panel** | Mở panel → Run Self-UAT |
| Tìm skill governance | **Skills Library** | /skills → Browse 12 domains |
| Chạy trên máy tính | **Local install** | `npm install` → `npm run dev` |

---

## SO SÁNH: LOCAL vs WEB vs CLI

| Tiêu chí | 📂 Local (Markdown) | 🌐 Web (v1.6) | ⌨️ CLI (v1.3) |
|----------|:---:|:---:|:---:|
| Setup | Copy `.cvf/` folder | `npm install` + `npm run dev` | `pip install cvf` |
| Governance | Prompt-based | **Auto-inject** | Config file |
| Agent nào? | Bất kỳ (paste prompt) | Gemini/OpenAI/Claude | Claude/GPT adapter |
| Self-UAT | Paste prompt riêng | **1-click button** | CLI command |
| UI | ❌ | ✅ Beautiful web UI | ❌ Terminal |
| Templates | ❌ | ✅ 50 form templates | ❌ |
| Skills | Đọc .skill.md files | ✅ 62 active skills browser | ❌ |
| Authority Matrix | Đọc từ docs | ✅ Auto-inject + visualize | Config YAML |
| Effort | ⬆️ Cao (đọc docs + copy) | ⬇️ **Thấp nhất** | ⬆️ Trung bình |

---

**CVF Web Toolkit = Governance on auto-pilot.** 🚀
