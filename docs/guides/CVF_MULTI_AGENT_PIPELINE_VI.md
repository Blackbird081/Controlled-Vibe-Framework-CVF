# CVF Pipeline Đa Tác Nhân — Sơ Đồ Trực Quan

🇻🇳 Tiếng Việt | [🇬🇧 English](../../README.md#cvf-multi-agent-pipeline)

**Phiên bản hợp đồng:** `cvf.multiAgentPipeline.visual.v1` | **Cập nhật:** 2026-05

CVF vận hành một pipeline quản trị năm giai đoạn đứng giữa người vận hành và bất kỳ nhà cung cấp AI nào. Mọi yêu cầu đều phải đi qua cổng tiếp nhận, phân rã nhiệm vụ, thực thi, kiểm duyệt và đóng cửa — với một Biên lai Chứng cứ (Evidence Receipt) ở cuối để chứng minh những gì đã chạy, ai phê duyệt và chính sách nào đã được áp dụng.

---

## Cấu Trúc Pipeline

```
Operator → CVF Intake Gates → Orchestrator → Workers → Reviewer → CVF Closure Gates → FREEZE
```

CVF cung cấp ba tùy chọn định tuyến tùy theo yêu cầu về chi phí, tốc độ và bảo mật:

| Tùy chọn | Hồ sơ | Phù hợp cho |
|---|---|---|
| 🟢 **[E] Eco — Siêu tiết kiệm** | Chi phí tối thiểu | Tác vụ khối lượng lớn, rủi ro thấp |
| 🔵 **[B] Balanced — Cân bằng** | Tốc độ cao & chất lượng | Mặc định cho hầu hết workflow CVF |
| 🔴 **[O] Premium — Tối đa** | Sức mạnh + bảo mật tuyệt đối | Dự án quan trọng hoặc nhạy cảm |

---

## Cấu Hình Vai Trò Agent

| Vai trò | Nhiệm vụ chính | 🟢 Eco | 🔵 Balanced | 🔴 Premium |
|---|---|---|---|---|
| 🛑 **CVF Intake Gates** | Quét Guard Contracts, chặn rủi ro trước khi vào pipeline | Claude Sonnet 4.6 | Claude Sonnet 4.6 (High Effort) | Claude Opus 4.8 |
| 🗺️ **Orchestrator** | Phân rã yêu cầu → Work Orders có cấu trúc JSON/YAML | DeepSeek V3 | Gemini 2.5 Flash | GPT-4.1 / o3 |
| 🛠️ **Workers — Làm thô** | Viết code thô, xử lý codebase lớn | DeepSeek V3 (batch) | Gemini 2.5 Flash (1–2M ctx) | Gemini 2.5 Pro |
| 🛠️ **Workers — Thực thi** | Gõ lệnh Terminal CLI, tự sửa lỗi (self-debug loop) | Qwen3-32B | Qwen3-235B | GPT-4.1 / o3 |
| 🔍 **Reviewer** | Chấm điểm chất lượng, rà soát bảo mật, rollback nếu cần | — | Claude Sonnet 4.6 / Gemini 2.5 Pro | Claude Opus 4.8 |
| 🔏 **CVF Closure Gates** | Xác thực toàn vẹn, ký Evidence Receipts, FREEZE | Claude Sonnet 4.6 | Claude Sonnet 4.6 (High Effort) | Claude Opus 4.8 |

> **Tên model phản ánh khả năng sẵn có tháng 5/2026.** CVF định tuyến theo vai trò và chính sách — không phải model cố định. Khóa provider thuộc về người dùng; quản trị thuộc về CVF.

---

## Sơ Đồ Khối Trực Quan

```mermaid
graph TD
    classDef operator fill:#f9f9f9,stroke:#333,stroke-width:2px
    classDef gate fill:#ffcccc,stroke:#f66,stroke-width:2px
    classDef orch fill:#dae8fc,stroke:#6c8ebf,stroke-width:2px
    classDef worker fill:#d5e8d4,stroke:#82b366,stroke-width:2px
    classDef review fill:#fff2cc,stroke:#d6b656,stroke-width:2px
    classDef freeze fill:#e1d5e7,stroke:#9673a6,stroke-width:2px
    classDef optEco fill:#e6ffed,stroke:#2cbe4e,stroke-width:1px
    classDef optBal fill:#dbf1ff,stroke:#0366d6,stroke-width:1px
    classDef optPrem fill:#ffeef0,stroke:#cb2431,stroke-width:1.5px

    Op["👤 Operator (Không cần code)"]:::operator
    IG["🛑 CVF Intake Gates"]:::gate
    Orch["🗺️ Orchestrator"]:::orch
    Wk["🛠️ Workers"]:::worker
    Rev["🔍 Reviewer"]:::review
    CG["🔏 CVF Closure Gates"]:::gate
    Fr["✅ FREEZE / Bàn giao"]:::freeze

    AgIG_EB["🟢/🔵 Claude Sonnet 4.6 — Quét Guard Contracts nhanh"]:::optEco
    AgIG_O["🔴 Claude Opus 4.8 — Phân tích rủi ro chính sách sâu"]:::optPrem
    AgOrch_E["🟢 DeepSeek V3 — Rã Work Orders JSON giá rẻ (~15s trễ)"]:::optEco
    AgOrch_B["🔵 Gemini 2.5 Flash — Tốc độ cực cao (4x TPS)"]:::optBal
    AgOrch_O["🔴 GPT-4.1 / o3 — Định tuyến ý định phức tạp"]:::optPrem
    AgWkD["Làm thô — Viết code:<br/>🟢 DeepSeek V3 batch / 🔵 Gemini 2.5 Flash (1–2M ctx)<br/>🔴 Gemini 2.5 Pro"]:::worker
    AgWkR["Thực thi — Gõ Terminal, tự debug:<br/>Qwen3-32B / Qwen3-235B / GPT-4.1"]:::worker
    AgRev_B["🔵 Sonnet 4.6 / Gemini 2.5 Pro — Quét lỗi, lập báo cáo"]:::optBal
    AgRev_O["🔴 Claude Opus 4.8 — Phán quyết phê duyệt tối thượng"]:::optPrem
    AgCG_EB["🟢/🔵 Claude Sonnet 4.6 — Kiểm tra tính toàn vẹn cấu trúc"]:::optEco
    AgCG_O["🔴 Claude Opus 4.8 — Ký Evidence Receipts, đọc toàn bộ lịch sử"]:::optPrem

    Op --> IG --> Orch --> Wk --> Rev --> CG --> Fr
    Wk --> AgWkD --> AgWkR
    IG -.-> AgIG_EB & AgIG_O
    Orch -.-> AgOrch_E & AgOrch_B & AgOrch_O
    Rev -.-> AgRev_B & AgRev_O
    CG -.-> AgCG_EB & AgCG_O
```

---

## Sơ Đồ Luồng Hoạt Động (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Op as 👤 Operator (Không cần code)
    participant IG as 🛑 Intake Gates<br/>(Sonnet 4.6 / Opus 4.8)
    participant Orch as 🗺️ Orchestrator<br/>(DeepSeek V3 / Gemini 2.5 Flash / GPT-4.1)
    participant Wk as 🛠️ Workers<br/>(Gemini 2.5 / Qwen3 / GPT-4.1)
    participant Rev as 🔍 Reviewer<br/>(Sonnet 4.6 / Gemini 2.5 Pro / Opus 4.8)
    participant CG as 🔏 Closure Gates<br/>(Sonnet 4.6 / Opus 4.8)

    Op->>IG: Gửi yêu cầu thô (ngôn ngữ tự nhiên)
    Note over IG: Quét Guard Contracts — ALLOW / BLOCK
    alt Yêu cầu vi phạm chính sách
        IG-->>Op: [Chặn] Evidence Receipt + lý do từ chối
    else Yêu cầu hợp lệ
        IG->>Orch: Chuyển payload đã xác thực
    end

    Note over Orch: Phân rã mục tiêu → Work Orders (JSON/YAML)
    Orch->>Wk: Phát hành Work Orders có cấu trúc

    rect rgb(240, 248, 255)
        Note over Wk,Rev: VÒNG LẶP THỰC THI & KIỂM DUYỆT (tối đa 3 lần)
        loop Vòng lặp tự sửa lỗi (max retry = 3)
            alt Worker bị treo / vòng lặp vô hạn
                Wk-->>Wk: Kill sandbox → xóa cache → khởi động lại (max 2 lần)
            else Worker hoạt động bình thường
                Wk->>Wk: Làm thô (Gemini/DeepSeek) → Thực thi & debug (Qwen3/GPT-4.1)
            end
            Wk->>Rev: Đẩy code + log CLI
            Note over Rev: Chấm điểm chất lượng & bảo mật
            alt Reviewer từ chối (lần 1–2)
                Rev-->>Wk: Rollback + chỉ thị sửa đổi chi tiết
            else Reviewer từ chối > 3 lần
                Rev-->>Orch: Escalation — báo cáo bế tắc
                Orch->>Wk: Work Orders mới (micro-tasks / nâng cấp model)
            else Code đạt chuẩn
                Rev->>CG: Chuyển giao sản phẩm sạch + log nghiệm thu
            end
        end
    end

    Note over CG: Structural Completeness Guard
    CG->>CG: Ký số → xuất Evidence Receipts
    CG->>Op: Bàn giao hoàn thiện + FREEZE
```

---

## Sơ Đồ Kiến Trúc Văn Bản (ASCII)

```
[Operator (Không cần code)]
       │
       ▼
[CVF Intake Gates] ──────► 🟢/🔵 Claude Sonnet 4.6   — Quét Guard Contracts nhanh, tiết kiệm
       │                   🔴    Claude Opus 4.8        — Phân tích ngữ nghĩa sâu, bảo mật cao
       ▼
[Orchestrator] ──────────► 🟢    DeepSeek V3            — Rã Work Orders JSON, chi phí tối thiểu
       │                   🔵    Gemini 2.5 Flash        — Tốc độ cực cao, phù hợp batch lớn
       │                   🔴    GPT-4.1 / o3            — Định tuyến logic phức tạp, tức thì
       ▼
[Workers] ───────────────► 🚀 Làm thô:  Gemini 2.5 Flash / DeepSeek V3  (codebase lớn, 1–2M ctx)
       │                   🛠️ Thực thi: Qwen3-235B / GPT-4.1             (Terminal CLI, tự debug)
       ▼
[Reviewer] ──────────────► 🔵    Sonnet 4.6 / Gemini 2.5 Pro   — Quét lỗi, lập báo cáo thẩm định
       │                   🔴    Claude Opus 4.8                 — Phán quyết tối thượng, chống bug
       ▼
[CVF Closure Gates] ─────► 🟢/🔵 Claude Sonnet 4.6   — Xác thực cấu trúc, xuất Evidence Receipts
       │                   🔴    Claude Opus 4.8        — Đọc toàn bộ lịch sử, ký số chống giả mạo
       ▼
[FREEZE / Bàn giao]
```

---

## Luồng Vận Hành Chi Tiết

**Bước 1 — Tiếp nhận & Quét lọc (Intake Stage)**

Operator nạp prompt → CVF Intake Gates (Claude Sonnet 4.6 hoặc Opus 4.8) đối chiếu bộ luật rào cản hệ thống (Guard Contracts).

Xử lý ngoại lệ: Nếu prompt chứa vi phạm chính sách hoặc vượt ngưỡng rủi ro, hệ thống chặn ngay lập tức, xuất biên lai từ chối và ngắt luồng — không đẩy sang các lớp sau để bảo vệ tài nguyên token.

**Bước 2 — Phân rã chỉ thị (Orchestration Stage)**

Orchestrator (DeepSeek V3 / Gemini 2.5 Flash / GPT-4.1) nhận payload sạch → tự động biên dịch cấu trúc JSON/YAML để phân phối Work Orders riêng biệt cho từng Worker.

**Bước 3 — Thực thi chuyên sâu (Execution Stage)**

Workers kích hoạt phiên làm việc cô lập (Sandboxed Terminal). Gemini 2.5 Flash / DeepSeek V3 viết mã nháp (Drafting), sau đó chuyển cho Qwen3 / GPT-4.1 gõ lệnh và tự sửa lỗi (Self-debugging loop).

Xử lý ngoại lệ — Khi Worker bị treo (Timeout):
- Hệ thống đặt rào cản thời gian 5 phút cho mỗi lệnh CLI
- Nếu vượt quá: kích hoạt `WorkerTimeoutException` → kill sandbox → xóa cache → khởi động lại (tối đa 2 lần)
- Nếu vẫn thất bại: báo lỗi lên Orchestrator

**Bước 4 — Thẩm định chất lượng (Review Stage)**

Reviewer (Sonnet 4.6 / Gemini 2.5 Pro / Opus 4.8) đối chiếu đầu ra với Work Orders gốc. Nếu không đạt, trả lại (Rollback) kèm chỉ thị sửa đổi chi tiết.

Xử lý ngoại lệ — Deadlock (>3 lần từ chối):
- Kích hoạt `ReviewDeadlockException`
- Orchestrator hạ cấp mục tiêu: bẻ gãy Work Order thành micro-tasks, hoặc nâng cấp model Worker
- Nếu vẫn thất bại: dừng hoàn toàn → tín hiệu `Human-Intervention-Required`

**Bước 5 — Nghiệm thu & Đóng băng (Closure Stage)**

CVF Closure Gates (Sonnet 4.6 hoặc Opus 4.8) thực hiện rà soát cuối về tính toàn vẹn cấu trúc → ký số → xuất Evidence Receipts → FREEZE.

---

## Xử Lý Ngoại Lệ

| Tình huống | Cơ chế | Kết quả |
|---|---|---|
| Yêu cầu vi phạm chính sách | `IntakePolicyViolation` → xuất Evidence Receipt, ngắt luồng | Operator nhận lý do từ chối |
| Worker bị treo (>5 phút) | `WorkerTimeoutException` → kill sandbox, khởi động lại (max 2×) | Retry hoặc báo lên Orchestrator |
| Reviewer từ chối >3 lần | `ReviewDeadlockException` → Orchestrator hạ cấp thành micro-tasks | Đơn giản hóa hoặc nâng cấp model |
| Micro-task vẫn thất bại | Dừng pipeline → tín hiệu `Human-Intervention-Required` | Operator can thiệp thủ công |

---

## Kiến Trúc MCP + CLI Kết Hợp

CVF sử dụng cả MCP (mặt phẳng kiểm soát quản trị) và CLI (mặt phẳng thực thi) — mỗi lớp có làn đường riêng:

| Lớp | Bề mặt | Trách nhiệm |
|---|---|---|
| 🛡️ MCP — Quản trị | Intake Gates, Reviewer, Closure Gates | Guard Contracts, thực thi chính sách, Evidence Receipts |
| 🛠️ CLI — Thực thi | Orchestrator, Workers | Phát hành Work Orders, terminal sandbox, vòng lặp tự debug |

MCP giữ "sách luật" và "con dấu duyệt bài". CLI cày cuốc trong sandbox cô lập. Hai lớp bổ trợ nhau — không phải thay thế nhau.

---

## Phạm Vi Tuyên Bố

> **Phiên bản hợp đồng:** `cvf.multiAgentPipeline.visual.v1` (2026-05)
>
> Tài liệu này mô tả kiến trúc pipeline và logic định tuyến vai trò–model của CVF. CVF **không** tuyên bố:
> - Tương đương hoàn toàn giữa các model hoặc làn provider
> - Lập lịch đa tác nhân tự động mà không cần giám sát của operator
> - Tính ổn định production của bất kỳ model bên thứ ba nào (DeepSeek, Gemini, GPT, Qwen)
> - Độ trễ, chi phí hoặc chất lượng giống hệt nhau giữa các tùy chọn E / B / O
>
> Tên model phản ánh phiên bản tháng 5/2026. Các hợp đồng quản trị CVF (`Guard Contracts`, `Evidence Receipts`, `GC-018`, `GC-021`) thuộc sở hữu CVF và ổn định bất kể làn provider nào đang hoạt động.
