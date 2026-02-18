# Danh mục Kỹ năng Agent — 34 Kỹ năng theo Lĩnh vực

**Tổng:** 34 kỹ năng | **Rủi ro:** R0(5) R1(11) R2(14) R3(4)

Toàn bộ kỹ năng agent được tổ chức thành **7 lĩnh vực** theo chức năng, với bản đồ quan hệ giữa các kỹ năng.

---

## Chú thích Mức Rủi ro

| Mức | Ý nghĩa | Phê duyệt |
|-----|---------|-----------|
| **R0** | An toàn — không tác dụng phụ | Tự động |
| **R1** | Thấp — chỉ đọc hoặc tư vấn | Tự động |
| **R2** | Trung bình — ghi, gọi bên ngoài, chi phí | Giám sát |
| **R3** | Cao — thực thi tự chủ, truy cập hệ thống | Thủ công |

---

## Lĩnh vực 1: Nền tảng & Tiện ích

> Công cụ cốt lõi mà các kỹ năng khác phụ thuộc. Có từ v1.0.

| # | Kỹ năng | Rủi ro | Chức năng |
|---|---------|--------|-----------|
| AGT-001 | **Web Search** | R2 | Tìm kiếm thông tin trên web |
| AGT-002 | **Code Execute** | R3 | Chạy code trong môi trường sandbox |
| AGT-003 | **Calculator** | R0 | Tính toán, chuyển đổi đơn vị |
| AGT-004 | **DateTime** | R0 | Phân tích ngày/giờ, chuyển đổi múi giờ |
| AGT-005 | **JSON Parse** | R0 | Phân tích và chuyển đổi cấu trúc JSON |
| AGT-006 | **URL Fetch** | R2 | Lấy nội dung từ URL |
| AGT-007 | **File Read** | R1 | Đọc file từ dự án |
| AGT-008 | **File Write** | R2 | Ghi/sửa file trong dự án |

**Quan hệ:**
- AGT-007 + AGT-008 được hầu hết kỹ năng khác sử dụng (I/O file)
- AGT-001 + AGT-006 cung cấp dữ liệu cho AGT-009 (RAG), AGT-016 (Nghiên cứu)
- AGT-002 là engine thực thi cho AGT-012 (Agentic Loop), AGT-026 (Testing)

---

## Lĩnh vực 2: Mẫu Agentic

> Các mẫu AI từ Claude Quickstarts của Anthropic. Xây dựng pipeline dữ liệu thông minh, vòng lặp tự chủ, và tích hợp công cụ.

| # | Kỹ năng | Rủi ro | Chức năng |
|---|---------|--------|-----------|
| AGT-009 | **RAG Knowledge Retrieval** | R2 | Tìm kiếm vector + truy xuất knowledge base |
| AGT-010 | **Data Visualization** | R1 | Tạo biểu đồ và dashboard trực quan |
| AGT-011 | **Document Parser** | R1 | Trích xuất dữ liệu có cấu trúc từ tài liệu |
| AGT-012 | **Agentic Loop Controller** | R3 | Thực thi tác vụ tự chủ nhiều bước |
| AGT-013 | **Browser Automation** | R3 | Tương tác web qua Playwright |
| AGT-014 | **MCP Server Connector** | R2 | Kết nối đến MCP tool servers bên ngoài |

**Quan hệ:**
- AGT-009 (RAG) ← dùng AGT-001 (Search) + AGT-006 (Fetch) để lấy dữ liệu
- AGT-012 (Loop) ← dùng AGT-002 (Execute) cho các bước code
- AGT-013 (Browser) ← thường được AGT-012 (Loop) điều phối
- AGT-014 (MCP) → được AGT-024 (Isolation) và AGT-032 (Builder) mở rộng

> **Hướng dẫn chi tiết:** [Sử dụng Kỹ năng Agentic](using-agentic-skills)

---

## Lĩnh vực 3: Workflow & Nghiên cứu

> Automation hooks, quy trình nghiên cứu khoa học, chuyển đổi tài liệu, phối hợp đa agent, và phân tích.

| # | Kỹ năng | Rủi ro | Chức năng |
|---|---------|--------|-----------|
| AGT-015 | **Workflow Automation Hook** | R2 | Trigger tự động trước/sau khi chạy tool |
| AGT-016 | **Scientific Research Assistant** | R1 | Phương pháp nghiên cứu có cấu trúc |
| AGT-017 | **Document Format Converter** | R1 | Chuyển đổi giữa PDF, DOCX, XLSX… |
| AGT-018 | **Agent Team Orchestrator** | R3 | Phối hợp nhiều agent chuyên biệt |
| AGT-019 | **Skill Progressive Loader** | R0 | Tải kỹ năng theo ngữ cảnh |
| AGT-020 | **Analytics Dashboard Generator** | R1 | Dashboard giám sát phiên thời gian thực |

**Quan hệ:**
- AGT-018 (Teams) ← phối hợp các phiên bản AGT-012 (Loop) làm sub-agent
- AGT-019 (Loader) → quản lý tải TẤT CẢ kỹ năng khác một cách động
- AGT-020 (Analytics) ← dùng AGT-010 (Visualization) để render biểu đồ
- AGT-015 (Hook) → kích hoạt trước/sau khi chạy bất kỳ skill nào
- AGT-016 (Research) ← cung cấp cho AGT-009 (RAG) và AGT-011 (Parser)

> **Hướng dẫn chi tiết:** [Kỹ năng Workflow & Nghiên cứu](using-new-skills-v2)

---

## Lĩnh vực 4: Trí tuệ & Giải quyết Vấn đề

> Khả năng suy luận meta — tối ưu ngữ cảnh, chọn chiến lược, debug hệ thống, và cô lập môi trường tool.

| # | Kỹ năng | Rủi ro | Chức năng |
|---|---------|--------|-----------|
| AGT-021 | **Context Engineering Optimizer** | R1 | Tối ưu token, phát hiện suy giảm |
| AGT-022 | **Problem-Solving Framework Router** | R0 | Khớp loại-stuck với kỹ thuật giải quyết |
| AGT-023 | **Systematic Debugging Engine** | R2 | Debug 4 giai đoạn với verification |
| AGT-024 | **MCP Context Isolation Manager** | R2 | Sandbox MCP tools qua subagent riêng |

**Quan hệ:**
- AGT-022 (Router) → chuyển đến AGT-023 (Debug) khi stuck-type = "bug"
- AGT-023 (Debug) ← dùng AGT-002 (Execute) để xác minh bản sửa
- AGT-024 (Isolation) ← bọc AGT-014 (MCP Connector) trong sandbox
- AGT-021 (Context) → cải thiện hiệu suất tất cả skill R2/R3 qua quản lý token
- AGT-023 (Debug) → được AGT-031 (Code Review) xác thực bằng chứng

> **Hướng dẫn chi tiết:** [Kỹ năng Trí tuệ](intelligence-skills-v3)

---

## Lĩnh vực 5: Phát triển Full-Stack

> Thiết kế API, xây frontend, quản lý database, bảo mật, và chạy test toàn diện.

| # | Kỹ năng | Rủi ro | Chức năng |
|---|---------|--------|-----------|
| AGT-025 | **API Architecture Designer** | R1 | Phương pháp thiết kế REST/GraphQL/gRPC |
| AGT-026 | **Full-Stack Testing Engine** | R2 | Kim tự tháp testing 70-20-10, CI gates |
| AGT-027 | **Security & Auth Guard** | R2 | OWASP Top 10, OAuth 2.1, chiến lược auth |
| AGT-028 | **Database Schema Architect** | R1 | Pattern schema, chọn DB, migration |
| AGT-029 | **Frontend Component Forge** | R1 | Kiến trúc component, Suspense patterns |

**Quan hệ:**
- **Bộ ba thiết kế:** AGT-025 (API) → AGT-028 (Database) → AGT-029 (Frontend) — thiết kế từ trên xuống
- AGT-026 (Testing) ← xác thực TẤT CẢ kỹ năng khác trong lĩnh vực
- AGT-027 (Security) ← bảo vệ AGT-025 (API) và AGT-028 (Database)
- AGT-025 (API) → cung cấp cho AGT-030 (Deployment) để lên kế hoạch infra
- AGT-026 (Testing) → được AGT-031 (Code Review) xác thực

> **Hướng dẫn chi tiết:** [Kỹ năng Phát triển Ứng dụng](app-dev-skills-v4)

---

## Lĩnh vực 6: DevOps & Tích hợp AI

> Triển khai lên cloud, thực thi tiêu chuẩn code review, xây dựng MCP servers, và xử lý đa phương tiện bằng AI.

| # | Kỹ năng | Rủi ro | Chức năng |
|---|---------|--------|-----------|
| AGT-030 | **Cloud Deployment Strategist** | R2 | Chọn nền tảng, Docker, K8s, GitOps |
| AGT-031 | **Code Review & Verification Gate** | R1 | Phương pháp review bằng-chứng-trước-tuyên-bố |
| AGT-032 | **MCP Server Builder** | R2 | Xây MCP server production (Python/TS) |
| AGT-033 | **AI Multimodal Processor** | R2 | Xử lý âm thanh/hình ảnh/video/tài liệu bằng AI |

**Quan hệ:**
- AGT-030 (Deploy) ← nhận output từ AGT-025→029 (lĩnh vực Development)
- AGT-031 (Review) ← xác thực tuyên bố của AGT-023 (Debug) và AGT-026 (Testing)
- AGT-032 (MCP Builder) ← mở rộng AGT-014 (Connector) và AGT-024 (Isolation)
- AGT-033 (Multimodal) ← dùng AGT-025 (API) cho thiết kế endpoint và AGT-028 (DB) cho lưu trữ

> **Hướng dẫn chi tiết:** [Kỹ năng DevOps & AI](devops-ai-skills-v5)

---

## Lĩnh vực 7: Kinh doanh & Vận hành

> Workflow có governance cho Operator không kỹ thuật — Sales, Marketing, Product, Ops, Finance, Strategy. Lấy cảm hứng từ "The Operator's Guide to Opus 4.6".

| # | Kỹ năng | Rủi ro | Chức năng |
|---|---------|--------|----------|
| AGT-034 | **Operator Workflow Orchestrator** | R2 | 10 workflow kinh doanh với verification gates |

### 10 Mẫu Workflow

| # | Workflow | Danh mục | Kết nối | Rủi ro |
|---|---------|---------|--------|-------|
| 1 | Quản lý Pipeline | Doanh thu | CRM (HubSpot/Salesforce) | R2 |
| 2 | Tìm kiếm Prospect | Doanh thu | Agentic Search | R2 |
| 3 | Giám sát Chi phí QC | Doanh thu | Google/Meta CSV | R2 |
| 4 | Phân phối Nội dung | Doanh thu | Văn bản | R1 |
| 5 | Tiếng nói Khách hàng | Sản phẩm & VH | Intercom/Zendesk | R2 |
| 6 | Báo cáo Sản phẩm Hàng tuần | Sản phẩm & VH | Jira + Notion | R2 |
| 7 | Phẫu thuật Quy trình | Sản phẩm & VH | Upload file (1M tokens) | R2 |
| 8 | Tối ưu Lịch họ | Sản phẩm & VH | Google Calendar | R2 |
| 9 | Phân tích Tài chính | Tài chính | SEC filings / uploads | R2 |
| 10 | Tình báo Cạnh tranh | Chiến lược | Agentic Search (swarm) | R3 |

**CVF Governance cho mọi workflow:**
- Verification gates (kiểm chéo output AI với hệ thống nguồn)
- Chấm điểm độ tin cậy (Xác minh / Suy luận / Suy đoán)
- Con người trong vòng lặp cho mọi hành động ghi (không tự gửi email, không tự đặt lịch)
- Quy tắc leo thang cho nội dung nhạy cảm (pháp lý, tài chính, enterprise)
- Nhật ký kiểm toán cho tuân thủ

**Quan hệ:**
- AGT-034 ← dùng AGT-018 (Agent Teams) cho swarm workflows (#10)
- AGT-034 ← dùng AGT-021 (Context Engineering) cho phân tích tài liệu lớn (#7)
- AGT-034 ← dùng phương pháp verification của AGT-031 (Code Review) cho mọi output
- AGT-034 ← dùng AGT-015 (Workflow Hook) cho automation trước/sau workflow

> **Hướng dẫn chi tiết:** [Workflow cho Operator](operator-workflows)

---

## Bản đồ Quan hệ Tổng thể

```
                    ┌─────────────────────────────────────────┐
                    │  Lĩnh vực 1: Nền tảng & Tiện ích       │
                    │  AGT-001→008 (search, execute, files…)  │
                    └──────────┬──────────┬───────────────────┘
                               │          │
              ┌────────────────┘          └────────────────┐
              ▼                                            ▼
 ┌────────────────────────┐              ┌────────────────────────────┐
 │ LV 2: Mẫu Agentic     │              │ LV 3: Workflow             │
 │ AGT-009→014            │◄────────────►│ AGT-015→020               │
 │ RAG, Viz, Parser,      │  điều phối   │ Hooks, Research, Teams,   │
 │ Loop, Browser, MCP     │              │ Loader, Analytics         │
 └──────────┬─────────────┘              └────────────┬──────────────┘
            │                                         │
            ▼                                         ▼
 ┌────────────────────────┐              ┌────────────────────────────┐
 │ LV 4: Trí tuệ         │              │ LV 5: Development         │
 │ AGT-021→024            │◄────────────►│ AGT-025→029               │
 │ Context, Router,       │  debug+test  │ API, Testing, Security,   │
 │ Debug, Isolation       │              │ Database, Frontend        │
 └──────────┬─────────────┘              └────────────┬──────────────┘
            │                                         │
            └────────────────┐   ┌────────────────────┘
                             ▼   ▼
              ┌────────────────────────────┐
              │ LV 6: DevOps & AI         │
              │ AGT-030→033               │
              │ Deploy, Review, MCP Build, │
              │ Multimodal                │
              └──────────────┬─────────────┘
                             │
                             ▼
              ┌────────────────────────────┐
              │ LV 7: Kinh doanh & VH     │
              │ AGT-034                   │
              │ 10 Operator Workflows     │
              │ Sales/Mktg/Ops/Finance    │
              └────────────────────────────┘
```

---

## Theo Mức Rủi ro

### R0 — Tự động (5 kỹ năng)
Calculator, DateTime, JSON Parse, Skill Progressive Loader, Problem-Solving Router

### R1 — Tự động (11 kỹ năng)
File Read, Data Viz, Doc Parser, Scientific Research, Doc Converter, Analytics Dashboard, Context Optimizer, API Architecture, Database Schema, Frontend Forge, Code Review Gate

### R2 — Giám sát (14 kỹ năng)
Web Search, URL Fetch, File Write, RAG Retrieval, MCP Connector, Workflow Hook, Systematic Debug, MCP Isolation, Full-Stack Testing, Security Guard, Cloud Deploy, MCP Builder, AI Multimodal, Operator Workflow

### R3 — Thủ công (4 kỹ năng)
Code Execute, Agentic Loop, Browser Automation, Agent Team Orchestrator
