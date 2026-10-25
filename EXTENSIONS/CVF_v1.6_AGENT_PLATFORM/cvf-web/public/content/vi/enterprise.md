# CVF cho Doanh nghiệp

**Đối tượng:** Tổ chức có 10+ lập trình viên và yêu cầu tuân thủ  
**Thời gian đọc:** 20 phút  
**Khuyến nghị:** v1.1 + v1.2 + v1.3 + v1.6

---

## Tại sao CVF cho Doanh nghiệp?

AI đã có mặt trong tổ chức của bạn. Lập trình viên đang sử dụng ChatGPT, Copilot và Claude hàng ngày. Câu hỏi không phải là "có nên cho phép AI không?" — mà là "làm thế nào để quản trị AI?"

| Nhu cầu Doanh nghiệp | Giải pháp CVF |
|-----------------------|---------------|
| **Governance** — Ai có thể làm gì | Ma trận Quyền hạn: 4 vai trò × 4 phase |
| **Khả năng kiểm toán** — Truy vết quyết định | Nhật ký Action Unit + Bản ghi Quyết định |
| **Quản lý rủi ro** — Kiểm soát phạm vi ảnh hưởng | Mức rủi ro R0–R3 với phase gate |
| **Tuân thủ** — Đáp ứng yêu cầu quy định | Governance Toolkit (7 module) |
| **Chuẩn hóa** — Sử dụng AI nhất quán | Agent Archetype + Skill Library |
| **Tái sử dụng** — Không phát minh lại bánh xe | 114 skill có sẵn + skill nhóm |

---

## Lộ trình Triển khai (4 tuần)

### Tuần 1: Đánh giá & Lập kế hoạch

**Nhiệm vụ:**

1. **Khảo sát việc sử dụng AI** trong các nhóm
   - Những công cụ nào đang được dùng? (Copilot, ChatGPT, Claude, Cursor)
   - Chúng được dùng để làm gì? (Sinh code, review, tài liệu, testing)
   - Những vấn đề nào đã xảy ra? (Lỗi, vấn đề bảo mật, phình phạm vi)

2. **Định nghĩa chính sách governance**

```markdown
# Company XYZ — CVF Governance Policy

## Roles
| CVF Role | Maps To | Count |
|----------|---------|-------|
| OBSERVER | Junior devs, interns | ~30% |
| BUILDER | Regular devs | ~50% |
| ARCHITECT | Senior devs, tech leads | ~15% |
| GOVERNOR | VP Eng, Security team | ~5% |

## Risk Levels
| Level | Definition | Approval Required |
|-------|-----------|-------------------|
| R0 | Read-only, formatting, summarization | None |
| R1 | Internal code, single service, bounded | Peer review |
| R2 | Cross-service, auth, data, payments | ARCHITECT |
| R3 | Infrastructure, deploy, external APIs | GOVERNOR + Security |

## Phase Gates
| Transition | Gate | Approver |
|-----------|------|----------|
| A → B | Intent review | Self-service |
| B → C | Design approval | ARCHITECT (for R2+) |
| C → D | Code review + Phase D checklist | Peer (any BUILDER) |
| D → Production | Final review | GOVERNOR (for R2+) |
```

1. **Chọn nhóm thí điểm** (5–7 dev, 1 dự án, 4 tuần)

**Sản phẩm bàn giao:** Chính sách governance, ma trận rủi ro, nhóm thí điểm đã chọn.

---

### Tuần 2: Hạ tầng Thí điểm

**Nhiệm vụ:**

1. **Triển khai Governance Toolkit**

```bash
# Clone CVF
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git

# Copy governance toolkit vào monorepo/cấu hình chung
cp -r governance/ your-org-repo/governance/
```

Governance Toolkit chứa 7 module:

```
governance/toolkit/
├── 01_BOOTSTRAP/        # System prompt, khởi tạo dự án
├── 02_POLICY/           # Chính sách chính, ma trận rủi ro, phiên bản
├── 03_CONTROL/          # Ma trận quyền hạn, phase gate, registry
├── 04_TESTING/          # UAT, Self-UAT, spec kiểm thử
├── 05_OPERATION/        # Governance liên tục, kiểm toán, sự cố
├── 06_EXAMPLES/         # Nghiên cứu tình huống thực tế
└── 07_QUICKSTART/       # Bắt đầu nhanh cho SME
```

1. **Cài đặt Giao diện Web (v1.6)**

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
cp .env.example .env.local

# Cấu hình với nhà cung cấp AI được công ty phê duyệt
echo "OPENAI_API_KEY=sk-..." >> .env.local
echo "DEFAULT_AI_PROVIDER=openai" >> .env.local

npm install
npm run build
npm start
```

Triển khai lên hạ tầng nội bộ (xem Hướng dẫn Triển khai để biết các tùy chọn Vercel/Netlify/Docker).

1. **Tùy chỉnh Ma trận Quyền hạn**

Chỉnh sửa `governance/toolkit/03_CONTROL/CVF_PHASE_AUTHORITY_MATRIX.md`:

| Phase | OBSERVER | BUILDER | ARCHITECT | GOVERNOR |
|-------|----------|---------|-----------|----------|
| Discovery | Đọc, Đề xuất | Đọc, Đề xuất, Ghi chép | Toàn quyền | Toàn quyền |
| Design | Đọc | Đọc, Đề xuất thiết kế | Phê duyệt thiết kế | Ghi đè |
| Build | Đọc | Thực thi (R0-R1) | Thực thi (R0-R2), Phê duyệt R2 | Toàn quyền |
| Review | Đọc | Tự review | Review người khác, Phê duyệt | Phê duyệt cuối |

1. **Đào tạo nhóm thí điểm** (workshop 4 giờ)

**Chương trình workshop:**

- Giờ 1: Triết lý CVF ("Kết quả > Code", 4 phase)
- Giờ 2: Thực hành: Viết INPUT_SPEC đầu tiên + sử dụng danh sách kiểm tra Phase D
- Giờ 3: Mức rủi ro, governance, vai trò
- Giờ 4: Demo giao diện web + giới thiệu Skill Library

---

### Tuần 3–4: Thực thi Thí điểm

**Yêu cầu dự án thí điểm:**

- Dự án thực (không phải dự án mẫu)
- Thời hạn 4 tuần
- Sản phẩm bàn giao rõ ràng
- Kết quả đo lường được

**Chỉ số cần theo dõi:**

| Chỉ số | Đường cơ sở | Mục tiêu |
|--------|-------------|----------|
| Thời gian đến code hoạt động đầu tiên | Đo lường | -20% |
| Lỗi tìm thấy khi review | Đo lường | -30% |
| Tuân thủ phase gate | 0% | >90% |
| Sự cố R3 | Đo lường | 0 |
| Mức hài lòng developer | Khảo sát | ≥4/5 |

**Đánh giá hàng tuần:**

- Governance đang thêm giá trị hay chỉ tạo ma sát?
- Phase gate quá nặng hay quá nhẹ?
- Những skill nào đang được dùng? Thiếu những cái nào?
- Có ai lách governance không? (= chính sách cần điều chỉnh)

**Tiêu chí thành công thí điểm:**

- ✅ 90%+ tuân thủ phase gate
- ✅ Không có sự cố bảo mật R3
- ✅ Mức hài lòng nhóm ≥ 4/5
- ✅ Cải thiện chất lượng đo lường được

---

## Governance Toolkit Chi tiết

### Tài liệu Chính

| Tài liệu | Vị trí | Mục đích |
|-----------|--------|----------|
| **Chính sách Chính** | `02_POLICY/CVF_MASTER_POLICY.md` | Quy tắc governance cấp cao nhất |
| **Ma trận Quyền hạn** | `03_CONTROL/CVF_PHASE_AUTHORITY_MATRIX.md` | Ai có thể làm gì, khi nào |
| **Ma trận Rủi ro** | `02_POLICY/CVF_RISK_MATRIX.md` | R0–R3 với phạm vi ảnh hưởng |
| **Self-UAT** | `04_TESTING/CVF_AGENT_UAT.md` | Kiểm thử chất lượng agent |
| **Quy trình Kiểm toán** | `05_OPERATION/CVF_AUDIT_PROTOCOL.md` | Kiểm toán tuân thủ |
| **Governance Liên tục** | `05_OPERATION/CONTINUOUS_GOVERNANCE_LOOP.md` | Giám sát liên tục |

### Self-UAT (Kiểm thử Chấp nhận Người dùng)

Mỗi tương tác AI có thể được chấm điểm qua 6 hạng mục:

| Hạng mục | Kiểm tra gì |
|----------|-------------|
| **Chỉ dẫn** | AI có tuân theo spec không? |
| **Ngữ cảnh** | AI có sử dụng ngữ cảnh được cung cấp đúng cách? |
| **Đầu ra** | Định dạng và chất lượng đầu ra có đúng? |
| **Rủi ro** | AI có ở trong mức rủi ro được cho phép? |
| **Giao tiếp** | AI có giao tiếp đúng cách (hỏi khi không rõ)? |
| **Kiểm toán** | Tương tác có thể được truy vết và review? |

**Kết quả:** Đạt / Không đạt cho mỗi hạng mục, kèm bằng chứng.

### Vòng lặp Governance Liên tục

**"Governance là một vòng lặp, không phải một sự kiện."**

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Định nghĩa Chính sách → Áp dụng Gate → Thực thi →     │
│  Kiểm toán → Học hỏi                                    │
│       ↑                                            │     │
│       └────────────────────────────────────────────┘     │
│                                                          │
│  Phát hiện lệch: Áp dụng lại theo lịch hoặc trigger     │
│  Re-UAT định kỳ: Hàng tuần cho dự án đang hoạt động     │
│  Cập nhật chính sách: Review hàng tháng, quản lý phiên  │
│  bản                                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Tích hợp với Công cụ Hiện có

### Tích hợp GitHub / GitLab

**PR Template** (`.github/PULL_REQUEST_TEMPLATE.md`):

```markdown
## CVF Compliance

### Spec
- [ ] INPUT_SPEC.md attached or linked
- [ ] Risk level: R__ (0/1/2/3)

### Phase D Review
- [ ] Output matches INPUT_SPEC requirements
- [ ] Acceptance criteria met
- [ ] No scope expansion
- [ ] Tests passing

### Governance
- [ ] ARCHITECT approval (if R2+)
- [ ] AU trace included
- [ ] Decision(s) logged (if applicable)
```

**GitHub Actions** (kiểm tra CI/CD):

```yaml
name: CVF Compliance Check
on: [pull_request]

jobs:
  cvf-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate specs
        run: |
          # Check INPUT_SPEC exists for feature branches
          if [[ "${{ github.head_ref }}" == feature/* ]]; then
            if [ ! -f specs/INPUT_SPEC.md ]; then
              echo "::error::Feature branch requires INPUT_SPEC.md"
              exit 1
            fi
          fi

      - name: Validate contracts (v1.2+)
        if: hashFiles('contracts/*.yaml') != ''
        run: |
          pip install pyyaml
          python cli/cvf_validate.py --all contracts/
```

### Jira / Quản lý Dự án

Ánh xạ phase CVF vào quy trình Jira:

| Trạng thái Jira | Phase CVF | Quy tắc Chuyển đổi |
|-----------------|-----------|---------------------|
| To Do | — | — |
| Discovery | Phase A | Người được giao viết INPUT_SPEC |
| Design | Phase B | INPUT_SPEC được duyệt → thiết kế |
| In Progress | Phase C | Thiết kế được duyệt → xây dựng |
| Review | Phase D | Code + danh sách kiểm tra Phase D |
| Done | Chấp nhận | Tất cả kiểm tra đạt |

**Trường tùy chỉnh:**

| Trường | Loại | Giá trị |
|--------|------|---------|
| CVF Risk Level | Dropdown | R0, R1, R2, R3 |
| CVF Phase | Dropdown | Discovery, Design, Build, Review |
| CVF Spec Link | URL | Liên kết đến INPUT_SPEC.md |
| CVF Approval | User | ARCHITECT / GOVERNOR |

---

## Mở rộng lên 100+ Lập trình viên

### Cấu trúc Tổ chức

```
VP Engineering (GOVERNOR)
├── Platform Team (duy trì hạ tầng CVF)
│   ├── Cập nhật CVF toolkit
│   ├── Skill library dùng chung (skill toàn cục)
│   └── Tích hợp CI/CD
│
├── Security Team (review thay đổi R2+)
│   ├── Đánh giá rủi ro
│   └── Tuân thủ kiểm toán
│
└── Product Team (10-15 dev mỗi nhóm)
    ├── Team Lead (ARCHITECT)
    ├── Senior Dev (ARCHITECT)
    ├── Dev thường (BUILDER)
    └── Junior (OBSERVER)
```

### Governance Skill Library

| Phạm vi | Quản lý bởi | Ví dụ | Chu kỳ Review |
|---------|-------------|-------|---------------|
| **Toàn cục** | Platform Team | Auth, logging, monitoring, xử lý lỗi | Hàng tháng |
| **Lĩnh vực** | Product Team | Thanh toán, quản lý người dùng, phân tích | Hàng quý |
| **Nhóm** | Nhóm riêng lẻ | Mẫu riêng của nhóm | Khi cần |

**Vòng đời:**

```
PROPOSED → APPROVED → ACTIVE → DEPRECATED → RETIRED
```

Tất cả thay đổi skill được quản lý phiên bản, cần PR review.

### Bảng điều khiển Chỉ số

Theo dõi các KPI sau trong toàn tổ chức:

```
CVF Compliance Dashboard
─────────────────────────────────────
Phase gate compliance:        94%  (target: >90%)
R3 incidents this quarter:     0   (target: 0)
Skills in library:           247   (42 global, 205 domain)
Avg time to Phase D:         4.2d  (baseline: 6.1d)
Developer satisfaction:      4.3/5 (target: >4.0)
Governance bypass attempts:    2   (auto-detected by CI)
─────────────────────────────────────
```

---

## Nghiên cứu Tình huống: Công ty Fintech (120 Dev)

### Trước CVF

- Sử dụng AI không nhất quán (một số nhóm cấm, số khác dùng tự do)
- Sự cố bảo mật: 3 mỗi quý
- Nghẽn cổ chai review code: trung bình 2–3 ngày
- Silo kiến thức (không tái sử dụng được giữa các nhóm)

### Sau CVF (6 tháng)

- Chuẩn hóa: tất cả nhóm sử dụng CVF v1.1 + Governance Toolkit
- Sự cố bảo mật: **0** (phase gate R3 ngăn chặn vấn đề)
- Review code: **<1 ngày** (danh sách kiểm tra Phase D pre-validate)
- Tái sử dụng skill: **62%** tính năng mới dùng skill có sẵn

### ROI

| Chỉ số | Trước | Sau | Cải thiện |
|--------|-------|-----|:---------:|
| Thời gian mỗi tính năng | 6.1 ngày | 4.2 ngày | **-31%** |
| Lỗi trong production | 12/quý | 7/quý | **-42%** |
| Thời gian review code | 2.5 ngày | 0.8 ngày | **-68%** |
| Mức hài lòng developer | 3.1/5 | 4.3/5 | **+39%** |

---

## Câu hỏi Thường gặp cho Doanh nghiệp

**H: Làm thế nào để bắt buộc tuân thủ CVF?**  
Đ: Ba lớp:

1. **Kỹ thuật:** CI/CD gate chặn PR không có danh sách kiểm tra Phase D
2. **Xã hội:** PR template làm CVF dễ hơn việc không dùng
3. **Kiểm toán:** Review governance hàng quý (xem `05_OPERATION/CVF_AUDIT_PROTOCOL.md`)

**H: Nếu lập trình viên lách CVF thì sao?**  
Đ: Hãy làm con đường CVF trở thành con đường ít kháng cự nhất. Nếu việc lách phổ biến, governance của bạn quá nặng — hãy đơn giản hóa.

**H: CVF thêm bao nhiêu chi phí?**  
Đ: Ban đầu: 10–15% (đường cong học tập). Sau 4 tuần: hiệu quả ròng dương (review nhanh hơn, ít làm lại). Sau 3 tháng: tiết kiệm 20–30% thời gian (tái sử dụng skill, ít lỗi hơn).

**H: Chúng tôi có thể tùy chỉnh CVF không?**  
Đ: Có. CVF được cấp phép CC BY-NC-ND 4.0 cho sử dụng phi thương mại. Tùy chỉnh chính sách, mức rủi ro, phase gate, ma trận quyền hạn. Fork Governance Toolkit và điều chỉnh cho tổ chức của bạn.

**H: CVF có thay thế SDLC hiện tại không?**  
Đ: Không. CVF được đặt lên trên quy trình hiện tại của bạn. Nó đặc biệt quản trị phần được AI hỗ trợ trong quy trình làm việc.

**H: Làm thế nào với nhóm đa ngôn ngữ?**  
Đ: CVF v1.6 hỗ trợ tiếng Anh và tiếng Việt. Spec lõi (INPUT_SPEC, OUTPUT_SPEC) nên bằng ngôn ngữ chính của nhóm. Framework không phụ thuộc ngôn ngữ.

---

## Hỗ trợ Doanh nghiệp

**Mã nguồn mở (Miễn phí):**

- CVF được cấp phép CC BY-NC-ND 4.0 (phi thương mại)
- Hỗ trợ cộng đồng qua GitHub Issues
- Tài liệu đầy đủ trong repo này

**Bắt đầu:**

1. Clone repo này
2. Đọc Governance Toolkit
3. Làm theo hướng dẫn này để chạy thí điểm
4. Cải tiến dựa trên kết quả

---

## Bước tiếp theo

- 📖 Tìm hiểu chi tiết Governance Model
- 📊 Nghiên cứu sâu: Risk Model
- 🛠️ Cài đặt Giao diện Web cho Nhóm
- 🧪 Tạo Skill Tùy chỉnh
- 📋 Xem Nghiên cứu Tình huống
- 📐 Sơ đồ Kiến trúc

---

*Cập nhật lần cuối: 15 tháng 2, 2026 | CVF v1.6*
