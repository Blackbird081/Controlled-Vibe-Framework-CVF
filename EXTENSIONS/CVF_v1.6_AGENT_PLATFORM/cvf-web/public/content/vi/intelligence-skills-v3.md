# Hướng dẫn: Kỹ năng Thông minh từ Phân tích claudekit-skills (AGT-021 → AGT-024)

**Thời gian:** 25 phút  
**Trình độ:** Trung cấp → Nâng cao  
**Yêu cầu:** [Đã cài Agent Platform](agent-platform.md), [Đã đọc Kỹ năng mới v1.6.2 (AGT-015–020)](using-new-skills-v2.md)  
**Bạn sẽ học:** Cách sử dụng 4 kỹ năng mới lấy cảm hứng từ claudekit-skills — tối ưu context, định tuyến giải quyết vấn đề, debug hệ thống, và cách ly context MCP

---

## Tổng quan

CVF v1.6.3 mở rộng từ **20 lên 24 công cụ agent** sau khi phân tích hệ sinh thái [claudekit-skills](https://github.com/Blackbird081/claudekit-skills) (30+ skills, 12 plugin categories). 4 kỹ năng mới này mang các mẫu **meta-cognitive** vào framework governance của CVF:

| Kỹ năng | Chức năng | Rủi ro | Khi nào dùng |
|---------|----------|--------|-------------|
| 🧠 **AGT-021: Context Engineering Optimizer** | Quản lý token, phát hiện suy giảm, nén context | R1 | Khi context window đầy hoặc hiệu suất giảm |
| 🧭 **AGT-022: Problem-Solving Framework Router** | Phân loại vấn đề → kỹ thuật phù hợp | R0 | Khi bị kẹt với bất kỳ loại vấn đề nào |
| 🔍 **AGT-023: Systematic Debugging Engine** | Phương pháp 4 pha tìm nguyên nhân gốc | R2 | Khi debug lỗi code hoặc hệ thống |
| 🔒 **AGT-024: MCP Context Isolation Manager** | Ủy quyền MCP qua subagent riêng biệt | R2 | Khi dùng nhiều MCP server |

---

## Phân bố Rủi ro Cập nhật (24 Skills)

```
R0 (5 skills) ─── R1 (7 skills) ─── R2 (8 skills) ─── R3 (4 skills)
An toàn/Tự động   Thấp/Tự động      Trung bình/Giám sát   Cao/Thủ công
```

| Rủi ro | Kỹ năng mới | Phê duyệt | Ai được dùng |
|--------|------------|-----------|-------------|
| **R0** (AGT-022) | Problem-Solving Router | Tự động | Tất cả |
| **R1** (AGT-021) | Context Engineering Optimizer | Tự động | Tất cả |
| **R2** (AGT-023, 024) | Systematic Debugging, MCP Isolation | Giám sát | Orchestrator, Builder |

---

## Kỹ năng 1: Context Engineering Optimizer (AGT-021)

### Chức năng

Kỹ năng cấp framework cho việc **tối ưu hóa token context** trong workflow agent. Giám sát sức khỏe context, phát hiện mẫu suy giảm, và kích hoạt nén khi cần.

### Khi nào dùng

- Context window tiến gần 70-80% dung lượng
- Hiệu suất agent giảm trong phiên làm việc dài
- Workflow đa agent với chi phí token cao
- Cần tối ưu cấu trúc prompt cho cache hit rate

### Khái niệm chính: Chiến lược 4 Nhóm

```
Write (lưu bên ngoài) → Select (lấy liên quan) → Compress (giảm token) → Isolate (tách sub-agent)
```

### Ví dụ Prompt Chat

```
"Phân tích sức khỏe context hiện tại — token utilization bao nhiêu?"
"Tối ưu context: di chuyển thông tin quan trọng về đầu/cuối"
"Kích hoạt nén — mục tiêu giảm 50-70% với tổn thất chất lượng dưới 5%"
"Thiết lập giám sát context cho workflow đa agent này"
```

### Tích hợp TypeScript

```typescript
import { ContextEngineering } from '@cvf/agent-skills';

const optimizer = new ContextEngineering({
  governance: { risk: 'R1', approval: 'auto_audit' }
});

// Giám sát sức khỏe context
const health = await optimizer.analyze({
  currentTokens: 85000,
  maxTokens: 128000,
  criticalSections: ['system-prompt', 'user-context', 'tool-results']
});

console.log(health);
// {
//   utilization: 0.66,
//   warning: false,
//   degradationRisk: 'low',
//   recommendations: ['Di chuyển thông tin quan trọng về đầu/cuối']
// }

// Kích hoạt nén khi cần
if (health.utilization > 0.7) {
  const result = await optimizer.compact({
    strategy: 'four-bucket',
    targetReduction: 0.6,       // Giảm 60%
    maxQualityLoss: 0.05,       // ≤5% tổn thất chất lượng
    preserveSections: ['system-prompt', 'recent-context']
  });
  console.log(`Giảm từ ${result.before} xuống ${result.after} tokens`);
}
```

### Các Anti-Pattern Được Phát hiện

| Anti-Pattern | Cách Sửa |
|-------------|----------|
| Tải context đầy đủ | Chỉ chọn token có tín hiệu cao |
| Thông tin quan trọng ở giữa | Di chuyển về đầu/cuối (đường cong chú ý hình chữ U) |
| Không nén trước giới hạn | Kích hoạt ở 70-80% utilization |
| Tool không có mô tả | Áp dụng khung 4 câu hỏi: cái gì, khi nào, đầu vào, trả về |

---

## Kỹ năng 2: Problem-Solving Framework Router (AGT-022)

### Chức năng

Meta-skill **định tuyến đến kỹ thuật giải quyết vấn đề phù hợp** dựa trên cách bạn bị kẹt. Không giải quyết trực tiếp — chỉ xác định phương pháp tối ưu.

### Khi nào dùng

- Kiến trúc ngày càng phức tạp
- Cần ý tưởng đột phá
- Thấy cùng một mẫu ở nhiều nơi
- Giả định có vẻ sai nhưng không xác định được tại sao
- Không chắc giải pháp có mở rộng được không

### Cây Quyết định

```
BỊ KẸT?
├─ Lỗi kỹ thuật?                → AGT-023 (Systematic Debugging)
├─ Kiến trúc quá phức tạp?      → Simplification Cascades
├─ Cần ý tưởng đột phá?         → Collision Zone Thinking
├─ Thấy mẫu lặp lại?            → Meta-Pattern Recognition
├─ Giả định có vẻ sai?           → Inversion Exercise
├─ Chưa chắc về quy mô?         → Scale Game
└─ Nhiều vấn đề độc lập?        → AGT-018 (sub-agent song song)
```

### Ví dụ Prompt Chat

```
"Tôi bị kẹt — kiến trúc này cứ thêm trường hợp đặc biệt. Giúp tôi đơn giản hóa."
"Tôi cần cách tiếp cận sáng tạo — giải pháp thông thường không hiệu quả."
"Tôi cứ thấy cùng một vấn đề ở các phần khác nhau của codebase."
"Có gì đó sai với giả định của chúng tôi nhưng tôi không tìm ra được."
"Cách tiếp cận này có hoạt động được khi tăng gấp 1000 lần không?"
```

### 6 Kỹ thuật

**1. Simplification Cascades** — Khi phức tạp leo thang

```
Tìm một insight loại bỏ nhiều thành phần cùng lúc.
Dấu hiệu: cùng một thứ làm 5+ cách, trường hợp đặc biệt tăng dần.
```

**2. Collision Zone Thinking** — Khi cần sáng tạo

```
Ép buộc khái niệm không liên quan kết hợp để phát hiện tính chất mới.
Ví dụ: "Nếu hệ thống auth hoạt động như hệ miễn dịch sinh học thì sao?"
```

**3. Meta-Pattern Recognition** — Khi mẫu lặp lại xuất hiện

```
Nhận diện mẫu xuất hiện ở 3+ lĩnh vực.
Hành động: Trừu tượng hóa mẫu, giải quyết một lần, áp dụng mọi nơi.
```

**4. Inversion Exercise** — Khi bị ràng buộc bởi giả định

```
Đảo ngược giả định cốt lõi để lộ ra ràng buộc ẩn.
Hỏi: "Nếu chúng ta làm ngược lại hoàn toàn thì sao?"
```

**5. Scale Game** — Khi chưa chắc về production

```
Thử nghiệm ở cực đoan: gấp 1000 lần VÀ nhỏ hơn 1000 lần.
Tiết lộ: điểm nghẽn thực sự, phức tạp không cần thiết, bất biến quy mô.
```

**6. Kết hợp Kỹ thuật**

```
Simplification + Meta-pattern: Tìm mẫu → đơn giản hóa tất cả instances
Collision + Inversion:         Ép metaphor → đảo ngược giả định
Scale + Simplification:        Cực đoan tiết lộ cái cần loại bỏ
```

---

## Kỹ năng 3: Systematic Debugging Engine (AGT-023)

### Chức năng

Phương pháp debug 4 pha đảm bảo **tìm nguyên nhân gốc TRƯỚC KHI sửa**. Ngăn chặn anti-pattern phổ biến của AI là "đoán-và-sửa".

### Luật Sắt
>
> **KHÔNG SỬA MÀ CHƯA ĐIỀU TRA NGUYÊN NHÂN GỐC.**

### Khi nào dùng

- Code cho kết quả sai
- Test fail bất ngờ
- Lỗi hệ thống sau thay đổi
- Hiệu suất giảm
- Sau 2+ lần sửa thất bại (BẮT BUỘC dùng)

### Bốn Pha

```
Pha 1: Nguyên nhân    →  Pha 2: Phân tích     →  Pha 3: Giả thuyết    →  Pha 4: Triển khai
      ↓                         ↓                        ↓                        ↓
 Đọc lỗi                 Tìm ví dụ hoạt động     Đặt 1 giả thuyết       Tạo test thất bại
 Tái hiện                So sánh khác biệt        Thử nghiệm tối thiểu   Sửa 1 lỗi duy nhất
 Kiểm tra thay đổi       Xác định khoảng trống    Một biến mỗi lần       Xác minh
 Truy vết dữ liệu        Hiểu phụ thuộc           Xác nhận/bác bỏ        Ghi chép
```

### Ví dụ Prompt Chat

```
"Debug test này — bắt đầu với Pha 1 điều tra nguyên nhân gốc."
"API trả về 500 sau deploy cuối. Truy vết luồng dữ liệu."
"Tôi đã thử sửa 3 lần rồi — dùng systematic debugging từ đầu."
"So sánh module lỗi này với phiên bản hoạt động ở service kia."
```

### Tích hợp TypeScript

```typescript
import { SystematicDebugger } from '@cvf/agent-skills';

const debugger = new SystematicDebugger({
  governance: { risk: 'R2', approval: 'supervised' }
});

// Pha 1: Điều tra Nguyên nhân Gốc
const investigation = await debugger.investigate({
  error: errorMessage,
  stackTrace: trace,
  recentChanges: await git.diff('HEAD~3'),
  affectedFiles: ['src/auth/service.ts', 'src/auth/middleware.ts']
});

// Pha 2: Phân tích Mẫu
const patterns = await debugger.analyzePatterns({
  workingExample: 'src/user/service.ts',
  brokenComponent: 'src/auth/service.ts',
  differences: investigation.differences
});

// Pha 3: Giả thuyết
const hypothesis = debugger.formHypothesis({
  rootCause: investigation.rootCause,
  evidence: patterns.evidence,
  // Một giả thuyết: "X là nguyên nhân vì Y"
});

// Pha 4: Triển khai (chỉ sau khi giả thuyết được xác nhận)
if (hypothesis.confirmed) {
  const fix = await debugger.implement({
    failingTest: 'tests/auth.test.ts',
    singleFix: hypothesis.proposedFix,
    verifyCommand: 'npm test'
  });
  // BẮT BUỘC xác minh: output test thực tế hiện 0 failures
  console.log(fix.verificationEvidence);
}
```

### Dấu hiệu Cảnh báo — DỪNG và Quay về Pha 1

- ❌ "Thử đổi X xem sao"
- ❌ "Sửa tạm, điều tra sau"
- ❌ "Thêm nhiều thay đổi rồi chạy test"
- ❌ "Tôi chưa hiểu hết nhưng có thể cái này sẽ hoạt động"
- ❌ "Thử sửa thêm một lần nữa" (sau 2+ lần thất bại)
- ❌ Đề xuất giải pháp trước khi truy vết luồng dữ liệu

### Quy tắc Leo thang
>
> **Nếu 3+ lần sửa thất bại → DỪNG → Đặt câu hỏi về kiến trúc.** Chuyển lên vai trò Architect.

---

## Kỹ năng 4: MCP Context Isolation Manager (AGT-024)

### Chức năng

Mẫu kiến trúc **ủy quyền gọi công cụ MCP cho subagent riêng biệt**, giữ context của agent chính sạch. Giải quyết vấn đề "phình context" khi tải nhiều MCP server.

### Nguyên tắc Chính
>
> Khám phá và thực thi công cụ MCP diễn ra trong context subagent cách ly. Agent chính chỉ nhận kết quả, không nhận 1000+ định nghĩa tool.

### Khi nào dùng

- Làm việc với 3+ MCP server cùng lúc
- Context window bị phình bởi định nghĩa tool
- Cần bảo toàn chất lượng context chính trong workflow nặng MCP
- Quản lý 10-80+ MCP server cho enterprise

### Kiến trúc

```
┌──────────────────────────┐
│     Agent Chính          │
│  (context sạch)          │
│                          │
│  "Tôi cần dùng MCP X"   │
│         │                │
│         ▼                │
│  ┌──────────────┐        │
│  │ Chuyển đến    │        │
│  │ MCP Subagent  │        │
│  └──────┬───────┘        │
│         │                │
└─────────┼────────────────┘
          ▼
┌──────────────────────────┐
│   MCP Manager Subagent   │
│  (context cách ly)       │
│                          │
│  1. Tải .mcp.json        │
│  2. Khởi tạo servers     │
│  3. Khám phá tools       │
│  4. Chọn tool tối ưu     │
│  5. Thực thi tool        │
│  6. Trả kết quả duy nhất │
└──────────────────────────┘
```

### Ví dụ Prompt Chat

```
"Dùng GitHub MCP server để liệt kê PR mở — cách ly khỏi context chính."
"Thiết lập context isolation cho 5 MCP server này."
"Tôi tiết kiệm bao nhiêu context với MCP isolation so với tải trực tiếp?"
"Chạy truy vấn database qua MCP subagent và chỉ trả kết quả."
```

### Tiết kiệm Context

| Chỉ số | Không cách ly | Có cách ly |
|--------|---------------|-----------|
| Chi phí context mỗi MCP server | ~500-2000 tokens | ~0 tokens (chính) |
| 10 MCP server | ~10,000 tokens | ~50 tokens (dispatch) |
| Thời gian khám phá tool | Tức thì (phình) | Theo yêu cầu (sạch) |
| Chất lượng context chính | Suy giảm | Bảo toàn |

### Tích hợp TypeScript

```typescript
import { MCPIsolationManager } from '@cvf/agent-skills';

const mcp = new MCPIsolationManager({
  governance: { risk: 'R2', approval: 'supervised' },
  timeout: 30000,
  maxServers: 80
});

// Cấu hình MCP servers (context chính giữ sạch)
mcp.configure({
  servers: [
    { name: 'github', config: '.mcp/github.json' },
    { name: 'database', config: '.mcp/postgres.json' },
    { name: 'slack', config: '.mcp/slack.json' }
  ],
  security: {
    credentialSource: 'environment',    // Không bao giờ trong context
    allowList: ['github', 'database'],  // Danh sách server cho phép
    resultSanitization: true            // Lọc dữ liệu nhạy cảm
  }
});

// Thực thi qua subagent cách ly
const result = await mcp.execute({
  server: 'github',
  action: 'list_pull_requests',
  params: { state: 'open', author: '@me' },
  // Chỉ kết quả trả về context chính
  resultFormat: 'summary'
});

console.log(result);
// { prs: [...], tokensSaved: 1847, subagentDuration: '2.3s' }
```

### Mô hình Bảo mật

- Thông tin MCP quản lý qua **biến môi trường** (không bao giờ trong context)
- Subagent có **quyền hạn giới hạn**: chỉ thực thi MCP tools
- Kết quả được **lọc dữ liệu nhạy cảm** trước khi trả về
- **Danh sách server cho phép** thực thi qua cấu hình governance

---

## Các Kỹ năng Phối hợp Như Thế Nào

```
Agent gặp vấn đề
       │
       ▼
  AGT-022 (Router)
  "Kiểu kẹt nào?"
       │
       ├─ Lỗi code ──────→ AGT-023 (Debugging)
       │                     4 pha tìm nguyên nhân gốc
       │
       ├─ Kiến trúc phức ─→ Simplification Cascades
       │
       ├─ Context phình ──→ AGT-021 (Optimizer)
       │                     Nén + giám sát
       │
       └─ MCP quá tải ───→ AGT-024 (Isolation)
                             Ủy quyền subagent
```

### Bản đồ Tích hợp

| Kỹ năng | Tích hợp với | Cách thức |
|---------|-------------|----------|
| AGT-021 | AGT-019 (Progressive Loader) | Ngân sách tải skill runtime |
| AGT-021 | AGT-018 (Agent Team) | Theo dõi chi phí context đa agent |
| AGT-022 | AGT-023 (Debugging) | Định tuyến "lỗi code" đến debugging |
| AGT-022 | AGT-018 (Agent Team) | Định tuyến "nhiều vấn đề" đến agent song song |
| AGT-023 | AGT-022 (Router) | Được gọi từ router khi có lỗi code |
| AGT-024 | AGT-014 (MCP Server) | Kết nối MCP cơ bản |
| AGT-024 | AGT-021 (Context) | Bảo toàn chất lượng context |

---

## Điểm Khác biệt của v1.6.3

| Khía cạnh | Trước (v1.6.2) | Mới (v1.6.3) |
|-----------|----------------|--------------|
| **Trọng tâm** | Tự động hóa workflow, phân tích | Trí tuệ meta-cognitive |
| **Nguồn** | claude-code-templates (500+ components) | claudekit-skills (30+ skills, 12 plugins) |
| **Insight chính** | Mẫu dựa trên template | "Skills ≠ Documentation" — khả năng workflow chủ động |
| **Skills thêm** | AGT-015→020 (6 skills) | AGT-021→024 (4 skills) |
| **Tổng cộng** | 20 công cụ agent | 24 công cụ agent |
| **Khái niệm mới** | Hệ thống hook, nhóm agent | Context engineering như ngành tối ưu hóa |

---

## Bài Học Chính từ claudekit-skills

> **"Skills ≠ Documentation."** — Skill không phải hướng dẫn tham khảo. Nó là khả năng workflow chủ động với cây quyết định, anti-pattern, và quy tắc leo thang. Triết lý này định hình cả 4 kỹ năng mới: mỗi cái là một **phương pháp luận**, không chỉ tham chiếu.

---

## Bước Tiếp Theo

1. **Thử AGT-022 trước** — R0 (hoàn toàn tự động), giúp bạn chọn đúng cách tiếp cận
2. **Giám sát context với AGT-021** — đặc biệt trong phiên làm việc dài
3. **Dùng AGT-023 để debug** — Luật Sắt ngăn lãng phí thời gian
4. **Thiết lập AGT-024** nếu bạn dùng 3+ MCP server
5. **Xem báo cáo phân tích** — `docs/CVF_CLAUDEKIT_SKILLS_ANALYSIS_2026-02-18.md`

---

*Cập nhật lần cuối: 18 tháng 2, 2026 — CVF v1.6.3*
