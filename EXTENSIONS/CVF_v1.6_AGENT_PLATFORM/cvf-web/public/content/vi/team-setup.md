# CVF cho Nhóm

**Đối tượng:** Nhóm từ 2–10 lập trình viên làm việc với AI  
**Thời gian đọc:** 15 phút  
**Khuyến nghị:** v1.1 (governance) + v1.3 (toolkit) + v1.6 (giao diện web)

---

## Tại sao CVF cho Nhóm?

Khi nhiều người cùng code với AI, những vấn đề mới xuất hiện:

| Vấn đề Cá nhân | Vấn đề Nhóm | Giải pháp CVF |
|-----------------|-------------|---------------|
| Phình phạm vi | AI của mỗi người thêm tính năng khác nhau | Spec đóng băng (INPUT_SPEC) |
| Mất ngữ cảnh | Không ai biết AI của người khác đã làm gì | Trace Action Unit |
| Nợ kỹ thuật | Phong cách code không nhất quán giữa các dev | Agent archetype + preset |
| Lãng phí thời gian | Giải lại những bài đã giải | Skill Library dùng chung |
| Không đánh giá | "Nó chạy được" = đủ tốt | Phase D + Phase gate |

CVF mang đến cho nhóm bạn một **ngôn ngữ chung** để làm việc với AI, mà không thêm quy trình nặng nề.

---

## Thiết lập Nhóm (30 phút)

### Bước 1: Clone & Cấu hình

```bash
# Clone CVF
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git

# Copy governance toolkit vào dự án của bạn
cp -r Controlled-Vibe-Framework-CVF/governance/ your-team-repo/governance/

# Copy các template hữu ích
cp -r Controlled-Vibe-Framework-CVF/v1.1/templates/ your-team-repo/templates/
```

### Bước 2: Thiết lập Cấu trúc Dự án

Mỗi dự án nhóm nên có:

```
your-project/
├── specs/
│   ├── INPUT_SPEC.md          ← Yêu cầu dự án
│   └── OUTPUT_SPEC.md         ← Tiêu chí chấp nhận
├── decisions/
│   ├── DECISION_LOG.md        ← Lựa chọn kiến trúc
│   └── ADR-001.md             ← Quyết định riêng lẻ
├── traces/
│   ├── AU-001-auth.md         ← AI đã làm gì cho auth
│   └── AU-002-api.md          ← AI đã làm gì cho API
├── contracts/                  ← (v1.2+) Skill contract
├── governance/
│   └── TEAM_POLICY.md         ← Quy tắc nhóm
└── src/
```

### Bước 3: Định nghĩa Vai trò Nhóm

CVF định nghĩa 4 vai trò chính. Ánh xạ chúng vào nhóm của bạn:

| Vai trò CVF | Thành viên Nhóm | Trách nhiệm |
|-------------|-----------------|-------------|
| **OBSERVER** | Dev mới, thực tập sinh | Có thể đọc, học, đề xuất ý tưởng |
| **BUILDER** | Dev thường | Có thể thực thi tác vụ, tạo code với AI |
| **ARCHITECT** | Senior dev, tech lead | Có thể phê duyệt thiết kế, đặt mức rủi ro |
| **GOVERNOR** | Team lead, VP Eng | Có thể phê duyệt thay đổi rủi ro cao, đặt chính sách |

> **Một người có thể giữ nhiều vai trò** nếu nhóm của bạn nhỏ. Chỉ cần rõ ràng bạn đang đội mũ nào.

### Bước 4: Cấu hình Mức Governance

Chọn chế độ governance của bạn:

| Chế độ | Khi nào dùng | Chi phí |
|--------|-------------|---------|
| **Simple** | Nhóm nhỏ (2-3), rủi ro thấp | ~5 phút/tác vụ |
| **Rules** | Nhóm trung bình (4-7), code production | ~15 phút/tác vụ |
| **Full CVF** | Nhóm lớn (8+), cần tuân thủ | ~30 phút/tác vụ |

**Chế độ Simple (khuyến nghị để bắt đầu):**

```markdown
# TEAM_POLICY.md

## Governance Mode: Simple

### Rules
1. Every task needs an INPUT_SPEC before AI execution
2. Every PR needs Phase D checklist completed
3. Decisions that affect architecture → Decision Log
4. High-risk changes (infrastructure, auth, data) → ARCHITECT approval

### Phase Gates
- Phase A → B: Self-service (just write the spec)
- Phase B → C: Peer review of design (any BUILDER)
- Phase C → D: Self-review with checklist
- Phase D → Merge: PR review by someone who didn't write it
```

---

## Quy trình Nhóm

### Quy trình Hàng ngày

```
┌─────────────────────────────────────────────────────────────┐
│  Developer chọn tác vụ từ backlog                           │
│  ↓                                                          │
│  Phase A: Viết INPUT_SPEC (mục tiêu + tiêu chí chấp nhận)  │
│  ↓                                                          │
│  Phase B: Thiết kế cách tiếp cận (đồng nghiệp review)      │
│  ↓                                                          │
│  Phase C: Thực thi với AI (tuân theo spec đóng băng)        │
│  ↓                                                          │
│  Phase D: Tự đánh giá với danh sách kiểm tra               │
│  ↓                                                          │
│  Tạo PR với:                                                │
│    • Code                                                   │
│    • INPUT_SPEC.md                                          │
│    • Danh sách kiểm tra Phase D (đã hoàn thành)             │
│    • Trace AU (AI đã làm gì)                                │
│  ↓                                                          │
│  Reviewer kiểm tra: code + tuân thủ spec + governance       │
│  ↓                                                          │
│  Merge                                                      │
└─────────────────────────────────────────────────────────────┘
```

### PR Template

Thêm vào `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## CVF Checklist

### Phase D Review
- [ ] Output matches INPUT_SPEC requirements
- [ ] Acceptance criteria met (list each)
- [ ] No scope expansion beyond spec
- [ ] Error handling covers edge cases
- [ ] Tests written and passing

### Governance
- [ ] Risk level identified: R__
- [ ] ARCHITECT approval (if R2+): @___
- [ ] Decision(s) logged (if applicable)
- [ ] AU trace attached

### Reviewer Notes
<!-- What the reviewer should focus on -->
```

---

## Skill Library dùng chung

### Tại sao cần Skill Library cho Nhóm?

Thay vì mỗi developer tự viết prompt từ đầu, tạo các skill tái sử dụng:

```
your-project/skills/
├── auth-integration.skill.md
├── api-endpoint.skill.md
├── database-migration.skill.md
├── react-component.skill.md
└── test-suite.skill.md
```

### Tạo một Skill cho Nhóm

```markdown
# Skill: API Endpoint

**Version:** 1.0.0
**Owner:** @your-name
**Risk:** R1 (controlled, no external impact)
**Difficulty:** ⭐⭐ Medium

## Prerequisites
- Express/Fastify server running
- Database schema defined
- Authentication middleware configured

## Input (Fill This Form)
| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| Endpoint path | ✅ | RESTful path | `/api/users/:id` |
| HTTP method | ✅ | GET/POST/PUT/DELETE | `GET` |
| Input params | ✅ | Query/body/path params | `id: string (path)` |
| Response format | ✅ | Expected JSON shape | `{ user: { name, email } }` |
| Auth required | ✅ | Who can access | `authenticated users` |
| Error cases | ✅ | Expected errors | `404 Not Found, 403 Forbidden` |

## Expected Output
- Route handler file
- Input validation (Zod/Joi schema)
- Error handling middleware
- Unit tests (≥3 cases)

## Acceptance Checklist
- [ ] Correct HTTP method and path
- [ ] Input validation present
- [ ] Auth middleware applied
- [ ] All error cases handled
- [ ] Tests cover happy path + error cases
- [ ] Response matches specified format
```

### Phân công Sở hữu Skill

| Lĩnh vực Skill | Người sở hữu | Chu kỳ Review |
|----------------|---------------|---------------|
| Auth & Bảo mật | Senior Dev A | Hàng tháng |
| Mẫu API | Senior Dev B | Hàng tháng |
| Component Frontend | Dev C | Hàng quý |
| Thao tác Database | Dev D | Hàng tháng |
| Mẫu Testing | Dev E | Hàng quý |

**Quy tắc:** Thay đổi skill cần review của người sở hữu. Bất kỳ ai cũng có thể đề xuất thay đổi qua PR.

---

## Tích hợp CI/CD (v1.3)

### GitHub Actions: Kiểm tra CVF

```yaml
# .github/workflows/cvf-validate.yml
name: CVF Validation

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check Phase D Checklist
        run: |
          # Ensure PR description contains completed checklist
          if ! grep -q "\[x\]" "$GITHUB_EVENT_PATH"; then
            echo "❌ Phase D checklist not completed"
            exit 1
          fi

      - name: Validate Specs
        run: |
          # Check INPUT_SPEC exists for new features
          if [ -d "specs/" ]; then
            echo "✅ Specs directory found"
          else
            echo "⚠️ No specs directory — consider adding INPUT_SPEC.md"
          fi

      - name: Validate Contracts (v1.2+)
        if: hashFiles('contracts/*.yaml') != ''
        run: |
          pip install pyyaml
          python cli/cvf_validate.py --all contracts/
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for INPUT_SPEC if adding new features
if git diff --cached --name-only | grep -q "src/"; then
  if ! git diff --cached --name-only | grep -q "specs/\|traces/"; then
    echo "⚠️  CVF Reminder: New code without spec or trace."
    echo "   Consider adding INPUT_SPEC.md or AU trace."
    # Warning only — doesn't block
  fi
fi
```

---

## Thách thức Thường gặp của Nhóm

### "Quá nhiều chi phí quản lý"

**Giải pháp:** Bắt đầu với chế độ governance Simple. Chỉ có 2 yêu cầu:
1. Viết INPUT_SPEC trước khi yêu cầu AI
2. Hoàn thành danh sách kiểm tra Phase D trong PR

Mọi thứ khác là tùy chọn. Thêm cấu trúc khi bạn cảm thấy cần.

### "Thành viên nhóm không áp dụng CVF"

**Giải pháp:** Làm cho con đường CVF dễ hơn con đường không CVF:
- PR template điền sẵn danh sách kiểm tra → ít việc hơn viết từ đầu
- Skill library cung cấp điểm khởi đầu → nhanh hơn prompt trống
- Template giúp giảm suy nghĩ → chỉ cần điền form

### "Skill library trở nên lỗi thời"

**Giải pháp:**
- Phân công người sở hữu (xem bảng ở trên)
- Review hàng quý: loại bỏ skill không dùng, gộp trùng lặp
- Đánh phiên bản skill: thay đổi cần PR có diff

### "Mức rủi ro cảm thấy tùy tiện"

**Giải pháp:** Sử dụng các mặc định sau:

| Thay đổi | Rủi ro Mặc định | Cần Phê duyệt |
|----------|:---------------:|:--------------:|
| Thay đổi UI (màu sắc, văn bản) | R0 | Không |
| API endpoint mới | R1 | Peer review |
| Auth / thanh toán / migration dữ liệu | R2 | ARCHITECT |
| Hạ tầng / pipeline deploy | R3 | GOVERNOR |

---

## Mở rộng: Từ 5 lên 10+ Dev

Khi nhóm bạn phát triển vượt quá 5 người, hãy xem xét:

| Tín hiệu | Hành động |
|-----------|-----------|
| Nhiều team/squad | Chia Skill Library theo lĩnh vực |
| Cần tuân thủ | Chuyển sang chế độ governance **Rules** |
| Developer mới tham gia thường xuyên | Tạo hướng dẫn onboarding |
| Phụ thuộc chéo giữa các team | Sử dụng phân loại Command v1.1 (`CVF:PROPOSE`, `CVF:DECIDE`) |
| Yêu cầu enterprise | Chuyển sang Hướng dẫn Enterprise |

---

## Giao diện Web cho Nhóm (v1.6)

Giao diện web v1.6 hoạt động rất tốt cho nhóm:

1. **Template dùng chung:** Tạo template riêng cho nhóm mà mọi người có thể sử dụng
2. **Chế độ governance:** Đặt mức governance cho toàn nhóm (Simple/Rules/Full CVF)
3. **Chấm điểm chất lượng:** Phản hồi AI được chấm 0-100 với accept/reject/retry
4. **Quy trình multi-agent:** Orchestrator → Architect → Builder → Reviewer

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
cp .env.example .env.local
# Add your team's API keys
npm install && npm run dev
```

---

## Bước tiếp theo

- 📖 Tìm hiểu Governance Model
- 🧪 Cài đặt Giao diện Web (Hướng dẫn)
- 🛠️ Tạo Skill Tùy chỉnh (Hướng dẫn)
- 📊 Tìm hiểu Mức Rủi ro
- 🏢 Cần 10+ dev? → Hướng dẫn Enterprise

---

*Cập nhật lần cuối: 15 tháng 2, 2026 | CVF v1.6*
