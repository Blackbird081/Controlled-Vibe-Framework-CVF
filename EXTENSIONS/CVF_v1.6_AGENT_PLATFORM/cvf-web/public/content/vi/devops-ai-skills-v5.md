# Hướng dẫn: Kỹ năng DevOps & AI (AGT-030 → AGT-033)

**Thời gian:** 25 phút  
**Trình độ:** Trung cấp → Nâng cao  
**Yêu cầu:** [Agent Platform đã thiết lập](agent-platform.md), [Kỹ năng App Development v1.6.4 (AGT-025–029)](app-dev-skills-v4.md)  
**Bạn sẽ học:** Cách sử dụng 4 kỹ năng mới hoàn thiện vòng đời phát triển — triển khai cloud, code review, xây dựng MCP server, và xử lý AI đa phương tiện

---

## Tổng quan

CVF v1.6.5 mở rộng từ **29 lên 33 agent tools** — hoàn thiện phạm vi phát triển end-to-end từ thiết kế đến triển khai và tích hợp AI. 4 kỹ năng này lấp đầy các khoảng trống cuối cùng:

| Kỹ năng | Chức năng | Rủi ro | Khi nào sử dụng |
|---------|----------|--------|-----------------|
| 🚀 **AGT-030: Cloud Deployment Strategist** | Chọn nền tảng, Docker, K8s, GitOps | R2 | Khi triển khai ứng dụng lên hạ tầng cloud |
| ✅ **AGT-031: Code Review & Verification Gate** | Phương pháp review, bằng chứng trước tuyên bố | R1 | Khi review code hoặc tuyên bố hoàn thành |
| 🔧 **AGT-032: MCP Server Builder** | Xây dựng MCP servers (Python/TypeScript) | R2 | Khi tạo tích hợp công cụ cho LLMs |
| 🎨 **AGT-033: AI Multimodal Processor** | Xử lý âm thanh/hình ảnh/video/tài liệu | R2 | Khi làm việc với nội dung đa phương tiện qua AI |

---

## Phân bố Rủi ro Cập nhật (33 Kỹ năng)

```
R0 (5 kỹ năng) ── R1 (11 kỹ năng) ── R2 (13 kỹ năng) ── R3 (4 kỹ năng)
An toàn/Tự động   Thấp/Tự động       Trung bình/Giám sát  Cao/Thủ công
```

---

## Kỹ năng 1: Cloud Deployment Strategist (AGT-030)

### Chức năng

Hoàn thiện vòng đời phát triển bằng cách bao phủ **triển khai và hạ tầng** — từ chọn nền tảng phù hợp đến quy trình GitOps và tích hợp CI/CD pipeline.

### Cây Quyết Định Chọn Nền Tảng

```
Cần độ trễ <50ms toàn cầu? ──Có──→ Cloudflare Workers (Edge)
         │Không
Dịch vụ HTTP stateless? ──Có──→ Cloud Run (Container serverless)
         │Không
Cần điều phối container? ──Có──→ Kubernetes (GKE/EKS/AKS)
         │Không
Site tĩnh + API? ──Có──→ Cloudflare Pages + Workers
         │Không
Ứng dụng container đơn giản? ──Có──→ Docker Compose (VPS/VM)
```

### Các Pattern Chính

- **Dockerfile nhiều giai đoạn**: Giai đoạn builder (dependencies + build) → Giai đoạn runtime (image gọn, user không phải root)
- **Chiến lược triển khai K8s**: Rolling Update (mặc định), Blue-Green (không downtime), Canary (xác thực dần dần)
- **GitOps**: ArgoCD cho team lớn, Flux cho single-cluster đơn giản
- **CI/CD Pipeline**: 6 cổng từ lint → test → build → scan → push → deploy

### Ví dụ Prompt Chat

```
"Chọn nền tảng triển khai tốt nhất cho ứng dụng Next.js SaaS với 10K users"
"Tạo Dockerfile nhiều giai đoạn cho API Node.js với bảo mật tốt nhất"
"Thiết lập GitOps với ArgoCD cho môi trường dev/staging/prod"
"Thiết kế CI/CD pipeline với quality gates tích hợp AGT-026 testing"
```

---

## Kỹ năng 2: Code Review & Verification Gate (AGT-031)

### Chức năng

Thực thi **sự nghiêm ngặt kỹ thuật thay vì biểu diễn xã hội** trong code review. Ba thực hành: nhận phản hồi đúng cách, yêu cầu review có cấu trúc, và verification gates yêu cầu bằng chứng trước mọi tuyên bố hoàn thành.

### Luật Sắt
>
> **KHÔNG TUYÊN BỐ HOÀN THÀNH MÀ THIẾU BẰNG CHỨNG XÁC MINH MỚI**

### Ba Thực Hành

| Thực hành | Giao thức | Quy tắc chính |
|-----------|----------|---------------|
| **Nhận Phản hồi** | ĐỌC → HIỂU → XÁC MINH → ĐÁNH GIÁ → PHẢN HỒI → TRIỂN KHAI | Không đồng ý biểu diễn ("Tuyệt vời!") |
| **Yêu cầu Review** | Template có cấu trúc với SHA context | Review SAU MỖI task |
| **Verification Gate** | NHẬN DIỆN → CHẠY → ĐỌC → XÁC MINH → TUYÊN BỐ | Chỉ bằng chứng mới (<5 phút) |

### Pattern Cấm vs Đúng

| ❌ Không bao giờ nói | ✅ Nói thay bằng |
|---------------------|-----------------|
| "Bạn hoàn toàn đúng!" | "Tôi hiểu mối lo. Để tôi xác minh..." |
| "Tests nên pass" | [chạy tests] "Tests pass: 1111/1111, output đính kèm" |
| "Có lẽ xong rồi" | [chạy build + tests] "Build thành công, tất cả tests pass. Bằng chứng: ..." |

### Ví dụ Prompt Chat

```
"Review các thay đổi mới nhất — đây là diff từ commit abc123"
"Áp dụng verification gates trước khi tuyên bố feature hoàn thành"
"Giúp tôi YAGNI-check refactoring này — vấn đề có thực sự tồn tại?"
"Thiết lập checklist code review cho PR này với phân loại mức độ"
```

---

## Kỹ năng 3: MCP Server Builder (AGT-032)

### Chức năng

Phương pháp 4 giai đoạn có cấu trúc để xây dựng **MCP servers chất lượng production**. Tập trung vào thiết kế lấy agent làm trung tâm — tools phục vụ quy trình, không phải bọc API.

### Nguyên tắc Thiết kế Agent-Centric

| ❌ API-Centric | ✅ Agent-Centric |
|---------------|-----------------|
| Bọc mọi endpoint thành tool | Thiết kế tools hướng workflow |
| Trả về JSON thô | Tóm tắt ngắn gọn, dễ đọc |
| Chỉ dùng ID kỹ thuật | Tên dễ đọc (+ ID) |
| "Lỗi xảy ra" | "Rate limited — thử lại sau 30s" |

### Quy trình 4 Giai Đoạn

```
Giai đoạn 1: Nghiên cứu → Giai đoạn 2: Triển khai → Giai đoạn 3: Review → Giai đoạn 4: Đánh giá
Docs giao thức, API         Python/TypeScript       Checklist chất lượng   10 câu hỏi đánh giá
Template thiết kế tool      Hạ tầng dùng chung      Xác minh build         Kiểm thử agent
Lập kế hoạch schema I/O     Tool annotations        Audit type safety      File XML đánh giá
```

### Ví dụ Prompt Chat

```
"Xây dựng MCP server bằng Python (FastMCP) cho GitHub API"
"Thiết kế agent-centric tools cho dịch vụ quản lý dự án"
"Tạo 10 câu hỏi đánh giá để kiểm tra chất lượng MCP server"
"Review MCP server theo quality checklist"
```

---

## Kỹ năng 4: AI Multimodal Processor (AGT-033)

### Chức năng

Xử lý **âm thanh, hình ảnh, video, và tài liệu** thông qua API AI đa phương tiện. Cung cấp lựa chọn model, tối ưu chi phí, và pattern triển khai cho từng loại phương tiện.

### Ma trận Khả năng

| Tác vụ | Âm thanh | Hình ảnh | Video | Tài liệu |
|--------|:--------:|:--------:|:-----:|:---------:|
| Chuyển văn bản | ✅ | — | ✅ | — |
| Tóm tắt | ✅ | ✅ | ✅ | ✅ |
| Hỏi đáp | ✅ | ✅ | ✅ | ✅ |
| Phát hiện vật thể | — | ✅ | ✅ | — |
| Trích xuất văn bản | — | ✅ | — | ✅ |
| Tạo nội dung | TTS | — | — | ✅ |

### Chọn Model

```
Cần độ chính xác cao nhất? ──→ gemini-2.5-pro ($3/1M tokens)
Nhạy cảm chi phí? ──→ gemini-2.5-flash-lite ($0.50/1M tokens)
Tạo hình ảnh? ──→ gemini-2.5-flash-image
Tác vụ tiêu chuẩn ──→ gemini-2.5-flash ($1/1M tokens, cân bằng tốt nhất)
```

### Mẹo Tối Ưu Chi Phí

- Dùng File API cho file >20MB (tránh upload lặp lại)
- Nén media trước khi upload
- Xử lý phân đoạn cụ thể, không phải toàn bộ video dài
- Dùng format `concise` mặc định
- Cache phản hồi cho truy vấn lặp lại

### Ví dụ Prompt Chat

```
"Chuyển văn bản podcast 2 giờ với timestamps và ID người nói"
"Trích xuất tất cả bảng từ PDF 50 trang thành JSON có cấu trúc"
"Phân tích video demo sản phẩm theo từng cảnh với các khoảnh khắc chính"
"Tạo hình ảnh mockup giao diện dashboard từ mô tả này"
```

---

## Vòng đời Phát triển Hoàn chỉnh

Với v1.6.5, CVF giờ bao phủ **toàn bộ vòng đời phát triển ứng dụng**:

```
Giai đoạn Thiết kế:
  AGT-025 (API Architecture) → AGT-028 (Database Schema) → AGT-029 (Frontend Components)
       │
Giai đoạn Bảo mật:
  AGT-027 (Security & Auth Guard)
       │
Giai đoạn Triển khai:
  AGT-032 (MCP Server Builder) → AGT-033 (AI Multimodal Processor)
       │
Giai đoạn Chất lượng:
  AGT-026 (Full-Stack Testing) → AGT-031 (Code Review & Verification Gate)
       │
Giai đoạn Deploy:
  AGT-030 (Cloud Deployment Strategist)
```

---

## Tiếp theo là gì?

- Khám phá đặc tả đầy đủ `.gov.md` trong [Agent Skills Registry](../../../governance/skill-library/registry/agent-skills/INDEX.md)
- Kết hợp kỹ năng design (AGT-025→029) với deployment (AGT-030) cho quy trình end-to-end
- Dùng [AGT-019 Skill Progressive Loader](using-new-skills-v2.md) để chỉ tải những gì bạn cần
