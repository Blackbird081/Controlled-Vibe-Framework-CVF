# Hướng dẫn: Cài đặt Giao diện Web CVF (v1.6)

**Thời gian:** 15 phút  
**Cấp độ:** Người mới bắt đầu  
**Bạn sẽ làm:** Cài đặt, cấu hình và chạy ứng dụng web CVF v1.6  
**Yêu cầu:** Node.js 18+, npm, ít nhất một API key AI

---

## Giao diện Web CVF là gì?

Agent Platform v1.6 là một **ứng dụng web Next.js** giúp CVF dễ tiếp cận mà không cần viết file Markdown thủ công. Nó cung cấp:

- Thư viện template với các quy trình CVF có sẵn
- AI Chat có governance (chấm điểm chất lượng, phase gate)
- Hệ thống multi-agent (Orchestrator, Architect, Builder, Reviewer)
- Xuất spec với quy tắc governance
- Theo dõi sử dụng (token + chi phí theo nhà cung cấp)

---

## Bước 1: Clone Repository

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
```

---

## Bước 2: Lấy API Key AI

Bạn cần **ít nhất một** trong số này:

| Nhà cung cấp | Lấy Key tại | Tầng miễn phí |
|--------------|-------------|---------------|
| **Google AI (Gemini)** | [aistudio.google.com](https://aistudio.google.com/apikey) | Có (rộng rãi) |
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Trả phí ($5 tối thiểu) |
| **Anthropic (Claude)** | [console.anthropic.com](https://console.anthropic.com/) | Trả phí ($5 tối thiểu) |

> **Khuyến nghị:** Bắt đầu với Google AI (Gemini) — nó có tầng miễn phí rộng rãi nhất.

---

## Bước 3: Cấu hình Môi trường

```bash
# Copy file môi trường mẫu
cp .env.example .env.local
```

Mở `.env.local` trong trình soạn thảo và thêm key của bạn:

```env
# Add at least ONE of these:
GOOGLE_AI_API_KEY=your-google-ai-key-here
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional: Set default provider
DEFAULT_AI_PROVIDER=gemini    # Options: openai, claude, gemini

# Optional: Demo mode (no real AI calls — useful for UI exploration)
# NEXT_PUBLIC_CVF_MOCK_AI=1
```

> **Mẹo:** Nếu bạn chỉ muốn khám phá giao diện mà không gọi AI, đặt `NEXT_PUBLIC_CVF_MOCK_AI=1`.

---

## Bước 4: Cài đặt & Chạy

```bash
# Cài đặt dependencies
npm install

# Khởi động development server
npm run dev
```

Mở **http://localhost:3000** trong trình duyệt.

Bạn sẽ thấy trang chủ CVF Agent Platform với:
- Các thẻ template
- Thanh điều hướng bên
- Nút chuyển ngôn ngữ (EN/VI)
- Nút chuyển chế độ tối

---

## Bước 5: Thử Template Đầu tiên

1. **Nhấp vào một template** (ví dụ: "Quick Draft" hoặc "Build & Review")
2. **Điền form:**
   - Tên dự án
   - Bạn muốn xây dựng gì
   - Các ràng buộc
3. **Chọn chế độ governance:**
   - **Simple** — Chỉ tạo spec (không chấm điểm)
   - **Rules** — Phản hồi AI được chấm 0-100 với accept/reject
   - **Full CVF** — Phase gate với danh sách kiểm tra
4. **Nhấp "Generate"** hoặc "Start"
5. **Xem lại đầu ra AI**
6. **Xuất** spec dưới dạng Markdown (để dùng ở nơi khác)

### Tổng quan Template

| Template | Các Phase | Phù hợp cho |
|----------|-----------|-------------|
| **Quick Draft** | A → C | Prototype nhanh, tác vụ đơn giản |
| **Build & Review** | A → D | Code production có review |
| **Research & Analyze** | A → B | Tìm hiểu chủ đề, lập kế hoạch |
| **Team Collaboration** | Đa phase | Dự án phức tạp với nhiều vai trò |

---

## Bước 6: Thử Agent Chat

1. Nhấp **"Agent Chat"** ở thanh bên
2. Nhập tin nhắn (ví dụ: *"Tôi muốn xây dựng REST API cho ứng dụng todo"*)
3. AI phản hồi với đầu ra được governance CVF quản trị
4. Chú ý **điểm chất lượng** (0-100) bên dưới mỗi phản hồi
5. Bạn có thể:
   - ✅ **Chấp nhận** — Phản hồi đạt tiêu chuẩn chất lượng
   - ❌ **Từ chối** — Phản hồi cần cải thiện
   - 🔄 **Thử lại** — Yêu cầu AI thử lại

### Chế độ Governance trong Chat

| Chế độ | Điều gì xảy ra |
|--------|----------------|
| **Simple** | Chỉ chat, không chấm điểm |
| **Rules** | Mỗi phản hồi được chấm 0-100, bạn accept/reject |
| **Full CVF** | Phase gate: phải hoàn thành danh sách kiểm tra Phase A trước Phase B |

---

## Bước 7: Khám phá Tính năng Chính

### Chế độ Tối
Nhấp biểu tượng mặt trăng/mặt trời ở phần header. Mặc định theo cài đặt hệ thống.

### Chuyển đổi Ngôn ngữ
Chuyển giữa tiếng Anh (EN) và tiếng Việt (VI) qua bộ chọn ngôn ngữ.

### Theo dõi Sử dụng
Agent Chat theo dõi:
- Tổng token đã dùng
- Chi phí theo nhà cung cấp
- Số lượng tương tác

### Tải File lên
Trong Agent Chat, bạn có thể tải file (spec, code, tài liệu) làm ngữ cảnh cho AI.

### Xuất Spec
Sau khi hoàn thành template hoặc phiên chat, nhấp **Xuất** để tải file Markdown với spec + quy tắc governance.

---

## Vấn đề Thường gặp

### "Cannot find module" hoặc npm install thất bại

```bash
# Xóa cache và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi "API key not configured"

Kiểm tra file `.env.local`:
- Đảm bảo tên key khớp chính xác (không lỗi chính tả)
- Không có khoảng trắng quanh `=`
- File tên là `.env.local` (không phải `.env`)

### Cổng 3000 đã được sử dụng

```bash
# Kill process trên cổng 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# macOS/Linux:
lsof -i :3000
kill -9 <pid>

# Hoặc dùng cổng khác:
PORT=3001 npm run dev
```

### Trang trắng / không tải được gì

```bash
# Kiểm tra lỗi build
npm run build

# Nếu thành công, thử chế độ production:
npm start
```

---

## Chạy Kiểm thử

Platform v1.6 có hơn 270 bài test:

```bash
# Chạy unit test (chế độ watch)
npm test

# Chạy test một lần
npm run test:run

# Chạy với báo cáo coverage
npm run test:coverage

# Chạy end-to-end test (Playwright)
npx playwright install    # Chỉ lần đầu
npm run test:e2e
```

---

## Tùy chọn Triển khai

### Vercel (Dễ nhất)

```bash
npm install -g vercel
vercel
# Làm theo hướng dẫn → triển khai trong ~2 phút
```

Thêm biến môi trường trong bảng điều khiển Vercel: Settings → Environment Variables.

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Cấu hình đã có sẵn trong `netlify.toml`.

### Docker

Xem Hướng dẫn Triển khai Hosted để biết các tùy chọn Docker, self-hosted và triển khai nâng cao.

---

## Tham khảo Tech Stack

| Thành phần | Công nghệ | Phiên bản |
|-----------|-----------|-----------|
| Framework | Next.js | 16 |
| UI | React | 19 |
| Ngôn ngữ | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| State | Zustand | 5 |
| Form | React Hook Form + Zod | 7 + 4 |
| Testing | Vitest + Playwright | 4 + 1.51 |
| AI SDK | Gemini, OpenAI, Anthropic | Mới nhất |

---

## Bước tiếp theo

| Tôi muốn... | Đi đến... |
|-------------|-----------|
| Dùng quy trình multi-agent | Hướng dẫn Agent Platform |
| Tạo skill tùy chỉnh | Hướng dẫn Skill Tùy chỉnh |
| Triển khai cho nhóm | Hướng dẫn Triển khai |
| Hiểu chế độ governance | Governance Model |
| Học CVF từ đầu | Hướng dẫn Dự án Đầu tiên |

---

*Cập nhật lần cuối: 15 tháng 2, 2026 | CVF v1.6*
