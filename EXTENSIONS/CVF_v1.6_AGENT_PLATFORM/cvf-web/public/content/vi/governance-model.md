# Mô Hình Governance

Mô hình governance của CVF định nghĩa **ai** có thể làm **gì**, **khi nào**, và **như thế nào** — đặc biệt khi AI tham gia. Nó có thể mở rộng từ nhà phát triển cá nhân (nhẹ nhàng) đến doanh nghiệp (tuân thủ đầy đủ).

---

## Vai Trò

CVF định nghĩa 4 vai trò với quyền hạn tăng dần:

| Vai Trò | Quyền Hạn | Người Điển Hình |
|---------|-----------|-----------------|
| **OBSERVER** | Đọc, học hỏi, đề xuất ý tưởng | Lập trình viên junior, thực tập sinh, người liên quan |
| **BUILDER** | Thực thi tác vụ, tạo code với AI | Lập trình viên thông thường |
| **ARCHITECT** | Phê duyệt thiết kế, đặt mức rủi ro, đánh giá | Lập trình viên senior, trưởng nhóm kỹ thuật |
| **GOVERNOR** | Đặt chính sách, phê duyệt rủi ro cao, ghi đè quyết định | VP Engineering, đội bảo mật, CTO |

### Quyền Hạn Theo Phase

| Phase | OBSERVER | BUILDER | ARCHITECT | GOVERNOR |
|-------|----------|---------|-----------|----------|
| **A — Khám Phá** | Đọc, Đề Xuất | Ghi nhận ý định | Toàn quyền | Toàn quyền |
| **B — Thiết Kế** | Đọc | Đề xuất thiết kế | Phê duyệt thiết kế | Ghi đè |
| **C — Xây Dựng** | Đọc | Thực thi (R0-R1) | Thực thi + Phê duyệt (R2) | Toàn quyền |
| **D — Đánh Giá** | Đọc | Tự đánh giá | Đánh giá người khác | Phê duyệt cuối cùng |

### Thăng Cấp Vai Trò

```
OBSERVER → BUILDER → ARCHITECT → GOVERNOR
   ↑           ↑           ↑          ↑
  Học hỏi   Chứng minh   Khả năng   Được tin
             năng lực    phán đoán   tưởng lãnh đạo
```

Một người có thể giữ nhiều vai trò tùy theo ngữ cảnh. Một lập trình viên senior có thể là ARCHITECT trong nhóm của họ và là BUILDER trong dự án của nhóm khác.

---

## Agent Archetype (v1.1)

Khi sử dụng AI agent, CVF gán 6 archetype:

| Archetype | Hành Động Được Phép | Hành Động Bị Cấm |
|-----------|---------------------|-------------------|
| **Analysis** | Phát hiện, khoảng trống, rủi ro, câu hỏi làm rõ | Quyết định, mở rộng phạm vi |
| **Decision** | Đưa ra quyết định trong phạm vi được ủy quyền | Brainstorming, thay đổi ý định |
| **Planning** | Tạo kế hoạch, mốc quan trọng, phụ thuộc | Thực thi, cam kết phạm vi mới |
| **Execution** | Thực thi tác vụ theo kế hoạch/phạm vi đã cố định | Thay đổi mục tiêu, mở rộng phạm vi |
| **Supervisor** | Giám sát, báo cáo cấp trên, ghi đè trong governance | Thực thi trực tiếp |
| **Exploration** | Ý tưởng, giả thuyết, hướng đi khả thi | Quyết định, cam kết |

### Quy Tắc

- **1 agent = 1 archetype** tại một thời điểm
- Chuyển đổi vai trò yêu cầu **kết thúc agent hiện tại + khởi tạo agent mới**
- Mọi hành động của agent phải chỉ rõ: archetype + preset + command

---

## Vòng Đời Agent

Mỗi AI agent tuân theo 6 trạng thái bắt buộc:

```
Khởi tạo → Gắn kết → Kích hoạt → Thực thi → Chuyển tiếp → Kết thúc
```

| Trạng Thái | Mô Tả |
|------------|--------|
| **Khởi tạo (Invocation)** | Agent được tạo với một tác vụ cụ thể |
| **Gắn kết (Binding)** | Archetype, preset, và quy tắc governance được gắn vào |
| **Kích hoạt (Activation)** | Agent sẵn sàng làm việc (đã có ngữ cảnh) |
| **Thực thi (Execution)** | Agent thực hiện tác vụ |
| **Chuyển tiếp (Transition)** | Agent bàn giao (báo cáo cấp trên, ủy quyền, hoặc chuyển vai trò) |
| **Kết thúc (Termination)** | Agent kết thúc — ghi nhận đầu ra, giải phóng quyền hạn |

### Quy Tắc Quan Trọng

- Không có agent vô hạn — mỗi agent có **điều kiện dừng**
- Gắn kết yêu cầu: archetype + preset + governance
- Chuyển tiếp = kết thúc agent cũ, khởi tạo agent mới (không biến đổi)
- Kết thúc phải ghi nhận: đầu ra + nhật ký truy vết

---

## Phân Loại Command (v1.1)

CVF định nghĩa 8 command cấu trúc mọi tương tác:

| Command | Archetype | Mục Đích | Sản Phẩm Bắt Buộc |
|---------|-----------|----------|-------------------|
| `CVF:PROPOSE` | Exploration / Analysis | Đề xuất ý tưởng | Đề xuất, ranh giới phạm vi |
| `CVF:DECIDE` | Decision | Đưa ra quyết định | Tuyên bố quyết định, lý do |
| `CVF:FREEZE` | Bất kỳ | Khóa phạm vi/spec | Tuyên bố khóa |
| `CVF:DESIGN` | Planning / Analysis | Tạo thiết kế | Ghi chú thiết kế, các phương án |
| `CVF:REFINE` | Planning / Analysis | Cải thiện phiên bản hiện có | Diff trước/sau |
| `CVF:EXECUTE` | Execution | Xây dựng sản phẩm | Định nghĩa AU, liên kết spec |
| `CVF:REVIEW` | Supervisor / Analysis | Đánh giá chất lượng | Phát hiện, phán quyết |
| `CVF:AUDIT` | Supervisor | Kiểm tra tuân thủ | Báo cáo audit, danh sách vi phạm |

### Luồng Thực Thi

Mọi hành động tuân theo luồng này:

```
HỢP ĐỒNG ĐẦU VÀO → ĐỊNH NGHĨA PHẠM VI → KHÓA PHẠM VI → ĐƠN VỊ HÀNH ĐỘNG → THỰC THI CÓ KIỂM SOÁT → ĐẦU RA + NHẬT KÝ TRUY VẾT
```

- Mọi hành động phải chỉ rõ: 1 command + 1 archetype + 1 preset + 1 Action Unit
- Phải liên kết spec ĐẦU VÀO/ĐẦU RA
- Đầu ra chưa được đánh giá = **không có thẩm quyền**

---

## Thứ Bậc Quyền Hạn

Từ cao nhất đến thấp nhất:

```
1. CVF Core (quy tắc framework)
2. CVF Extensions (governance bổ sung)
3. Skill Contract (quy tắc cấp skill)
4. Skill Registry (tầng ủy quyền)
5. Agent Adapter (cấu hình riêng theo model)
6. Agent / Model (thấp nhất — chỉ thực thi)
```

**Agent luôn ở vị trí thấp nhất.** Nó không thể ghi đè quy tắc framework, skill contract, hay chính sách governance.

---

## Phase Gate

Phase Gate là các điểm kiểm tra chất lượng giữa các phase:

### Gate: Phase A → Phase B

```
- [ ] Ý định được ghi nhận rõ ràng
- [ ] Phạm vi được xác định (bao gồm/loại trừ)
- [ ] Tiêu chí thành công/thất bại được nêu
- [ ] Các ràng buộc được xác định
```

### Gate: Phase B → Phase C (PHASE_C_GATE)

```
- [ ] Mục tiêu đã cố định (đã khóa)
- [ ] Thiết kế đủ chi tiết để triển khai
- [ ] Các quyết định quan trọng đã được ghi nhận
- [ ] Rủi ro đã được xác định
- [ ] Tính khả thi đã được xác nhận
```

### Gate: Phase C → Phase D

```
- [ ] Tất cả sản phẩm đã được tạo
- [ ] Đầu ra có thể đánh giá được
- [ ] Không còn hành động xây dựng đang chờ
- [ ] Không mở rộng phạm vi so với thiết kế
```

**Quy tắc:** Gate chỉ có ĐẠT/KHÔNG ĐẠT. Không có kết quả nửa vời. Nếu một mục chưa được đánh dấu, gate thất bại.

---

## Chế Độ Governance (v1.6)

Giao diện web v1.6 cung cấp 3 cấp độ governance:

| Chế Độ | Mô Tả | Phù Hợp Với |
|--------|--------|-------------|
| **Simple** | Chỉ chat, không chấm điểm | Học CVF, tác vụ nhanh |
| **Rules** | Phản hồi AI được chấm 0–100 với chấp nhận/từ chối | Công việc thực tế, kiểm soát chất lượng |
| **Full CVF** | Phase Gate với danh sách kiểm tra, mọi chuyển tiếp đều có gate | Tuân thủ, doanh nghiệp, rủi ro cao |

### Chấm Điểm Chất Lượng Hoạt Động Thế Nào (Chế Độ Rules)

Mỗi phản hồi AI được đánh giá trên các khía cạnh:

- Nó có tuân theo spec không?
- Đầu ra có hoàn chỉnh không?
- Có vi phạm phạm vi không?

Điểm: **0–100**. Hành động:

- ✅ **Chấp nhận** (điểm ≥ ngưỡng)
- ❌ **Từ chối** (giải thích điều gì sai)
- 🔄 **Thử lại** (yêu cầu AI thử lại)

---

## Bộ Công Cụ Governance

CVF cung cấp bộ công cụ governance hoàn chỉnh gồm 7 module:

```
governance/toolkit/
├── 01_BOOTSTRAP/        System prompt, khởi tạo dự án
├── 02_POLICY/           Chính sách tổng, ma trận rủi ro, phiên bản
├── 03_CONTROL/          Ma trận quyền hạn, phase gate, registry
├── 04_TESTING/          UAT, Self-UAT, spec kiểm thử
├── 05_OPERATION/        Governance liên tục, audit, sự cố
├── 06_EXAMPLES/         Nghiên cứu tình huống thực tế
└── 07_QUICKSTART/       Bắt đầu nhanh cho SME
```

### Tài Liệu Quan Trọng

| Tài Liệu | Chức Năng |
|-----------|-----------|
| **Master Policy** | Quy tắc governance cấp cao nhất cho tổ chức |
| **Authority Matrix** | Ai có thể làm gì trong phase nào |
| **Risk Matrix** | Định nghĩa R0–R3 với các biện pháp kiểm soát |
| **Self-UAT** | Bài kiểm tra chất lượng 6 hạng mục cho tương tác AI |
| **Audit Protocol** | Cách audit tuân thủ CVF |
| **Continuous Governance Loop** | Giám sát liên tục (không phải một lần) |

---

## Self-UAT (Kiểm Tra Chấp Nhận Người Dùng)

Mọi tương tác AI có thể được kiểm tra trên 6 hạng mục:

| Hạng Mục | Kiểm Tra |
|----------|----------|
| **Instruction** | AI có tuân theo spec không? |
| **Context** | AI có sử dụng ngữ cảnh được cung cấp đúng cách không? |
| **Output** | Định dạng và chất lượng đầu ra có đúng không? |
| **Risk** | AI có giữ trong mức rủi ro được ủy quyền không? |
| **Handshake** | AI có giao tiếp đúng cách không (hỏi khi chưa rõ)? |
| **Audit** | Tương tác có thể truy vết và đánh giá lại không? |

**Kết quả:** Đạt / Không Đạt cho mỗi hạng mục, yêu cầu bằng chứng.

---

## Mở Rộng Governance

| Quy Mô Nhóm | Chế Độ Đề Xuất | Yếu Tố Chính |
|-------------|----------------|---------------|
| 1 người | Tối thiểu | INPUT_SPEC + Danh sách kiểm tra Phase D |
| 2–5 người | Simple | + Decision Log + PR template |
| 5–10 người | Rules | + Mức rủi ro + Agent archetype |
| 10–50 người | Rules + một phần Full CVF | + Ma trận quyền hạn + CI/CD gate |
| 50+ người | Full CVF | + Audit protocol + Governance liên tục |

---

## Đọc Thêm

- Mô Hình Rủi Ro — Chi tiết các mức rủi ro R0–R3
- Quy Trình 4 Phase — Các phase và gate
- Hệ Thống Skill — Cách skill được quản lý
- Hướng Dẫn Doanh Nghiệp — Triển khai governance đầy đủ
- Bộ Công Cụ Governance — File nguồn

---

*Cập nhật lần cuối: 15 tháng 2, 2026 | CVF v1.6*
