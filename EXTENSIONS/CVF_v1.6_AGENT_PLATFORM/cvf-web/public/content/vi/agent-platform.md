# Hướng dẫn: Quy trình Multi-Agent (v1.6 Agent Platform)

**Thời gian:** 20 phút  
**Cấp độ:** Trung cấp  
**Yêu cầu trước:** Đã cài đặt và chạy Web UI  
**Bạn sẽ học được:** Cách sử dụng quy trình multi-agent với các vai trò AI chuyên biệt

---

## Multi-Agent trong CVF là gì?

Thay vì để một AI làm mọi thứ, CVF v1.6 phân chia công việc cho **4 agent chuyên biệt**, mỗi agent tương ứng với một phase CVF:

| Agent | Vai trò | Phase CVF | Chuyên môn |
|-------|---------|-----------|------------|
| 🎯 **Orchestrator** | Điều phối & phân công | Phase A (Khám phá) | Hiểu ý định, phân tách nhiệm vụ |
| 📐 **Architect** | Thiết kế giải pháp | Phase B (Thiết kế) | Kiến trúc, thiết kế thành phần, đánh đổi |
| 🔨 **Builder** | Viết code | Phase C (Xây dựng) | Triển khai, tuân theo spec chính xác |
| 🔍 **Reviewer** | Đảm bảo chất lượng | Phase D (Đánh giá) | Kiểm thử, tìm lỗi, kiểm tra tuân thủ |

### Tại sao dùng Multi-Agent?

Mỗi mô hình AI đều có thế mạnh riêng:

| Mô hình | Giỏi nhất về | Khuyến nghị cho |
|---------|-------------|----------------|
| **Gemini** | Suy luận, phân tích | Orchestrator |
| **Claude** | Thiết kế, tính kỹ lưỡng | Architect, Reviewer |
| **GPT-4** | Sinh code nhanh | Builder |

Chế độ multi-agent cho phép bạn dùng đúng mô hình cho đúng công việc.

---

## Bước 1: Mở chế độ Multi-Agent

1. Mở CVF Web UI (<http://localhost:3000>)
2. Điều hướng đến **Agent Chat**
3. Nhấn vào nút **Multi-Agent** (thường nằm trong phần cài đặt chat)
4. Bạn sẽ thấy 4 vai trò agent xuất hiện

---

## Bước 2: Cấu hình Agent

### Chế độ một AI (Đơn giản)

Tất cả 4 agent sử dụng cùng một nhà cung cấp AI. Phù hợp cho người mới bắt đầu.

**Cài đặt:**

- Nhà cung cấp: Chọn một (Gemini/OpenAI/Anthropic)
- Tất cả agent kế thừa cùng nhà cung cấp

### Chế độ nhiều AI (Nâng cao)

Mỗi agent sử dụng một nhà cung cấp AI khác nhau.

**Cấu hình khuyến nghị:**

| Agent | Nhà cung cấp | Mô hình | Lý do |
|-------|-------------|---------|-------|
| 🎯 Orchestrator | Gemini | gemini-pro | Suy luận mạnh |
| 📐 Architect | Claude | claude-3.5-sonnet | Thiết kế xuất sắc |
| 🔨 Builder | OpenAI | gpt-4o | Sinh code nhanh |
| 🔍 Reviewer | Claude | claude-3.5-sonnet | Đánh giá kỹ lưỡng |

> **Lưu ý:** Bạn cần API key cho mỗi nhà cung cấp muốn sử dụng. Xem hướng dẫn Cài đặt Web UI.

---

## Bước 3: Chạy quy trình Multi-Agent

### Ví dụ: Xây dựng Dashboard thời tiết

**1. Bắt đầu với Orchestrator (Phase A)**

Nhập ý định của bạn:

```
I want to build a weather dashboard web app. 
It should show current weather for a city and a 5-day forecast.
Use a free weather API. Keep it simple — just HTML/CSS/JS, no frameworks.
```

**Orchestrator** sẽ:

- Làm rõ ý định của bạn
- Xác định phạm vi (trong/ngoài)
- Phân chia dự án thành các nhiệm vụ
- Nhận diện ràng buộc
- Tạo bản tóm tắt có cấu trúc cho Architect

**Ví dụ kết quả từ Orchestrator:**

```
## Discovery Summary

### Intent
Build a single-page weather dashboard showing current conditions 
and 5-day forecast for a searched city.

### Scope
IN: Current weather, 5-day forecast, city search, responsive layout
OUT: User accounts, favorites, weather alerts, PWA

### Tasks
1. Design HTML structure + API integration plan
2. Build HTML/CSS layout
3. Implement JavaScript API calls + rendering
4. Review and test edge cases

### Constraints
- No frameworks (vanilla HTML/CSS/JS)
- Free API (OpenWeatherMap)
- Single page
```

**2. Chuyển giao cho Architect (Phase B)**

Architect nhận bản tóm tắt từ Orchestrator và thiết kế giải pháp:

```
## Architecture Design

### Components
1. index.html — Single page with search bar, current weather card, forecast cards
2. style.css — Responsive grid, weather icons, dark/light theme
3. app.js — API calls, DOM manipulation, error handling

### API Integration
- OpenWeatherMap API (free tier)
- Endpoints: /weather (current), /forecast (5-day)
- API key stored in app.js (for demo) or .env

### Data Flow
User types city → app.js calls API → parse JSON → update DOM

### UI Layout
┌──────────────────────────────────┐
│  🔍 Search: [City name] [Search] │
├──────────────────────────────────┤
│  Current Weather                  │
│  🌤️ 25°C  Partly Cloudy         │
│  Humidity: 60%  Wind: 12 km/h    │
├──────────────────────────────────┤
│  5-Day Forecast                   │
│  Mon | Tue | Wed | Thu | Fri      │
│  22° | 24° | 20° | 18° | 23°     │
└──────────────────────────────────┘

### Error Handling
- City not found → "City not found. Try again."
- API limit → "API limit reached. Try later."
- No internet → "Check your connection."
```

**3. Builder thực thi (Phase C)**

Builder nhận bản thiết kế và viết code:

- Tạo `index.html` với cấu trúc ngữ nghĩa
- Tạo `style.css` với grid responsive
- Tạo `app.js` với các lệnh gọi API và xử lý lỗi
- Tuân theo thiết kế chính xác — không "cải tiến" tự ý

**4. Reviewer kiểm tra chất lượng (Phase D)**

Reviewer đánh giá code của Builder so với ý định ban đầu:

```
## Review Report

### Compliance Check
- [x] Shows current weather ✅
- [x] Shows 5-day forecast ✅  
- [x] City search works ✅
- [x] No frameworks used ✅
- [x] Responsive layout ✅
- [x] Error handling for bad city ✅
- [x] Error handling for API limit ✅

### Issues Found
1. ⚠️ API key hardcoded in app.js (acceptable for demo, 
   should use env variable in production)
2. ⚠️ No loading indicator while fetching (minor UX issue)

### Quality Score: 85/100

### Verdict: ✅ ACCEPT (with minor notes)
```

---

## Bước 4: Hiểu về chuyển giao giữa các Agent

### Chuyển giao tự động

Trong chế độ governance CVF đầy đủ, các agent tự động chuyển giao:

```
Orchestrator → (Phase A hoàn thành?) → Architect → (Phase B hoàn thành?) → Builder → (Phase C hoàn thành?) → Reviewer
```

Mỗi lần chuyển giao yêu cầu checklist của phase trước phải được hoàn thành.

### Chuyển giao thủ công

Trong chế độ Simple hoặc Rules, bạn kiểm soát thời điểm chuyển agent. Nhấn vào agent bạn muốn kích hoạt.

### Quay lại

Nếu Reviewer phát hiện vấn đề, quy trình có thể quay lại:

- Vấn đề nhỏ → Quay về **Builder** (thực thi lại)
- Vấn đề thiết kế → Quay về **Architect** (thiết kế lại)
- Vấn đề ý định → Quay về **Orchestrator** (làm rõ lại)

---

## Bước 5: Phase Gate trong Multi-Agent

Khi sử dụng **chế độ governance CVF đầy đủ**, phase gate đảm bảo chất lượng:

### Cổng Phase A → B (Orchestrator → Architect)

```
Checklist:
- [ ] Intent clearly stated
- [ ] Scope defined (in/out)
- [ ] Constraints identified
- [ ] Success criteria defined
```

Tất cả các mục phải được đánh dấu trước khi Architect bắt đầu.

### Cổng Phase B → C (Architect → Builder)

```
Checklist:
- [ ] Architecture components defined
- [ ] Data flow described
- [ ] Interface/API contracts specified
- [ ] Error handling strategy defined
- [ ] Build is feasible within constraints
```

### Cổng Phase C → D (Builder → Reviewer)

```
Checklist:
- [ ] All components implemented
- [ ] No pending build actions
- [ ] Output is testable
- [ ] No scope expansion from design
```

---

## Mức độ rủi ro trong Multi-Agent

Mỗi chế độ agent có mức rủi ro vốn có:

| Chế độ | Rủi ro | Lý do |
|--------|--------|-------|
| Chỉ dùng template | **R0** | Thụ động, không thực thi AI |
| Chat một agent | **R1** | Có kiểm soát, ghi log, giới hạn |
| Quy trình multi-agent | **R2** | Có thể chuỗi hành động, cần phê duyệt |

Trong thực tế:

- **R0-R1:** Agent có thể tự động tiến hành
- **R2:** Bạn sẽ thấy yêu cầu phê duyệt trước mỗi lần chuyển phase
- **R3:** Yêu cầu con người tham gia mọi hành động (không phổ biến với web UI)

---

## Mẹo sử dụng quy trình Multi-Agent hiệu quả

### 1. Cụ thể với Orchestrator

Chất lượng toàn bộ quy trình phụ thuộc vào Phase A. Cung cấp cho Orchestrator:

- Ý định rõ ràng (cái gì, không phải cách nào)
- Ràng buộc cụ thể
- Tiêu chí thành công/thất bại

### 2. Xem lại thiết kế của Architect trước khi xây dựng

Đừng vội vàng chuyển sang Phase C. Thiết kế tệ = code tệ. Dành 2 phút xem lại kết quả của Architect.

### 3. Để Builder tuân theo Spec

Đừng can thiệp trong Phase C trừ khi có lỗi rõ ràng. Builder nên làm theo thiết kế của Architect, không tự ý sáng tạo.

### 4. Sử dụng phản hồi của Reviewer

Reviewer không chỉ đánh dấu ô — nó tìm các trường hợp biên. Chú ý đến cảnh báo, không chỉ đạt/không đạt.

### 5. Theo dõi Token sử dụng

Multi-agent sử dụng token nhiều gấp 3–4 lần so với single-agent. Theo dõi bộ đếm sử dụng trong UI.

---

## Tiếp theo

| Tôi muốn... | Xem... |
|-------------|--------|
| Tạo template skill tái sử dụng | Hướng dẫn Custom Skills |
| Hiểu sâu hơn về phase gate | Quy trình 4 Phase |
| Tìm hiểu về mức độ rủi ro | Mô hình Rủi ro |
| Triển khai web UI cho nhóm | Hướng dẫn Triển khai |
| Thiết lập governance cho nhóm | Hướng dẫn Thiết lập Nhóm |

---

*Cập nhật lần cuối: 15 tháng 2 năm 2026 | CVF v1.6*
