# Các Mẫu Agentic từ Claude Quickstarts

> Bài học rút ra từ [claude-quickstarts](https://github.com/anthropics/claude-quickstarts) — ánh xạ vào governance CVF.

## Claude Quickstarts Là Gì?

[claude-quickstarts](https://github.com/anthropics/claude-quickstarts) của Anthropic là bộ sưu tập 14.2k sao gồm các ví dụ thực tế về cách xây dựng ứng dụng với Claude API. Nó chứa **5 demo mẫu thiết kế production**:

| Dự Án | Mẫu Thiết Kế | Công Nghệ |
|-------|--------------|-----------|
| **Customer Support Agent** | RAG + Knowledge Base + Phát hiện tâm trạng | Next.js, Bedrock KB, Claude API |
| **Financial Data Analyst** | Trực quan hóa dữ liệu + Upload đa định dạng | Next.js, Recharts, PDF.js |
| **Agents** | Vòng lặp Agentic tối giản + MCP Tools | Python, Claude API, MCP |
| **Autonomous Coding** | Mẫu Hai-Agent + Lưu trữ phiên | Claude Agent SDK, Git |
| **Browser Use Demo** | Tự động hóa trình duyệt + Công cụ DOM | Python, Playwright, Streamlit |

## Các Mẫu Thiết Kế Chính & Ánh Xạ CVF

### 1. RAG (Retrieval-Augmented Generation)

**Chức năng:** Customer-support-agent truy xuất tài liệu liên quan từ Amazon Bedrock Knowledge Bases trước khi trả lời, neo câu trả lời vào dữ liệu thực.

**Mẫu:**
```
Truy vấn → Embedding → Tìm kiếm vector → Top-K Tài liệu → Chèn ngữ cảnh → Phản hồi Claude
```

**Ánh xạ CVF:**
- **Skill mới:** AGT-009 RAG Knowledge Retrieval (R2, Có giám sát)
- **Rủi ro:** R2 vì ngữ cảnh truy xuất ảnh hưởng chất lượng đầu ra AI
- **Governance:** Phải trích nguồn, ghi log ID tài liệu, từ chối tham chiếu bịa đặt
- **Cổng phase:** Cho phép ở cả 4 phase — truy xuất ngữ cảnh là nền tảng

**CVF bổ sung:** Nhật ký kiểm toán trích nguồn, ngưỡng điểm liên quan, lọc PII trên nội dung truy xuất.

---

### 2. Trực Quan Hóa Dữ Liệu Tương Tác

**Chức năng:** Financial-data-analyst tạo cấu hình biểu đồ (line, bar, pie, area, stacked area) từ dữ liệu tài chính, render bằng Recharts.

**Mẫu:**
```
Upload dữ liệu → Phân tích Claude → JSON cấu hình biểu đồ → Render Recharts → Dashboard tương tác
```

**Ánh xạ CVF:**
- **Skill mới:** AGT-010 Data Visualization Generator (R1, Tự động)
- **Rủi ro:** R1 vì đầu ra là trực quan hóa chỉ-đọc, không sửa đổi dữ liệu
- **Governance:** Cấu hình biểu đồ xác thực theo schema, không có mã thực thi trong đầu ra
- **Cổng phase:** Phase Build + Review

**CVF bổ sung:** Phân loại độ nhạy dữ liệu (công khai/nội bộ/bảo mật), ghi log xuất dữ liệu.

---

### 3. Phân Tích Tài Liệu Đa Định Dạng

**Chức năng:** Financial-data-analyst xử lý upload text, PDF, CSV, và hình ảnh, trích xuất dữ liệu có cấu trúc.

**Mẫu:**
```
Upload file → Phát hiện loại → Parser (PDF.js / CSV / Vision) → Dữ liệu có cấu trúc → Sẵn sàng phân tích
```

**Ánh xạ CVF:**
- **Skill mới:** AGT-011 Document Parser (R1, Tự động)
- **Rủi ro:** R1 vì phân tích chỉ-đọc với đầu ra có cấu trúc
- **Governance:** Hook phát hiện PII, giới hạn kích thước file, danh sách định dạng cho phép
- **Cổng phase:** Tất cả phase — phân tích tài liệu phục vụ từ khám phá đến đánh giá

**CVF bổ sung:** Sanitize PII tự động, xác thực loại file, áp dụng schema trích xuất.

---

### 4. Vòng Lặp Agentic Tự Chủ

**Chức năng:** Autonomous-coding agent dùng **mẫu hai-agent**: Agent Khởi tạo tạo danh sách tính năng (200 test case), sau đó Agent Lập trình triển khai từng tính năng qua nhiều phiên, lưu tiến độ qua `feature_list.json` và git.

**Mẫu:**
```
App Spec → Agent Khởi tạo → feature_list.json (200 mục)
                                        ↓
                              Phiên Agent Lập trình 1 → git commit
                                        ↓
                              Phiên Agent Lập trình 2 → git commit
                                        ↓
                              ... (tự tiếp tục đến khi xong)
```

**Đổi mới chính:** Tiến độ tồn tại qua các cửa sổ ngữ cảnh mới nhờ git + danh sách tính năng.

**Ánh xạ CVF:**
- **Skill mới:** AGT-012 Agentic Loop Controller (R3, Thủ công)
- **Rủi ro:** R3 vì thực thi tự chủ nhiều bước với truy cập hệ thống file
- **Governance:** Giới hạn lặp, danh sách lệnh bash cho phép, sandbox hệ thống file, bắt buộc review
- **Cổng phase:** Chỉ Build + Review — thực thi tự chủ quá rủi ro cho Discovery/Design

**Mô hình bảo mật (từ claude-quickstarts):**
1. Sandbox cấp OS
2. Hệ thống file giới hạn trong thư mục dự án
3. Danh sách bash cho phép: `ls`, `cat`, `head`, `tail`, `wc`, `grep`, `npm`, `node`, `git`, `ps`, `lsof`, `sleep`, `pkill`

**CVF bổ sung:** Kiểm tra governance mỗi lần lặp, leo thang rủi ro khi lỗi lặp lại, bắt buộc nhật ký kiểm toán với git commit hash.

---

### 5. Tự Động Hóa Trình Duyệt

**Chức năng:** Browser-use-demo cho Claude điều khiển trình duyệt qua Playwright với các hành động nhận biết DOM: navigate, click, type, scroll, đọc trang, điền form, chụp màn hình.

**Mẫu:**
```
Hướng dẫn → Claude → Gọi Tool Trình duyệt → Hành động Playwright → Screenshot → Phân tích Claude → Hành động tiếp
```

**Đổi mới chính:** Nhắm mục tiêu phần tử qua tham số `ref` (tham chiếu DOM) thay vì tọa độ pixel dễ vỡ.

**Ánh xạ CVF:**
- **Skill mới:** AGT-013 Browser Automation (R3, Thủ công)
- **Rủi ro:** R3 vì trình duyệt có thể truy cập hệ thống bên ngoài, gửi form, điều hướng trang tùy ý
- **Governance:** Thực thi container hóa (Docker), danh sách domain cho phép, không nhập thông tin đăng nhập
- **Cổng phase:** Chỉ Build — tự động hóa trình duyệt là hoạt động cấp thực thi

**CVF bổ sung:** Chính sách governance domain, nhật ký kiểm toán cấp hành động, phát hiện vi phạm sandbox.

---

### 6. Tích Hợp MCP Server

**Chức năng:** Module agents kết nối đến MCP (Model Context Protocol) servers để khám phá và gọi công cụ động, hỗ trợ cả stdio và HTTP.

**Mẫu:**
```python
agent = Agent(
    tools=[ThinkTool()],      # Công cụ cục bộ
    mcp_servers=[{            # MCP servers bên ngoài
        "type": "stdio",
        "command": "python",
        "args": ["-m", "mcp_server"],
    }]
)
```

**Ánh xạ CVF:**
- **Skill mới:** AGT-014 MCP Server Connector (R2, Có giám sát)
- **Rủi ro:** R2 vì truy cập server bên ngoài với khám phá công cụ động
- **Governance:** Danh sách server cho phép, giới hạn timeout kết nối, xác thực kết quả công cụ
- **Cổng phase:** Phase Build + Review

**CVF bổ sung:** Yêu cầu chứng nhận server, xác thực schema công cụ trước khi gọi, kiểm toán vòng đời kết nối.

---

## So Sánh Kiến Trúc

| Khía Cạnh | claude-quickstarts | CVF |
|-----------|-------------------|-----|
| **Cách tiếp cận** | Tối giản, không áp đặt, <300 LOC core | Governance-first, có cấu trúc, đa lớp |
| **Quản lý rủi ro** | Cảnh báo an toàn theo dự án | Phân loại R0-R4 hệ thống |
| **Sử dụng công cụ** | Gọi tool API trực tiếp | Gọi công cụ qua governance |
| **Đa agent** | Mẫu hai-agent (init + work) | Hệ thống 4 vai trò (Orchestrator, Architect, Builder, Reviewer) |
| **Quản lý phiên** | Git commits + danh sách tính năng | Máy trạng thái có cổng phase |
| **Bảo mật** | Bash allowlist + Docker | Risk levels + operator roles + phase gates + audit |
| **Giám sát** | Console output | Audit logger + enforcement log + factual scoring |

## CVF Được Gì

### Skill Mới (AGT-009 → AGT-014)

| ID | Skill | Rủi Ro | Tự Chủ | Nguồn Mẫu |
|----|-------|--------|--------|-----------|
| AGT-009 | RAG Knowledge Retrieval | R2 | Có giám sát | Customer Support Agent |
| AGT-010 | Data Visualization Generator | R1 | Tự động | Financial Data Analyst |
| AGT-011 | Document Parser | R1 | Tự động | Financial Data Analyst |
| AGT-012 | Agentic Loop Controller | R3 | Thủ công | Autonomous Coding |
| AGT-013 | Browser Automation | R3 | Thủ công | Browser Use Demo |
| AGT-014 | MCP Server Connector | R2 | Có giám sát | Agents Module |

### Đăng Ký Công Cụ Agent Cập Nhật

| Mức Rủi Ro | Trước | Sau | Công Cụ |
|------------|-------|-----|---------|
| **R0** | 3 | 3 | Calculator, DateTime, JSON Parse |
| **R1** | 1 | 3 | File Read, **Data Viz**, **Doc Parser** |
| **R2** | 3 | 5 | Web Search, URL Fetch, File Write, **RAG**, **MCP** |
| **R3** | 1 | 3 | Code Execute, **Agentic Loop**, **Browser Automation** |
| **Tổng** | 8 | 14 | +75% mở rộng năng lực |

### Bài Học Chính

1. **RAG là tiêu chuẩn cơ bản** — Mọi ứng dụng AI nghiêm túc cần truy xuất ngữ cảnh có neo. CVF nay có mẫu được governance bọc.

2. **Vòng lặp tự chủ cần giới hạn cứng** — Bash allowlist + filesystem sandbox từ claude-quickstarts là mẫu bảo mật tốt. CVF thêm giới hạn lặp và kiểm tra governance mỗi bước.

3. **Tự động hóa trình duyệt rủi ro cao, giá trị cao** — Cách ly container là bắt buộc. CVF xếp R3 với allowlist domain.

4. **MCP là tương lai interop công cụ** — Khám phá công cụ động qua MCP servers tạo kiến trúc agent tổ hợp. CVF bọc bằng chứng nhận server.

5. **Trực quan hóa dữ liệu rủi ro thấp** — Tạo biểu đồ chỉ-đọc và an toàn. Phân loại R1 cho phép sử dụng tự động.

6. **Phân tích tài liệu cần nhận biết PII** — Khác claude-quickstarts, CVF tự động đánh dấu PII trong tài liệu đã phân tích.

## Tài Nguyên Liên Quan

- [CVF Toolkit Reference](/docs/toolkit-reference) — Triển khai governance engine
- [Custom Skills](/docs/custom-skills) — Tạo skill CVF riêng
- [Mô Hình Rủi Ro](/docs/risk-model) — Phân loại rủi ro R0-R3
- [Agent Platform](/docs/agent-platform) — Điều phối đa agent
- [claude-quickstarts trên GitHub](https://github.com/anthropics/claude-quickstarts) — Mã nguồn gốc
