# Hệ Thống Skill

Skill là cơ chế của CVF giúp các tương tác AI trở nên **có thể lặp lại, chia sẻ được, và được kiểm soát chất lượng**. Thay vì viết prompt từ đầu mỗi lần, bạn sử dụng một mẫu có cấu trúc.

---

## Skill Là Gì?

Một skill là một **mẫu dạng biểu mẫu** (file `.skill.md`) có khả năng:

1. **Hướng dẫn đầu vào** — Cho bạn biết chính xác cần cung cấp thông tin gì
2. **Định nghĩa đầu ra** — Chỉ rõ AI cần tạo ra gì
3. **Bao gồm đánh giá** — Cung cấp danh sách kiểm tra để xác minh chất lượng
4. **Ghi nhận lỗi thường gặp** — Liệt kê các sai lầm phổ biến và cách tránh chúng

### Skill KHÔNG PHẢI Là
- ❌ Thư viện code
- ❌ Mẫu prompt (mặc dù chúng hỗ trợ tạo prompt)
- ❌ Cấu hình AI
- ❌ Wrapper cho API

Skill là **sản phẩm governance** — tài liệu có cấu trúc chuẩn hóa cách con người tương tác với AI.

---

## Cấu Trúc Skill

Mỗi skill tuân theo định dạng sau:

```
[Tên Skill]
├── Metadata (lĩnh vực, độ khó, phiên bản, mức rủi ro)
├── 📌 Điều kiện tiên quyết (cần gì trước khi dùng skill này)
├── 🎯 Mục đích (khi nào dùng / khi nào KHÔNG dùng)
├── 📋 Biểu mẫu đầu vào (các trường cần điền trước khi gửi cho AI)
├── ✅ Đầu ra mong đợi (AI cần tạo ra gì)
├── 🔍 Danh sách kiểm tra chấp nhận (cách xác minh chất lượng)
├── ⚠️ Lỗi thường gặp (sai lầm và cách phòng tránh)
├── 💡 Mẹo (thực hành tốt nhất)
├── 📊 Ví dụ (đầu vào hoàn chỉnh → đầu ra → đánh giá)
├── 🔗 Skill liên quan
└── 📜 Lịch sử phiên bản
```

### Ví Dụ: Khối Metadata

```markdown
| Trường | Giá Trị |
|--------|---------|
| **Lĩnh vực** | App Development |
| **Độ khó** | ⭐⭐ Trung bình |
| **Phiên bản CVF** | v1.0+ |
| **Phiên bản Skill** | 1.2.0 |
| **Cập nhật lần cuối** | 2026-02-15 |
| **Mức rủi ro** | R1 |
```

### Ví Dụ: Biểu Mẫu Đầu Vào

```markdown
| Trường | Bắt Buộc | Mô Tả | Ví Dụ |
|--------|:--------:|-------|-------|
| Tên resource | ✅ | Thực thể cần quản lý | `User` |
| HTTP method | ✅ | Phương thức REST | `POST` |
| Đường dẫn endpoint | ✅ | Mẫu URL | `/api/users` |
| Request body | ✅* | JSON schema | `{ name: string }` |
| Trường hợp lỗi | ✅ | Các lỗi dự kiến | `400, 404, 409` |
```

Phần Biểu Mẫu Đầu Vào là cốt lõi của skill — nó định nghĩa chính xác thông tin AI cần.

---

## Thư Viện Skill

CVF bao gồm **114 skill có sẵn** trên 12 lĩnh vực:

| Lĩnh Vực | Số Skill | Ví Dụ |
|-----------|:--------:|-------|
| Marketing & SEO | 9 | Audit SEO, chiến lược nội dung, A/B test |
| Product & UX | 8 | User story, spec wireframe, audit UX |
| Security & Compliance | 6 | Mô hình mối đe dọa, kiểm tra tuân thủ |
| Finance & Analytics | 8 | Mô hình tài chính, bảng KPI |
| App Development | 8 | REST API, database migration, bộ test |
| HR & Operations | 5 | Mô tả công việc, onboarding, OKR |
| Legal & Contracts | 5 | Đánh giá hợp đồng, NDA, Điều khoản dịch vụ |
| AI/ML Evaluation | 6 | Đánh giá model, audit thiên lệch |
| Web Development | 6 | Landing page, audit hiệu suất |
| Business Analysis | 3 | Nghiên cứu thị trường, phân tích cạnh tranh |
| Content Creation | 3 | Bài blog, tài liệu kỹ thuật |
| Technical Review | 3 | Review code, review kiến trúc |

**Duyệt tất cả:** Thư viện Skill có trong thư mục CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS

---

## Cách Sử Dụng Skill

### Bước 1: Tìm skill
Duyệt theo lĩnh vực hoặc tìm kiếm trong thư viện skill.

### Bước 2: Kiểm tra điều kiện tiên quyết
Đọc phần Điều kiện tiên quyết. Đảm bảo bạn đã có mọi thứ cần thiết.

### Bước 3: Điền biểu mẫu
Sao chép bảng Biểu Mẫu Đầu Vào và điền giá trị của bạn.

### Bước 4: Gửi cho AI
Dán biểu mẫu đã điền vào công cụ AI (ChatGPT, Claude, Copilot, v.v.), cùng với phần Đầu Ra Mong Đợi.

### Bước 5: Đánh giá
Sử dụng Danh Sách Kiểm Tra Chấp Nhận để xác minh đầu ra của AI. Kiểm tra các Dấu Hiệu Cảnh Báo.

### Bước 6: Chấp nhận hoặc thử lại
- ✅ Tất cả các mục đều đạt → Chấp nhận
- ❌ Có mục thất bại → Sửa biểu mẫu đầu vào hoặc yêu cầu AI thử lại

---

## Mức Độ Khó Của Skill

| Mức | Biểu Tượng | Ý Nghĩa | Ví Dụ |
|-----|-----------|----------|-------|
| Dễ | ⭐ | Điền các trường đơn giản, đầu ra rõ ràng | Bài blog, tóm tắt cuộc họp |
| Trung bình | ⭐⭐ | Cần một số kiến thức chuyên môn | API endpoint, bộ test |
| Nâng cao | ⭐⭐⭐ | Cần kiến thức chuyên gia + nhiều bước | Mô hình mối đe dọa, review kiến trúc |

---

## Quản Lý Phiên Bản Skill

Skill sử dụng semantic versioning: `MAJOR.MINOR.PATCH`

| Thay Đổi | Tăng Phiên Bản | Ví Dụ |
|----------|----------------|-------|
| Sửa lỗi chính tả, câu từ | 1.0.0 → 1.0.1 | Sửa mô tả trường |
| Thêm phần mới, ví dụ | 1.0.0 → 1.1.0 | Thêm phần "Lỗi Thường Gặp" |
| Thêm trường mới, tái cấu trúc | 1.0.0 → 2.0.0 | Thay đổi schema đầu vào |

### Ví Dụ Lịch Sử Phiên Bản

```markdown
| Phiên Bản | Ngày | Thay Đổi |
|-----------|------|----------|
| 1.0.0 | 2026-01-15 | Phát hành ban đầu |
| 1.1.0 | 2026-02-01 | Thêm phần Lỗi Thường Gặp |
| 1.1.1 | 2026-02-10 | Sửa định dạng đầu ra ví dụ |
| 2.0.0 | 2026-02-15 | Thêm trường bắt buộc mới: Trường hợp lỗi |
```

---

## Vòng Đời Skill

Skill tuân theo vòng đời được định nghĩa:

```
ĐỀ XUẤT → PHÊ DUYỆT → HOẠT ĐỘNG → KHÔNG KHUYẾN KHÍCH → NGỪNG SỬ DỤNG
```

| Trạng Thái | Ý Nghĩa |
|------------|----------|
| **PROPOSED** | Bản nháp skill được gửi để đánh giá |
| **APPROVED** | Đã đánh giá và chấp nhận, chưa công bố |
| **ACTIVE** | Sẵn sàng sử dụng |
| **DEPRECATED** | Vẫn hoạt động, nhưng có phương án tốt hơn |
| **RETIRED** | Không còn sử dụng được |

### Quy Tắc Vòng Đời
- PROPOSED → APPROVED: Yêu cầu người đánh giá ký duyệt
- ACTIVE → DEPRECATED: Phải chỉ rõ skill thay thế
- DEPRECATED → RETIRED: Thời gian thông báo 30 ngày

---

## Governance Cho Skill (v1.2+)

Đối với nhóm và doanh nghiệp, mỗi skill có một **bản ghi governance** (`.gov.md`):

```markdown
# Bản Ghi Governance: REST API Endpoint

**Skill ID:** USR-001
**Mức rủi ro:** R1
**Trạng thái:** ACTIVE
**Người sở hữu:** @team-lead
**Chu kỳ đánh giá:** Hàng quý

## Đánh Giá Rủi Ro
| Khía Cạnh | Mức |
|-----------|-----|
| Rủi ro quyền hạn | R0 |
| Rủi ro mở rộng phạm vi | R1 |
| Rủi ro không thể đảo ngược | R0 |
| Rủi ro khả năng diễn giải | R0 |
| Rủi ro tác động bên ngoài | R0 |
| **Tổng hợp** | **R1** |

## Quyền Hạn
- BUILDER: Tự do sử dụng
- ARCHITECT: Phải phê duyệt cho ngữ cảnh R2+
- GOVERNOR: Có thể ghi đè đánh giá rủi ro
```

### Con Số Governance

CVF governance theo dõi:
- **114 skill người dùng** với bản ghi governance (`USR-*.gov.md`)
- **8 agent skill** với bản ghi governance (`AGT-*.gov.md`)
- Xác thực tự động qua `validate_registry.py`

---

## Các Loại Skill

### Skill Người Dùng (USR-*)
Mẫu dạng biểu mẫu dành cho con người sử dụng AI. Không cần code. Điền biểu mẫu → gửi cho AI → đánh giá đầu ra.

### Agent Skill (AGT-*)
Mẫu cấu hình cho AI agent trong luồng công việc đa agent. Định nghĩa agent có thể làm gì, không thể làm gì, và cách báo cáo.

---

## Tạo Skill Tùy Chỉnh

Xem Hướng Dẫn Tạo Skill Tùy Chỉnh để có hướng dẫn từng bước.

### Mẫu Nhanh

```markdown
# Skill: [Tên Skill Của Bạn]

## Metadata
| Trường | Giá Trị |
|--------|---------|
| **Lĩnh vực** | [Lĩnh vực] |
| **Độ khó** | ⭐/⭐⭐/⭐⭐⭐ |
| **Phiên bản Skill** | 1.0.0 |
| **Mức rủi ro** | R0/R1/R2 |

## 📌 Điều Kiện Tiên Quyết
- [ ] [Những gì bạn cần trước khi sử dụng skill này]

## 🎯 Mục Đích
**Dùng khi:** [tình huống]
**Không dùng khi:** [tình huống ngược lại]

## 📋 Biểu Mẫu Đầu Vào
| Trường | Bắt Buộc | Mô Tả | Ví Dụ |
|--------|:--------:|-------|-------|
| ... | ✅ | ... | ... |

## ✅ Đầu Ra Mong Đợi
[AI cần tạo ra gì]

## 🔍 Danh Sách Kiểm Tra Chấp Nhận
- [ ] [Tiêu chí 1]
- [ ] [Tiêu chí 2]

## ⚠️ Lỗi Thường Gặp
| Lỗi | Cách Phòng Tránh |
|-----|-----------------|
| ... | ... |
```

---

## Thư Viện Skill Trong Giao Diện Web (v1.6)

Ứng dụng web v1.6 tích hợp skill dưới dạng mẫu:
- Skill hiển thị trong bộ chọn mẫu
- Các trường Biểu Mẫu Đầu Vào trở thành phần tử tương tác
- Danh Sách Kiểm Tra Chấp Nhận trở thành một phần của giao diện đánh giá
- Xuất file tạo ra spec Markdown với metadata governance

---

## Đọc Thêm

- Hướng Dẫn Tạo Skill Tùy Chỉnh — Tạo skill của riêng bạn
- Mô Hình Rủi Ro — Các mức rủi ro cho skill
- Mô Hình Governance — Cách skill phù hợp với governance
- Thư Viện Skill — Duyệt tất cả 114 skill

---

*Cập nhật lần cuối: 15 tháng 2, 2026 | CVF v1.6*
