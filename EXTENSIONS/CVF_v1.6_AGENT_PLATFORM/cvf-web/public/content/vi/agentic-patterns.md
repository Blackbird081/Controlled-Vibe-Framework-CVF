# Các Mẫu Agentic từ Claude Quickstarts

> Bài học rút ra từ [claude-quickstarts](https://github.com/anthropics/claude-quickstarts) để tham khảo khi lập kế hoạch cho agent.

## Claude Quickstarts Là Gì?

[claude-quickstarts](https://github.com/anthropics/claude-quickstarts) của Anthropic là bộ sưu tập 14.2k sao gồm các ví dụ thực tế về cách xây dựng ứng dụng với Claude API. Nó chứa **5 demo mẫu thiết kế production**:

| Dự Án | Mẫu Thiết Kế | Công Nghệ |
|-------|--------------|-----------|
| **Customer Support Agent** | RAG + Knowledge Base + Phát hiện tâm trạng | Next.js, Bedrock KB, Claude API |
| **Financial Data Analyst** | Trực quan hóa dữ liệu + Upload đa định dạng | Next.js, Recharts, PDF.js |
| **Agents** | Vòng lặp Agentic tối giản + MCP Tools | Python, Claude API, MCP |
| **Autonomous Coding** | Mẫu Hai-Agent + Lưu trữ phiên | Claude Agent SDK, Git |
| **Browser Use Demo** | Tự động hóa trình duyệt + Công cụ DOM | Python, Playwright, Streamlit |

## Các mẫu thiết kế

### 1. RAG (Retrieval-Augmented Generation)

**Chức năng:** Customer-support-agent truy xuất tài liệu liên quan từ Amazon Bedrock Knowledge Bases trước khi trả lời, neo câu trả lời vào dữ liệu thực.

**Mẫu:**

```
Truy vấn → Embedding → Tìm kiếm vector → Top-K Tài liệu → Chèn ngữ cảnh → Phản hồi Claude
```

---

### 2. Trực Quan Hóa Dữ Liệu Tương Tác

**Chức năng:** Financial-data-analyst tạo cấu hình biểu đồ (line, bar, pie, area, stacked area) từ dữ liệu tài chính, render bằng Recharts.

**Mẫu:**

```
Upload dữ liệu → Phân tích Claude → JSON cấu hình biểu đồ → Render Recharts → Dashboard tương tác
```

---

### 3. Phân Tích Tài Liệu Đa Định Dạng

**Chức năng:** Financial-data-analyst xử lý upload text, PDF, CSV, và hình ảnh, trích xuất dữ liệu có cấu trúc.

**Mẫu:**

```
Upload file → Phát hiện loại → Parser (PDF.js / CSV / Vision) → Dữ liệu có cấu trúc → Sẵn sàng phân tích
```

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

**Mô hình bảo mật (từ claude-quickstarts):**

1. Sandbox cấp OS
2. Hệ thống file giới hạn trong thư mục dự án
3. Danh sách bash cho phép: `ls`, `cat`, `head`, `tail`, `wc`, `grep`, `npm`, `node`, `git`, `ps`, `lsof`, `sleep`, `pkill`

---

### 5. Tự Động Hóa Trình Duyệt

**Chức năng:** Browser-use-demo cho Claude điều khiển trình duyệt qua Playwright với các hành động nhận biết DOM: navigate, click, type, scroll, đọc trang, điền form, chụp màn hình.

**Mẫu:**

```
Hướng dẫn → Claude → Gọi Tool Trình duyệt → Hành động Playwright → Screenshot → Phân tích Claude → Hành động tiếp
```

**Đổi mới chính:** Nhắm mục tiêu phần tử qua tham số `ref` (tham chiếu DOM) thay vì tọa độ pixel dễ vỡ.

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

---

Các ví dụ mô tả cách thiết kế quy trình. Mức rủi ro và quyền thực hiện phụ thuộc vào công việc, dữ liệu và phạm vi đã được phép.

[Xem gói dành cho agent](/skills) hoặc [chọn mẫu để viết bản đặc tả](/home).

<!-- Text Encoding Exception: retains localized reader text and navigation symbols. -->
