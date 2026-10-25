# CVF Version Picker — Chọn Phiên Bản Phù Hợp

> **🎯 Mục tiêu:** Giúp bạn chọn đúng CVF version trong 2 phút

---

## 🚦 Cây Quyết Định Nhanh

```
                    Bắt đầu ở đây
                          │
                          ▼
              ┌───────────────────────┐
              │ Bạn muốn gì với CVF?  │
              └───────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌───────────┐
    │Học CVF   │    │Xây dựng  │    │Triển khai │
    │Khái niệm│    │ngay      │    │Production │
    └──────────┘    │(Web UI)  │    └───────────┘
         │          └──────────┘          │
         ▼                │               ▼
    ┌─────────┐      ┌─────────┐     ┌──────────┐
    │  v1.0   │      │  v1.6   │     │v1.1+v1.3 │
    │  Core   │      │Agent UI │     │SDK+Tools │
    └─────────┘      └─────────┘     └──────────┘
```

---

## 📊 Bảng So Sánh Phiên Bản

| Tính năng | v1.0 | v1.1 | v1.2 | v1.3 | v1.5 | v1.6 |
|-----------|:----:|:----:|:----:|:----:|:----:|:----:|
| **Quy trình 4 Phase** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Governance cơ bản** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Input/Output Specs** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Agent Archetypes** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Skill Registry** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Risk Model (R0-R3)** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Python SDK** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **CLI Tools** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **CI/CD Templates** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Web UI** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **AI Agent Chat** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Multi-Agent** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Governance Toolkit** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Self-UAT** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 Chọn Theo Nhu Cầu Của Bạn

### Kịch bản 1: Developer cá nhân, Học Lần Đầu

**Hồ sơ của bạn:**

- 👤 Làm việc 1 mình
- 🆕 Mới dùng AI coding
- 📚 Muốn hiểu khái niệm trước

**Khuyến nghị:** **v1.0 (Core)**

**Tại sao:**

- ✅ Đơn giản nhất
- ✅ Tập trung vào nguyên tắc
- ✅ Không cần setup gì
- ✅ Đọc docs + follow checklist là được

**Bắt đầu:**

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/v1.0
cat CVF_MANIFESTO.md
```

**Bước tiếp theo:**

1. Đọc CVF_MANIFESTO.md
2. Theo dõi Quy trình 4 Phase
3. Sử dụng Checklists
4. Xây dựng 1-2 dự án nhỏ
5. Sau đó nâng cấp lên v1.1 nếu cần

---

### Kịch bản 2: Muốn Xây Dựng Ngay, Có Web UI

**Hồ sơ của bạn:**

- 🚀 Muốn xây dựng ngay, ít đọc docs
- 🖥️ Thích UI hơn CLI
- 🤖 Muốn chat với AI trong CVF
- 📋 Cần templates có sẵn

**Khuyến nghị:** **v1.6 (Agent Platform)**

**Tại sao:**

- ✅ Web UI đầy đủ tính năng
- ✅ 50 templates có sẵn
- ✅ Chat trực tiếp với AI
- ✅ Multi-agent workflow
- ✅ Self-UAT testing
- ✅ Governance toolkit

**Bắt đầu:**

```bash
npx create-cvf-app my-project
cd my-project
npm start
# Hoặc dùng script quick-start.sh
```

**Phù hợp cho:**

- MVP, prototype
- Học qua thực hành
- Developer cá nhân hoặc team nhỏ (2-3 người)
- Người dùng không chuyên kỹ thuật

---

### Kịch bản 3: Team nhỏ (2-5 người)

**Hồ sơ của bạn:**

- 👥 Team 2-5 người
- 🔄 Cần collaboration
- 📝 Cần audit trails
- ✅ Cần approval workflows

**Khuyến nghị:** **v1.1 + v1.6**

**Tại sao:**

- ✅ v1.1: Input/output contracts cho team
- ✅ v1.1: Agent archetypes (vai trò)
- ✅ v1.1: Execution spine (kiểm toán)
- ✅ v1.6: Web UI cho collaboration

**Bắt đầu:**

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF

# Cài đặt v1.6 Web UI
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install && npm run dev

# Nghiên cứu kiến trúc v1.1
cd ../../../v1.1
cat QUICK_START.md
```

**Vai trò trong team:**

- 🎯 Owner: Phase A (yêu cầu)
- 🎨 Architect: Phase B (thiết kế)
- 🤖 AI/Developer: Phase C (xây dựng)
- ✅ Reviewer: Phase D (kiểm tra)

---

### Kịch bản 4: Production/Doanh nghiệp

**Hồ sơ của bạn:**

- 🏢 Team >5 người hoặc doanh nghiệp
- 🔐 Cần governance nghiêm ngặt
- 🔄 Cần tích hợp CI/CD
- 📊 Cần metrics & báo cáo
- ⚖️ Cần compliance (audit logs)

**Khuyến nghị:** **v1.1 + v1.2 + v1.3 + v1.6**

**Tại sao:**

- ✅ v1.1: Contracts & execution spine
- ✅ v1.2: Skill governance, risk model
- ✅ v1.3: SDK, CLI, CI/CD templates
- ✅ v1.6: UI + governance toolkit

**Bắt đầu:**

```bash
# 1. Cài đặt full stack
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF

# 2. Cấu hình governance
cd governance/toolkit
# Chỉnh sửa policies, risk levels, authority matrix

# 3. Cài đặt SDK cho tự động hóa
cd ../../EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/sdk
pip3 install -e .

# 4. Cài đặt Web UI
cd ../../../EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
cp .env.example .env
# Cấu hình .env cho production

# 5. Tích hợp CI/CD
cd ../../../EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/ci-cd
# Sao chép GitHub Actions / GitLab CI templates
```

**Bắt buộc có:**

- [ ] Đã định nghĩa governance policies
- [ ] Risk levels cho từng phase
- [ ] Approval workflows
- [ ] Tích hợp CI/CD
- [ ] Metrics dashboard

---

### Kịch bản 5: Nâng cao — Tùy chỉnh/Đóng góp

**Hồ sơ của bạn:**

- 🛠️ Muốn mở rộng CVF
- 🧩 Xây dựng custom skills
- 🔌 Tích hợp với công cụ khác
- 💻 Quen thuộc với code

**Khuyến nghị:** **Full Stack (tất cả phiên bản)**

**Lộ trình học:**

1. **v1.0** - Hiểu nguyên tắc cốt lõi
2. **v1.1** - Học kiến trúc
3. **v1.2** - Hệ thống Skill bên trong
4. **v1.3** - Kiến trúc SDK
5. **v1.6** - Kiến trúc nền tảng

**Tài nguyên:**

- Hướng dẫn Developer
- Skill Spec
- API Reference
- Hướng dẫn đóng góp

---

## 🔄 Lộ Trình Nâng Cấp

### Từ v1.0 → v1.1

**Khi nào nâng cấp:**

- Team tăng từ 1 → 2+ người
- Cần input/output specs
- Cần audit trails

**Cách thực hiện:**

1. Giữ quy trình v1.0
2. Thêm contracts
3. Định nghĩa agent archetypes
4. Sử dụng execution spine

**Công sức:** 2-4 giờ

---

### Từ v1.1 → v1.6

**Khi nào nâng cấp:**

- Team đã quen với v1.1
- Muốn có Web UI
- Muốn tính năng AI agent

**Cách thực hiện:**

1. Giữ kiến trúc v1.1
2. Thêm v1.6 Web UI
3. Ánh xạ workflows vào templates
4. Đào tạo team sử dụng UI

**Công sức:** 1 ngày

---

### Từ Thủ công → Tự động (v1.3)

**Khi nào:**

- Team >3 người
- Các tác vụ lặp đi lặp lại
- Cần CI/CD

**Cách thực hiện:**

1. Cài đặt Python SDK
2. Viết script tự động hóa
3. Thêm CI/CD templates
4. Tích hợp với công cụ hiện có

**Công sức:** 2-3 ngày

---

## 📏 Hướng Dẫn Chọn Nhanh

### Theo Quy Mô Team

| Quy mô team | Phiên bản khuyến nghị |
|-------------|----------------------|
| 1 người | v1.0 hoặc v1.6 |
| 2-3 người | v1.1 + v1.6 |
| 4-10 người | v1.1 + v1.3 + v1.6 |
| 10+ người | Full stack + tùy chỉnh |

### Theo Độ Phức Tạp Dự Án

| Loại dự án | Phiên bản khuyến nghị |
|------------|----------------------|
| Học tập/POC | v1.0 |
| Dự án cá nhân | v1.6 |
| Startup MVP | v1.6 |
| Production SaaS | v1.1 + v1.3 + v1.6 |
| Doanh nghiệp | Full stack |

### Theo Thời Gian Đầu Tư

| Thời gian có | Bắt đầu với |
|--------------|-------------|
| 5 phút | v1.6 (Web UI) |
| 30 phút | v1.0 (Core docs) |
| 2 giờ | v1.1 (Kiến trúc) |
| 1 ngày | Cài đặt đầy đủ |

---

## 🎓 Lộ Trình Học Theo Phiên Bản

### Lộ trình v1.0 (2-3 giờ)

1. Đọc Manifesto - 15 phút
2. Hiểu 4 Phases - 30 phút
3. Nghiên cứu Governance - 30 phút
4. Thực hành với 1 dự án nhỏ - 60 phút

**Kết quả:** Bạn hiểu các nguyên tắc CVF

---

### Lộ trình v1.1 (4-6 giờ)

1. Xem lại v1.0 trước
2. Đọc QUICK_START - 20 phút
3. Nghiên cứu Kiến trúc - 60 phút
4. Tìm hiểu Agents - 30 phút
5. Thực hành Execution Spine - 90 phút
6. Xây dựng 1 dự án team - 120 phút

**Kết quả:** Bạn có thể vận hành dự án team có kiểm soát

---

### Lộ trình v1.6 (1-2 giờ)

1. Chạy Web UI - 5 phút
2. Thử 3-5 templates - 30 phút
3. Khám phá agent chat - 20 phút
4. Thử Self-UAT - 15 phút
5. Xây dựng 1 thứ thật - 60 phút

**Kết quả:** Bạn có thể xây dựng với CVF UI

---

## ⚖️ Tóm Tắt Ưu & Nhược Điểm

### v1.0 (Core)

**Ưu điểm:**

- ✅ Đơn giản, dễ học
- ✅ Không phụ thuộc
- ✅ Khái niệm thuần túy
- ✅ Tuyệt vời để học

**Nhược điểm:**

- ❌ Mọi thứ đều thủ công
- ❌ Không có công cụ
- ❌ Hạn chế cho team

**Phù hợp nhất:** Người học cá nhân

---

### v1.1 (Mở rộng)

**Ưu điểm:**

- ✅ Sẵn sàng cho team
- ✅ Contracts & specs
- ✅ Audit trails
- ✅ Agent archetypes

**Nhược điểm:**

- ❌ Phức tạp hơn
- ❌ Vẫn chủ yếu thủ công
- ❌ Không có UI

**Phù hợp nhất:** Team nhỏ

---

### v1.6 (Nền tảng)

**Ưu điểm:**

- ✅ Web UI (dễ dùng)
- ✅ AI chat tích hợp
- ✅ Templates có sẵn
- ✅ Multi-agent
- ✅ Governance toolkit

**Nhược điểm:**

- ❌ Cần cài đặt
- ❌ Cần Node.js
- ❌ Nặng hơn core

**Phù hợp nhất:** Xây dựng nhanh

---

## 🚀 Khuyến Nghị Nhanh

**Chỉ cần nói cho tôi biết dùng gì!**

| Nếu bạn là... | Dùng cái này |
|----------------|-------------|
| Người mới hoàn toàn | **v1.6** (Web UI) |
| Muốn học sâu | **v1.0** (Core) |
| Developer cá nhân | **v1.6** |
| Team 2-5 người | **v1.1 + v1.6** |
| Team doanh nghiệp | **Full stack** |
| Muốn đóng góp | **Full stack** |
| Đang gấp | **v1.6** |
| Thích đọc tài liệu | **v1.0** |

---

## ❓ Vẫn Phân Vân?

**Trả lời 3 câu hỏi này:**

1. **Bạn muốn có giao diện UI?**
   - Có → v1.6
   - Không → v1.0 hoặc v1.1

2. **Bạn làm việc với team?**
   - Có → v1.1 + v1.6
   - Không → v1.0 hoặc v1.6

3. **Cần cấp production?**
   - Có → Full stack
   - Không → v1.6

**Vẫn chưa chắc?**

- 💬 Hỏi trên Discord
- 📧 Gửi email cho chúng tôi
- 🐛 Mở issue trên GitHub

---

## 📋 Checklist Trước Khi Chọn

Trước khi quyết định, hãy tự hỏi:

- [ ] Đã đọc Core Philosophy chưa?
- [ ] Đã hiểu Quy trình 4 Phase chưa?
- [ ] Đã biết quy mô team & độ phức tạp dự án chưa?
- [ ] Có thời gian để cài đặt không?
- [ ] Có cần governance không?
- [ ] Có ngân sách cho hạ tầng không?

**Nếu tất cả là có → Dùng Full Stack**

**Nếu đa số là không → Bắt đầu với v1.6**

---

**Nhớ:** Bạn có thể bắt đầu đơn giản và nâng cấp sau!
