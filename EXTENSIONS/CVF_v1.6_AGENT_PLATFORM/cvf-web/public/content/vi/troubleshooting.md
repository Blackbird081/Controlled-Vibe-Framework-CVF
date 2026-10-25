# Hướng dẫn Khắc phục sự cố CVF

> **🎯 Sửa nhanh các vấn đề CVF thường gặp**

---

## 📋 Mục lục

- [Vấn đề cài đặt](#-vấn-đề-cài-đặt)
- [Vấn đề Web UI](#️-vấn-đề-web-ui)
- [Nhầm lẫn phiên bản](#-nhầm-lẫn-phiên-bản)
- [Lỗi Skill](#-lỗi-skill)
- [Vấn đề Governance](#-vấn-đề-governance)
- [Vấn đề hiệu suất](#-vấn-đề-hiệu-suất)
- [Thông báo lỗi thường gặp](#️-thông-báo-lỗi-thường-gặp)

---

## 🔧 Vấn đề cài đặt

### Vấn đề: `npm install` thất bại

**Triệu chứng:**

```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
```

**Giải pháp:**

1. **Kiểm tra phiên bản Node.js:**

   ```bash
   node -v
   # Should be 18.0.0 or higher
   ```

   Nếu không đúng, cài đặt Node 18+: <https://nodejs.org/>

2. **Xóa cache npm:**

   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Sử dụng legacy peer deps (nếu vẫn lỗi):**

   ```bash
   npm install --legacy-peer-deps
   ```

---

### Vấn đề: Lỗi từ chối quyền truy cập

**Triệu chứng:**

```
EACCES: permission denied
```

**Giải pháp:**

1. **Không sử dụng sudo với npm** (nguy hiểm)

2. **Sửa quyền npm:**

   ```bash
   # Option A: Use nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   
   # Option B: Change npm prefix
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

---

### Vấn đề: Cổng 3000 đã được sử dụng

**Triệu chứng:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Giải pháp:**

1. **Tìm và tắt tiến trình trên cổng 3000:**

   ```bash
   # On Mac/Linux
   lsof -ti:3000 | xargs kill -9
   
   # On Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Hoặc sử dụng cổng khác:**

   ```bash
   # Edit .env file
   PORT=3001
   
   # Or run with custom port
   PORT=3001 npm run dev
   ```

---

### Vấn đề: Git clone thất bại

**Triệu chứng:**

```
fatal: repository not found
fatal: could not read Username
```

**Giải pháp:**

1. **Kiểm tra URL:**

   ```bash
   # Correct URL
   git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
   ```

2. **Kiểm tra mạng/tường lửa:**
   - Thử mạng khác
   - Kiểm tra cài đặt tường lửa doanh nghiệp
   - Sử dụng VPN nếu cần

3. **Sử dụng SSH thay thế:**

   ```bash
   git clone git@github.com:Blackbird081/Controlled-Vibe-Framework-CVF.git
   ```

---

## 🖥️ Vấn đề Web UI

### Vấn đề: Web UI hiển thị trang trắng

**Triệu chứng:**

- Trình duyệt hiển thị màn hình trắng
- Console hiển thị lỗi React

**Giải pháp:**

1. **Kiểm tra quá trình build:**

   ```bash
   npm run build
   # Check for errors
   ```

2. **Xóa cache trình duyệt:**
   - Hard refresh: `Ctrl+Shift+R` (Win) hoặc `Cmd+Shift+R` (Mac)
   - Hoặc xóa cache trong DevTools

3. **Kiểm tra console để xem lỗi:**
   - Mở DevTools (F12)
   - Xem tab Console
   - Chụp màn hình và báo cáo vấn đề

4. **Xác minh file .env:**

   ```bash
   # .env should have:
   NODE_ENV=development
   PORT=3000
   ```

---

### Vấn đề: Template không tải được

**Triệu chứng:**

- Danh sách template trống
- Lỗi "Failed to load templates"

**Giải pháp:**

1. **Kiểm tra đường dẫn file:**

   ```bash
   # Templates should be in:
   EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/
   ```

2. **Xác minh định dạng JSON:**
   - Template phải là JSON hợp lệ
   - Không có dấu phẩy thừa
   - Escape đúng cách

3. **Kiểm tra quyền truy cập:**

   ```bash
   # Make sure files are readable
   chmod -R 755 EXTENSIONS/
   ```

---

### Vấn đề: Nhà cung cấp AI không hoạt động

**Triệu chứng:**

- Lỗi "API key invalid"
- Phản hồi không trả về

**Giải pháp:**

1. **Thêm API key vào .env:**

   ```bash
   # .env file
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_API_KEY=...
   ```

2. **Xác minh định dạng API key:**
   - OpenAI: bắt đầu bằng `sk-`
   - Anthropic: bắt đầu bằng `sk-ant-`
   - Google: chuỗi ký tự chữ và số

3. **Kiểm tra hạn mức API:**
   - Đăng nhập vào bảng điều khiển nhà cung cấp
   - Kiểm tra giới hạn sử dụng
   - Thêm thanh toán nếu cần

4. **Kiểm tra API key riêng biệt:**

   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

---

### Vấn đề: Chế độ tối không hoạt động

**Triệu chứng:**

- Nút chuyển đổi giao diện không chuyển
- Bị kẹt ở chế độ sáng/tối

**Giải pháp:**

1. **Xóa localStorage:**

   ```javascript
   // In browser console
   localStorage.clear()
   location.reload()
   ```

2. **Kiểm tra cài đặt hệ thống:**
   - Web UI tôn trọng giao diện hệ thống
   - Thay đổi cài đặt giao diện của hệ điều hành

---

## 🔀 Nhầm lẫn phiên bản

### Vấn đề: Không chắc nên dùng phiên bản nào

**Giải pháp:**

1. **Sử dụng cây quyết định:** Xem Bộ chọn Phiên bản

2. **Khuyến nghị nhanh:**
   - Cá nhân mới bắt đầu: **v1.6**
   - Nhóm: **v1.1 + v1.6**
   - Doanh nghiệp: **Toàn bộ stack**

3. **Bắt đầu đơn giản:**
   - Bạn luôn có thể nâng cấp sau
   - v1.6 bao gồm hầu hết tính năng

---

### Vấn đề: "Tính năng này yêu cầu v1.X"

**Giải pháp:**

1. **Kiểm tra phiên bản hiện tại:**

   ```bash
   cat package.json | grep version
   ```

2. **Nâng cấp lên phiên bản cần thiết:**

   ```bash
   git pull origin main
   cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
   npm install
   ```

3. **Hoặc sử dụng tính năng khác:**
   - Xem bảng so sánh tính năng

---

## 🧩 Lỗi Skill

### Vấn đề: Xác thực skill thất bại

**Triệu chứng:**

```
❌ Skill validation failed
Missing required field: risk_level
```

**Giải pháp:**

1. **Kiểm tra định dạng skill:**

   ```yaml
   # Required fields
   id: my-skill-v1
   name: My Skill
   version: 1.0.0
   risk_level: R1  # Must be R0, R1, R2, or R3
   category: domain_name
   ```

2. **Sử dụng công cụ xác thực:**

   ```bash
   cd tools/skill-validation
   python3 validate_skills.py path/to/skill.md
   ```

3. **Xem skill mẫu:**
   - Kiểm tra thư mục skill library
   - Sao chép cấu trúc từ skill đang hoạt động

---

### Vấn đề: "Không tìm thấy Skill"

**Giải pháp:**

1. **Kiểm tra vị trí file:**

   ```bash
   # Skills should be in:
   EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/[category]/
   ```

2. **Kiểm tra quy tắc đặt tên file:**
   - Phải kết thúc bằng `.skill.md`
   - Ví dụ: `email-classifier.skill.md`

3. **Xác minh Skill ID:**
   - ID trong file phải khớp với tên file
   - Sử dụng kebab-case

---

### Vấn đề: "Mức rủi ro vượt giới hạn phase"

**Triệu chứng:**

```
⚠️ Warning: Risk level R3 not allowed in Phase A
```

**Giải pháp:**

1. **Hiểu mô hình rủi ro:**
   - Phase A (Khám phá): chỉ R0-R1
   - Phase B (Thiết kế): R0-R2
   - Phase C (Xây dựng): R0-R3
   - Phase D (Đánh giá): R0-R1

2. **Giảm mức rủi ro hoặc đổi phase:**

   ```yaml
   # Either:
   risk_level: R1  # Lower risk
   
   # Or use in different phase
   # Move from Phase A to Phase C
   ```

3. **Xem hướng dẫn rủi ro:**
   - Tham khảo tài liệu Mô hình Governance

---

## 🔐 Vấn đề Governance

### Vấn đề: Phase gate chặn tiến trình

**Triệu chứng:**

- Không thể tiến sang phase tiếp theo
- Checklist chưa hoàn thành

**Giải pháp:**

1. **Xem lại các mục checklist:**

   ```bash
   # Check phase gate requirements
   governance/toolkit/01_BOOTSTRAP/phase-gates.md
   ```

2. **Hoàn thành các mục còn thiếu:**
   - Mỗi phase có yêu cầu cụ thể
   - Phải đánh dấu hoàn thành trước khi tiếp tục

3. **Ghi đè (nếu được phân quyền):**

   ```yaml
   # In governance config
   allow_phase_skip: true  # Use with caution!
   ```

---

### Vấn đề: Xung đột ma trận quyền hạn

**Triệu chứng:**

- "User not authorized for this role"
- Lỗi từ chối quyền truy cập

**Giải pháp:**

1. **Kiểm tra phân quyền vai trò:**

   ```yaml
   # governance/toolkit/03_CONTROL/authority-matrix.yaml
   roles:
     - user: alice@example.com
       phase: A
       role: Owner
   ```

2. **Xác minh vai trò cho phase:**
   - Phase A: chỉ Owner
   - Phase B: chỉ Architect
   - Phase C: Executor (AI)
   - Phase D: chỉ Reviewer

3. **Yêu cầu thay đổi vai trò:**
   - Liên hệ quản trị viên dự án
   - Cập nhật ma trận quyền hạn

---

## ⚡ Vấn đề hiệu suất

### Vấn đề: Web UI chậm

**Giải pháp:**

1. **Kiểm tra tài nguyên hệ thống:**

   ```bash
   # Make sure you have enough RAM/CPU
   top  # or Activity Monitor on Mac
   ```

2. **Đóng các tab/ứng dụng không cần thiết**

3. **Sử dụng bản build production:**

   ```bash
   npm run build
   npm run start  # Instead of dev
   ```

4. **Xóa dữ liệu trình duyệt:**
   - Cache
   - Cookies
   - Local storage

---

### Vấn đề: Build quá lâu

**Giải pháp:**

1. **Sử dụng npm install nhanh hơn:**

   ```bash
   npm ci  # Instead of npm install
   ```

2. **Bật caching:**

   ```bash
   npm config set cache ~/.npm-cache
   ```

3. **Sử dụng yarn thay thế:**

   ```bash
   npm install -g yarn
   yarn install  # Faster than npm
   ```

---

## ⚠️ Thông báo lỗi thường gặp

### Lỗi: "Module not found"

**Lỗi đầy đủ:**

```
Error: Cannot find module 'react'
```

**Giải pháp:**

```bash
npm install
# or
npm install react react-dom
```

---

### Lỗi: "Unexpected token <"

**Lỗi đầy đủ:**

```
SyntaxError: Unexpected token '<'
```

**Nguyên nhân:**

- Build thất bại
- Sai loại file

**Giải pháp:**

```bash
# Clear build
rm -rf .next  # or build/
npm run build
```

---

### Lỗi: "fetch is not defined"

**Lỗi đầy đủ:**

```
ReferenceError: fetch is not defined
```

**Giải pháp:**

```bash
# Node <18, install polyfill
npm install node-fetch

# Or upgrade Node to 18+
nvm install 18
```

---

### Lỗi: "CORS policy blocked"

**Lỗi đầy đủ:**

```
Access to fetch at '...' has been blocked by CORS policy
```

**Giải pháp:**

1. **Kiểm tra URL của API endpoint**

2. **Thêm CORS headers (nếu là API server):**

   ```javascript
   // In API server
   res.setHeader('Access-Control-Allow-Origin', '*')
   ```

3. **Sử dụng proxy:**

   ```javascript
   // In package.json
   "proxy": "http://localhost:5000"
   ```

---

## 🆘 Vẫn cần trợ giúp?

### Bước 1: Tìm kiếm trong tài liệu

- 🔍 Tài liệu đầy đủ
- ❓ Câu hỏi thường gặp (FAQ)

### Bước 2: Kiểm tra các vấn đề hiện có

- 🐛 [GitHub Issues](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues)
- Tìm kiếm thông báo lỗi của bạn

### Bước 3: Hỏi cộng đồng

- 💬 [Discord](https://discord.gg/cvf)
- Thường được phản hồi nhanh nhất

### Bước 4: Gửi báo cáo lỗi

**Bao gồm:**

- Phiên bản CVF
- Phiên bản Node.js
- Hệ điều hành (Windows/Mac/Linux)
- Thông báo lỗi đầy đủ
- Các bước tái tạo lỗi

**Template:**

```markdown
**CVF Version:** 1.6.0
**Node Version:** 18.12.0
**OS:** macOS 13.0

**Issue:**
[Describe the problem]

**Steps to Reproduce:**
1. Run `npm run dev`
2. Click on template
3. See error

**Error Message:**
```

[Paste full error]

```

**Screenshots:**
[If helpful]
```

[Gửi vấn đề tại đây](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues/new?template=bug_report.md)

---

*Cập nhật lần cuối: 15 tháng 2 năm 2026 | CVF v1.6*
