# Quy Trình 4 Phase

CVF tổ chức mọi dự án thành 4 phase tuần tự. Mỗi phase có mục đích cụ thể, đầu vào/đầu ra rõ ràng, và một cổng kiểm tra (gate) trước khi chuyển sang phase tiếp theo.

---

## Tổng Quan

```
Phase A          Phase B          Phase C          Phase D
KHÁM PHÁ    →    THIẾT KẾ    →    XÂY DỰNG    →    ĐÁNH GIÁ
"Cái gì?"        "Như thế nào?"   "Thực hiện."     "Có đúng không?"
```

| Phase | Câu Hỏi | Người Chịu Trách Nhiệm | Vai Trò AI |
|-------|---------|-------------------------|------------|
| **A — Khám Phá** | Chúng ta muốn gì? | Con người | Làm rõ, không giải quyết |
| **B — Thiết Kế** | Chúng ta sẽ xây dựng thế nào? | Con người + AI | Đề xuất cách tiếp cận, không viết code |
| **C — Xây Dựng** | Thực thi kế hoạch. | AI | Viết code chính xác, không tự ý thay đổi |
| **D — Đánh Giá** | Kết quả có đúng ý định không? | Con người | Không có (con người đánh giá) |

---

## Phase A — KHÁM PHÁ

> **Mục tiêu:** Đảm bảo vấn đề được hiểu rõ trước khi bất kỳ ai viết code.

### Đây LÀ gì

- Làm rõ **vấn đề cần giải quyết**
- Xác định **kết quả mong muốn**
- Nhận diện **các ràng buộc**
- Định nghĩa **tiêu chí thành công và thất bại**

### Đây KHÔNG PHẢI là

- ❌ Thu thập yêu cầu kỹ thuật
- ❌ Viết spec chi tiết
- ❌ Định nghĩa giải pháp
- ❌ Chọn công nghệ

### Nội Dung Bắt Buộc

| Yếu Tố | Mô Tả | Ví Dụ |
|---------|--------|-------|
| **Ý Định Cốt Lõi** | Bạn muốn đạt được gì | "Một công cụ chuyển đổi CSV sang JSON" |
| **Tiêu Chí Thành Công** | Làm sao biết nó hoạt động đúng | "Xuất JSON hợp lệ, xử lý file 100MB" |
| **Định Nghĩa Thất Bại** | Điều gì được coi là sai | "Crash khi file rỗng, mất dữ liệu" |
| **Phạm Vi (Bao Gồm)** | Những gì được bao gồm | "Giao diện CLI, đọc/ghi file" |
| **Phạm Vi (Loại Trừ)** | Những gì không bao gồm | "Không có giao diện web, không streaming" |
| **Ràng Buộc** | Giới hạn | "Chỉ Python, không dùng thư viện ngoài" |

### Vai Trò Trong Phase A

| Ai | Làm Gì |
|----|--------|
| **Con người** | Cung cấp ý định ban đầu, trả lời câu hỏi làm rõ |
| **AI** | Đặt câu hỏi làm rõ, chỉ ra sự mơ hồ, từ chối tiến hành nếu thiếu thông tin |

### Quy Tắc

- AI KHÔNG ĐƯỢC đề xuất giải pháp trong Phase A
- AI KHÔNG ĐƯỢC viết code trong Phase A
- Nếu ý định không rõ ràng, AI phải HỎI, không đoán
- Phase A CHƯA HOÀN THÀNH cho đến khi ý định được ghi nhận rõ ràng

### Gate: A → B

Phase A chưa hoàn thành → **không thể chuyển sang Phase B**.

Danh sách kiểm tra:

- [ ] Ý định được ghi nhận rõ ràng
- [ ] Phạm vi được xác định (bao gồm và loại trừ)
- [ ] Các giả định được nêu rõ
- [ ] Các ràng buộc được xác định
- [ ] Tiêu chí thành công/thất bại được định nghĩa

---

## Phase B — THIẾT KẾ

> **Mục tiêu:** Chuyển đổi ý định thành phương pháp giải quyết trước khi viết bất kỳ dòng code nào.

### Đây LÀ gì

- Thiết kế **cách tiếp cận** (hướng đi tổng thể)
- Định nghĩa **cấu trúc giải pháp** (các thành phần, mối quan hệ)
- Xác định **luồng logic** (trình tự xử lý, điểm quyết định)
- Đặt **tiêu chí đánh giá** (cách người dùng kiểm tra mà không cần đọc code)

### Đây KHÔNG PHẢI là

- ❌ Viết code
- ❌ Tối ưu hóa kỹ thuật
- ❌ Triển khai chi tiết
- ❌ Mở rộng phạm vi ngoài Phase A

### Nội Dung Bắt Buộc

| Yếu Tố | Mô Tả | Ví Dụ |
|---------|--------|-------|
| **Cách Tiếp Cận** | Hướng đi tổng thể + lý do phù hợp | "Dùng module csv của Python vì có sẵn trong stdlib" |
| **Thành Phần** | Các phần và vai trò của chúng | "Bộ phân tích CLI, bộ đọc CSV, bộ ghi JSON" |
| **Luồng Logic** | Trình tự xử lý | "Nhập → xác thực → phân tích → chuyển đổi → xuất" |
| **Tiêu Chí Đánh Giá** | Cách xác minh mà không cần đọc code | "Chạy với test.csv → nhận được test.json" |

### Vai Trò Trong Phase B

| Ai | Làm Gì |
|----|--------|
| **Con người** | Đánh giá xem cách tiếp cận có hợp lý và đúng ý định không |
| **AI** | Đề xuất cách tiếp cận, giải thích logic rõ ràng, đảm bảo có thể xác minh được |

### Quy Tắc

- AI KHÔNG ĐƯỢC viết code triển khai
- AI KHÔNG ĐƯỢC mở rộng phạm vi ngoài Phase A
- Thiết kế phải **có thể xác minh** bởi người không đọc được code
- Đầu ra của Phase B trở thành **đầu vào trực tiếp** cho Phase C

### Gate: B → C

```markdown
PHASE_C_GATE Danh sách kiểm tra:
- [ ] Mục tiêu cố định (không thay đổi liên tục)
- [ ] Thiết kế đủ chi tiết để triển khai
- [ ] Các quyết định quan trọng được ghi nhận
- [ ] Rủi ro được xác định
- [ ] Tính khả thi được xác nhận
```

Tất cả các mục phải được đánh dấu. ĐẠT hoặc KHÔNG ĐẠT — không có kết quả nửa vời.

---

## Phase C — XÂY DỰNG

> **Mục tiêu:** Thực thi thiết kế từ Phase B. Tạo sản phẩm cụ thể để đánh giá.

### Đây LÀ gì

- Đây là **phase hành động** — trả lời "Thiết kế đã thống nhất được triển khai như thế nào?"
- Triển khai chính xác những gì đã được thiết kế
- Ghi nhận các sản phẩm (code, tài liệu, đầu ra)

### Đây KHÔNG PHẢI là

- ❌ Nơi đưa ra quyết định sản phẩm
- ❌ Nơi thay đổi thiết kế
- ❌ Nơi mở rộng phạm vi
- ❌ Nơi "làm cho đẹp hơn" trừ khi được yêu cầu

### Điều Kiện Tiên Quyết

Phase C KHÔNG THỂ bắt đầu trừ khi:

- [ ] Phase A hoàn thành (ý định rõ ràng)
- [ ] Phase B hoàn thành (thiết kế được phê duyệt)
- [ ] Không còn ý định mơ hồ
- [ ] Không còn yếu tố thiết kế chưa rõ

### Quy Tắc

- AI thực thi thiết kế **chính xác**
- Không tối ưu hóa ngoài phạm vi
- Không tự thay đổi cấu trúc (AI không thể thay đổi kế hoạch của chính nó)
- Nếu thiết kế không khả thi: **DỪNG Phase C**, ghi nhận vấn đề, quay lại Phase B
- Tất cả đầu ra phải **có thể truy vết** ngược lại thiết kế và ý định

### Kiểm Soát Sai Lệch

Khi AI gặp điều bất ngờ trong quá trình xây dựng:

```
Lựa chọn 1: Vấn đề nhỏ → Ghi nhận, tiếp tục, ghi chú trong nhật ký
Lựa chọn 2: Thiếu sót thiết kế → DỪNG, quay lại Phase B với giải thích
Lựa chọn 3: Cần thay đổi phạm vi → DỪNG, quay lại Phase A
```

AI KHÔNG BAO GIỜ âm thầm thay đổi thiết kế.

### Tiêu Chí Hoàn Thành

- [ ] Tất cả sản phẩm đã được tạo (code, tài liệu, v.v.)
- [ ] Đầu ra có thể đánh giá được bằng tiêu chí Phase B
- [ ] Không còn hành động xây dựng đang chờ
- [ ] Nhật ký truy vết được ghi nhận (đã làm gì, đã dùng gì)

---

## Phase D — ĐÁNH GIÁ

> **Mục tiêu:** Kết quả này có khớp với những gì người dùng muốn không?

### Đây LÀ gì

- Đánh giá đầu ra so với **ý định ban đầu** (Phase A)
- Kiểm tra so với **tiêu chí thiết kế** (Phase B)
- Xác định **các sai lệch**
- Đưa ra **quyết định**: Chấp Nhận hoặc Điều Chỉnh

### Đây KHÔNG PHẢI là

- ❌ Debug kỹ thuật
- ❌ Tối ưu hóa hiệu suất
- ❌ Thay đổi thiết kế
- ❌ Nơi để sửa lỗi

### Quy Trình Đánh Giá

```markdown
1. So sánh đầu ra với ý định Phase A
   - Nó có làm đúng những gì đã yêu cầu không?
   - Nó có đạt tiêu chí thành công không?
   - Nó có tránh được tiêu chí thất bại không?

2. Kiểm tra so với tiêu chí đánh giá Phase B
   - Thực hiện các bước xác minh từ Phase B
   - Hành vi quan sát được có khớp với hành vi mong đợi không?

3. Xác định sai lệch
   - Điều gì khác so với spec?
   - Sai lệch đó có chấp nhận được không?

4. Phán Quyết
   - ✅ CHẤP NHẬN: Đầu ra đúng ý định, dự án có thể kết thúc
   - 🔄 ĐIỀU CHỈNH: Quay lại sửa (chỉ rõ phần nào thất bại)
```

### Điều Chỉnh → Quay Lại Đâu?

| Loại Vấn Đề | Quay Lại |
|-------------|----------|
| Lỗi triển khai | Phase C (thực thi lại) |
| Cách tiếp cận thiết kế sai | Phase B (thiết kế lại) |
| Ý định ban đầu sai | Phase A (khám phá lại) |

**Không bao giờ sửa trực tiếp trong Phase D.** Phase D chỉ dùng để đánh giá.

---

## Theo Dõi Trạng Thái Phase

Mỗi phase có chính xác 4 trạng thái:

| Trạng Thái | Ý Nghĩa |
|------------|----------|
| `NOT_STARTED` | Chưa bắt đầu phase này |
| `IN_PROGRESS` | Đang thực hiện |
| `COMPLETED` | Hoàn thành, đã qua gate |
| `BLOCKED` | Không thể tiếp tục (thiếu thông tin, phụ thuộc) |

**Quy tắc:** Phase N+1 không thể bắt đầu cho đến khi Phase N ở trạng thái `COMPLETED`.

---

## Tại Sao 4 Phase?

### Tại Sao Không Phải 3? (Khám Phá → Xây Dựng → Đánh Giá)

Nếu không có Thiết Kế (Phase B), AI sẽ đoán kiến trúc. Mỗi lần xây dựng trở thành một canh bạc. Bạn sẽ phải xây lại thay vì thiết kế lại.

### Tại Sao Không Phải 5+ Phase?

Nhiều phase hơn = nhiều chi phí quản lý hơn mà không tạo thêm giá trị tương xứng. 4 phase tương ứng với tư duy tự nhiên:

1. Tôi muốn gì? (suy nghĩ)
2. Nó nên hoạt động thế nào? (lên kế hoạch)
3. Xây dựng nó (thực hiện)
4. Nó có hoạt động không? (kiểm tra)

Thêm các phase như "Kiểm thử" hay "Triển khai" tạo ra sự tách biệt giả tạo. Kiểm thử là một phần của Đánh Giá (Phase D). Triển khai là một phần của Xây Dựng (Phase C) hoặc là một dự án riêng.

---

## Khi Nào Quay Lại

CVF KHÔNG PHẢI là mô hình thác nước. Việc lặp lại là bình thường và lành mạnh:

```
A → B → C → D → ✅ CHẤP NHẬN (lý tưởng)
A → B → C → D → 🔄 → C → D → ✅ CHẤP NHẬN (sửa nhỏ)
A → B → C → D → 🔄 → B → C → D → ✅ CHẤP NHẬN (thay đổi thiết kế)
A → B → C → D → 🔄 → A → B → C → D → ✅ CHẤP NHẬN (ý định ban đầu sai)
```

**Mỗi vòng lặp nên nhỏ hơn** — bạn đang hội tụ đến câu trả lời đúng, không phải bắt đầu lại.

---

## 4 Phase Trong Giao Diện Web v1.6

Nền tảng Agent Platform v1.6 ánh xạ mỗi phase với một agent chuyên biệt:

| Phase | Agent | AI Được Đề Xuất |
|-------|-------|-----------------|
| A — Khám Phá | 🎯 Orchestrator | Gemini (suy luận) |
| B — Thiết Kế | 📐 Architect | Claude (thiết kế) |
| C — Xây Dựng | 🔨 Builder | GPT-4 (viết code nhanh) |
| D — Đánh Giá | 🔍 Reviewer | Claude (kiểm tra kỹ lưỡng) |

Xem hướng dẫn Multi-Agent Tutorial để trải nghiệm thực tế.

---

## Đọc Thêm

- Triết Lý Cốt Lõi — Tại sao CVF tồn tại
- Mô Hình Governance — Vai trò và quyền hạn theo phase
- Hướng Dẫn Dự Án Đầu Tiên — Tự trải nghiệm 4 phase
- File Phase (nguồn v1.0) — Định nghĩa phase ban đầu

---

*Cập nhật lần cuối: 15 tháng 2, 2026 | CVF v1.6*
