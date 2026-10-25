# Hướng dẫn: Sử dụng các Kỹ năng Agentic (AGT-009 → AGT-014)

**Thời gian:** 25 phút  
**Cấp độ:** Trung cấp → Nâng cao  
**Yêu cầu:** [Agent Platform đã thiết lập](agent-platform.md), [Hiểu biết về Mô hình Rủi ro](risk-model.md)  
**Bạn sẽ học:** Cách gọi, cấu hình và quản trị 6 kỹ năng agentic nâng cao

---

## Tổng quan

CVF v1.6 mở rộng từ **8 lên 14 công cụ agent**. 6 kỹ năng mới đưa các mẫu agentic cấp production vào framework quản trị của CVF:

| Kỹ năng | Chức năng | Rủi ro | Khi nào sử dụng |
|---------|----------|--------|-----------------|
| 🔍 **AGT-009: Truy xuất RAG** | Tìm kiếm trong kho tri thức để lấy ngữ cảnh | R2 | Khi câu trả lời AI cần dựa trên dữ liệu thực |
| 📊 **AGT-010: Trực quan hóa** | Tạo cấu hình biểu đồ từ dữ liệu | R1 | Khi cần biểu đồ tương tác |
| 📄 **AGT-011: Phân tích tài liệu** | Trích xuất dữ liệu có cấu trúc từ PDF/CSV/ảnh | R1 | Khi xử lý tài liệu tải lên |
| 🔄 **AGT-012: Vòng lặp Agentic** | Chạy tác vụ tự động nhiều bước có lưu trạng thái | R3 | Khi xây dựng tính năng lớn từng bước |
| 🌐 **AGT-013: Tự động trình duyệt** | Điều khiển trình duyệt web qua Playwright | R3 | Khi test hoặc thu thập dữ liệu web |
| 🔌 **AGT-014: Kết nối MCP** | Kết nối với server công cụ MCP bên ngoài | R2 | Khi tích hợp công cụ bên thứ ba |

---

## Hiểu về các Cấp độ Rủi ro

Trước khi dùng bất kỳ kỹ năng nào, hãy hiểu cấp độ rủi ro:

```
R0 ─── R1 ─── R2 ─── R3 ─── R4
An     Thấp   Trung  Cao    Chặn
toàn          bình
Tự     Tự     Giám   Thủ    ──X──
động   động   sát    công
```

| Rủi ro | Phê duyệt | Ai được dùng | Kiểm toán |
|--------|-----------|--------------|-----------|
| **R1** (AGT-010, 011) | Tự động | Tất cả agent, mọi giai đoạn | Ghi log |
| **R2** (AGT-009, 014) | Giám sát — người dùng xác nhận đầu vào | Orchestrator, Builder | Log + review |
| **R3** (AGT-012, 013) | Thủ công — cần phê duyệt rõ ràng | Chỉ Orchestrator hoặc Builder, giai đoạn Build/Review | Toàn bộ trail |

---

## Kỹ năng 1: Truy xuất Tri thức RAG (AGT-009)

### Chức năng

Tìm kiếm tài liệu liên quan từ kho tri thức bằng vector search, sau đó đưa vào làm ngữ cảnh cho câu trả lời AI.

### Khi nào sử dụng

- Trả lời câu hỏi dựa trên tài liệu dự án
- Tìm kiếm trong wiki nội bộ, đặc tả, tài liệu tuân thủ
- Tránh AI bịa đặt bằng cách cung cấp tài liệu nguồn thực

### Cách gọi

**Trong Agent Chat:**

```
Bạn: Tìm kiếm trong kho tri thức về best practice xác thực

Agent (Orchestrator): [Gọi AGT-009]
  → Truy vấn: "best practice xác thực"
  → Kho tri thức: project-docs-kb
  → Kết quả tối đa: 5

Kết quả:
  📄 Nguồn: huong-dan-xac-thuc.md (độ liên quan: 0.94)
  📄 Nguồn: checklist-bao-mat.md (độ liên quan: 0.87)
  📄 Nguồn: thiet-ke-api.md (độ liên quan: 0.72)
```

**Trong Code (TypeScript):**

```typescript
const result = await agentTools.execute('rag_retrieval', {
  query: 'best practice xác thực',
  knowledgeBaseId: 'project-docs-kb',
  maxResults: 5,
  minRelevanceScore: 0.7
});

// result.data = {
//   documents: [
//     { id: 'doc-1', content: '...', source: 'auth-guide.md', score: 0.94 },
//     ...
//   ],
//   totalFound: 12,
//   queryEmbeddingModel: 'text-embedding-3-small'
// }
```

### Kiểm soát Quản trị

- ✅ Tất cả tài liệu truy xuất được log với ID và điểm liên quan
- ✅ Bắt buộc trích dẫn nguồn trong output AI
- ✅ Lọc PII trên nội dung trước khi đưa vào
- ❌ Không thể truy xuất mà không ghi log
- ❌ Không thể bịa đặt nguồn không có trong kho tri thức

### Lỗi thường gặp

| Lỗi | Cách sửa |
|-----|---------|
| Truy vấn quá mơ hồ ("kể về dự án") | Dùng từ cụ thể: "luồng refresh JWT token trong module xác thực" |
| Không đặt điểm liên quan tối thiểu | Đặt `minRelevanceScore: 0.7` để tránh kết quả kém chất lượng |
| Bỏ qua trích dẫn nguồn | Luôn hiển thị tài liệu nào đã được sử dụng |

---

## Kỹ năng 2: Tạo Trực quan hóa Dữ liệu (AGT-010)

### Chức năng

Tạo JSON cấu hình biểu đồ từ dữ liệu có cấu trúc, hỗ trợ biểu đồ đường, cột, tròn, vùng, và xếp chồng.

### Khi nào sử dụng

- Trực quan hóa dữ liệu tài chính, dashboard metrics
- Tạo biểu đồ so sánh từ dữ liệu CSV
- Tạo biểu đồ theo dõi tiến độ

### Cách gọi

**Trong Agent Chat:**

```
Bạn: Tạo biểu đồ cột so sánh doanh thu Q1 và Q2 theo khu vực

Agent (Builder): [Gọi AGT-010]
  → Dữ liệu: [{ region: "VN", q1: 500, q2: 620 }, { region: "TH", q1: 340, q2: 410 }, ...]
  → Loại biểu đồ: bar
  → Tiêu đề: "Doanh thu theo Khu vực: Q1 vs Q2"

Kết quả:
  📊 Cấu hình biểu đồ đã tạo (JSON tương thích Recharts)
  → 4 điểm dữ liệu, 2 chuỗi
```

**Trong Code (TypeScript):**

```typescript
const chart = await agentTools.execute('data_viz', {
  data: [
    { region: 'Việt Nam', q1: 500000, q2: 620000 },
    { region: 'Thái Lan', q1: 340000, q2: 410000 },
    { region: 'Singapore', q1: 280000, q2: 350000 },
  ],
  chartType: 'bar',
  xAxis: 'region',
  series: ['q1', 'q2'],
  title: 'Doanh thu theo Khu vực',
  labels: { q1: 'Q1 2026', q2: 'Q2 2026' }
});
```

### Kiểm soát Quản trị

- ✅ Chỉ đọc — dữ liệu không bao giờ bị sửa đổi
- ✅ Cấu hình biểu đồ được validate theo schema
- ✅ Không có mã thực thi trong output
- ❌ Không thể chứa JavaScript trong cấu hình biểu đồ
- ❌ Không thể xuất dữ liệu ra ngoài phiên làm việc

---

## Kỹ năng 3: Phân tích Tài liệu (AGT-011)

### Chức năng

Phân tích tài liệu (PDF, CSV, TXT, ảnh) và trích xuất dữ liệu có cấu trúc theo schema.

### Khi nào sử dụng

- Trích xuất dữ liệu tài chính từ báo cáo PDF
- Phân tích file CSV
- Trích xuất văn bản từ ảnh (OCR)
- Xử lý hợp đồng, hóa đơn, biểu mẫu

### Cách gọi

**Trong Agent Chat:**

```
Bạn: [Tải lên bao_cao_quy.pdf] Trích xuất bảng doanh thu từ báo cáo này

Agent (Builder): [Gọi AGT-011]
  → File: bao_cao_quy.pdf (PDF, 2.3 MB)
  → Trích xuất: "bảng doanh thu"
  → Schema: { quy: string, doanh_thu: number, tang_truong: string }

Kết quả:
  📄 Đã trích xuất 4 hàng từ trang 3, bảng 2
  → Q1: 28 tỷ (+12%), Q2: 33 tỷ (+16%), ...
```

### Kiểm soát Quản trị

- ✅ Phát hiện PII chạy trên tất cả văn bản trích xuất
- ✅ Giới hạn kích thước file (tối đa 10 MB)
- ✅ Validate định dạng hỗ trợ (từ chối file thực thi)
- ⚠️ Nội dung có PII bị ẩn trước khi log
- ❌ Không thể xử lý file thực thi (.exe, .sh, .bat)

---

## Kỹ năng 4: Bộ điều khiển Vòng lặp Agentic (AGT-012) ⚠️ R3

### Chức năng

Quản lý thực thi tác vụ tự động nhiều bước. Giống như "cruise control" để xây dựng tính năng — agent làm việc qua danh sách task, commit tiến độ qua git, và có thể tiếp tục giữa các phiên.

### Khi nào sử dụng

- Xây dựng tính năng lớn với hơn 10 subtask
- Tái cấu trúc tự động trên nhiều file
- Tạo test cho toàn bộ module
- Workflow migration (database, API versions)

### ⚠️ Quan trọng: Kỹ năng R3 — Cần phê duyệt

Kỹ năng này hoạt động tự động và sửa file. **Bạn phải phê duyệt rõ ràng mỗi phiên.**

### Cách gọi

**Trong Agent Chat:**

```
Bạn: Xây dựng module xác thực người dùng. Đây là spec: [tải lên auth_spec.md]

Agent (Orchestrator): Tôi sẽ thiết lập vòng lặp agentic với kế hoạch sau:
  Tác vụ:
    1. Tạo User model và migration
    2. Triển khai JWT token service
    3. Tạo các endpoint login/register
    4. Thêm middleware bảo vệ route
    5. Viết test cho tất cả endpoint

  Cài đặt:
    → Số lần lặp tối đa: 20
    → Sandbox: chỉ thư mục dự án
    → Lệnh cho phép: npm, node, git, cat, ls, grep
    → Auto-commit: sau mỗi task
    → Review thủ công: mỗi 5 task

  ⚠️ Bạn có phê duyệt kế hoạch thực thi này không? [Phê duyệt / Sửa đổi / Từ chối]

Bạn: Phê duyệt

Agent: [Bắt đầu vòng lặp agentic...]
  ✅ Task 1/5: Đã tạo User model (commit: a3f2b1c)
  ✅ Task 2/5: JWT service đã triển khai (commit: e7d4a9b)
  🔄 Task 3/5: Đang xây dựng endpoints... [đang chạy]
```

### Mô hình An ninh

```
┌─────────────────────────────────────┐
│  Sandbox cấp OS                     │
│  ┌───────────────────────────────┐  │
│  │  Hạn chế Filesystem           │  │
│  │  (chỉ thư mục dự án)         │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  Danh sách Bash cho    │  │  │
│  │  │  phép: ls, cat, npm,   │  │  │
│  │  │  node, git, grep       │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Quản trị mỗi Vòng lặp       │  │
│  │  → Kiểm tra rủi ro           │  │
│  │  → Validate phê duyệt        │  │
│  │  → Ghi log kiểm toán         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Kiểm soát Quản trị

- ✅ Bắt buộc giới hạn số lần lặp (không vòng lặp vô hạn)
- ✅ Danh sách lệnh Bash được phép applied
- ✅ Thao tác file bị giới hạn trong thư mục dự án
- ✅ Tiến độ được lưu qua git commits
- ✅ Review thủ công theo chu kỳ cấu hình
- ⚠️ Rủi ro tự động leo thang sau 3 lần thất bại liên tiếp
- ❌ Không thể chạy lệnh ngoài danh sách cho phép
- ❌ Không thể truy cập file ngoài thư mục dự án

---

## Kỹ năng 5: Tự động Trình duyệt (AGT-013) ⚠️ R3

### Chức năng

Điều khiển trình duyệt web thông qua Playwright. Có thể điều hướng trang, đọc DOM, điền form, nhấn nút, cuộn trang, tìm văn bản, và chụp ảnh màn hình.

### Khi nào sử dụng

- Test end-to-end cho ứng dụng web
- Thu thập dữ liệu công khai từ website
- Xác minh kết quả deploy
- Test tự động gửi form

### ⚠️ Quan trọng: Kỹ năng R3 — Chạy trong Container cô lập

Tự động trình duyệt BẮT BUỘC chạy trong Docker container. Không bao giờ trên máy trực tiếp.

### Cách gọi

**Trong Agent Chat:**

```
Bạn: Test trang đăng nhập tại http://localhost:3000/login

Agent (Builder): [Gọi AGT-013 trong container]
  → Điều hướng: http://localhost:3000/login
  → Chụp ảnh: trang_dang_nhap.png ✓
  → Đọc trang: Tìm thấy form với 2 input (email, mật khẩu) + 1 nút (Đăng nhập)
  → Điền form: email="test@example.com", password="***"
  → Nhấn: nút "Đăng nhập"
  → Chờ: 2s
  → Chụp ảnh: sau_dang_nhap.png ✓
  → Kết quả: Chuyển hướng đến /dashboard — đăng nhập thành công

  📸 Screenshots đã lưu tại ./test-results/
```

### Quy tắc An toàn

| Quy tắc | Thực thi |
|---------|---------|
| Cô lập container | Docker với XVFB virtual display |
| Danh sách domain cho phép | Chỉ truy cập domain đã phê duyệt |
| Không credentials thực | Không bao giờ nhập mật khẩu thật (dùng test data) |
| Log mọi thao tác | Mọi click, nhập, điều hướng được log |
| Giới hạn thời gian | Phiên tự động kết thúc sau timeout |
| Phê duyệt thủ công | Cần thiết cho domain không trong danh sách |

---

## Kỹ năng 6: Kết nối MCP Server (AGT-014)

### Chức năng

Kết nối với server [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) bên ngoài để khám phá và gọi công cụ bên thứ ba một cách linh hoạt.

### Khi nào sử dụng

- Tích hợp cơ sở dữ liệu, API, hoặc dịch vụ bên ngoài
- Kết nối với công cụ AI chuyên biệt (phân tích code, search engine)
- Khám phá công cụ động mà không cần hardcode

### Cách gọi

**Trong Agent Chat:**

```
Bạn: Kết nối với GitHub MCP server và liệt kê các issue đang mở

Agent (Orchestrator): [Gọi AGT-014]
  → Server: github-mcp (stdio)
  → Lệnh: npx @modelcontextprotocol/server-github
  → Công cụ phát hiện: list_issues, create_issue, search_repos, ...
  → Gọi: list_issues(state="open", per_page=10)

Kết quả:
  📋 Tìm thấy 5 issue đang mở:
  1. #42 — Sửa chuyển hướng đăng nhập (bug, cao)
  2. #38 — Thêm chế độ dark mode (tính năng, trung bình)
  ...
```

### Kiểm soát Quản trị

- ✅ Server phải nằm trong danh sách server đã phê duyệt
- ✅ Giới hạn timeout kết nối (mặc định 15s)
- ✅ Schema công cụ được validate trước khi gọi
- ✅ Tất cả kết quả được log với server ID và tên công cụ
- ❌ Không thể kết nối server chưa phê duyệt
- ❌ Không thể gọi công cụ không có schema validation
- ❌ Không thể bỏ qua giới hạn timeout

---

## Hướng dẫn Chọn nhanh

Dùng sơ đồ này để chọn kỹ năng phù hợp:

```
Bạn cần gì?
│
├── Trả lời câu hỏi với dữ liệu thực?
│   └── AGT-009: Truy xuất RAG (R2)
│
├── Tạo biểu đồ từ dữ liệu?
│   └── AGT-010: Trực quan hóa (R1)
│
├── Trích xuất dữ liệu từ file?
│   └── AGT-011: Phân tích tài liệu (R1)
│
├── Xây dựng thứ gì đó cần nhiều bước?
│   └── AGT-012: Vòng lặp Agentic (R3) ⚠️
│
├── Test hoặc tương tác với website?
│   └── AGT-013: Tự động trình duyệt (R3) ⚠️
│
└── Kết nối với công cụ/API bên ngoài?
    └── AGT-014: Kết nối MCP (R2)
```

---

## Kết hợp Kỹ năng

Các kỹ năng hoạt động tốt nhất khi kết hợp. Các tổ hợp phổ biến:

### Pipeline Phân tích Tài liệu

```
AGT-011 (Parse PDF) → AGT-010 (Trực quan hóa) → AGT-009 (Tìm ngữ cảnh)
```

Tải báo cáo tài chính → Trích xuất bảng → Tạo biểu đồ → Tìm so sánh trong kho tri thức.

### Workflow Xây dựng Tự động

```
AGT-009 (Tìm specs) → AGT-012 (Vòng lặp agentic) → AGT-013 (Test trình duyệt)
```

Truy xuất yêu cầu → Xây dựng tính năng từng bước → Xác minh trên trình duyệt.

### Pipeline Tích hợp Công cụ

```
AGT-014 (Kết nối MCP) → AGT-011 (Parse kết quả) → AGT-010 (Trực quan hóa)
```

Kết nối với API bên ngoài → Phân tích dữ liệu phản hồi → Tạo biểu đồ dashboard.

---

## Tóm tắt Quản trị

| Kỹ năng | Rủi ro | Phê duyệt | Giai đoạn | Vai trò | Kiểm toán |
|---------|--------|-----------|-----------|---------|-----------|
| AGT-009 RAG | R2 | Giám sát | Tất cả | Tất cả | Log nguồn |
| AGT-010 Viz | R1 | Tự động | Build, Review | Architect, Builder | Log config |
| AGT-011 Parse | R1 | Tự động | Tất cả | Tất cả | Lọc PII |
| AGT-012 Loop | R3 | **Thủ công** | Build, Review | **Orchestrator** | Trail đầy đủ |
| AGT-013 Browser | R3 | **Thủ công** | **Chỉ Build** | **Builder** | Screenshots + actions |
| AGT-014 MCP | R2 | Giám sát | Build, Review | Orchestrator, Builder | Log server + tool |

---

## Tài liệu Liên quan

- [Phân tích Mẫu Agentic](/docs/agentic-patterns) — Đi sâu vào các mẫu đằng sau những kỹ năng này
- [Mô hình Rủi ro](/docs/risk-model) — Hiểu các cấp rủi ro R0-R3
- [Agent Platform](/docs/agent-platform) — Thiết lập workflow multi-agent
- [Custom Skills](/docs/custom-skills) — Tạo kỹ năng riêng
- [Mô hình Quản trị](/docs/governance-model) — Cách kiểm soát quản trị hoạt động
