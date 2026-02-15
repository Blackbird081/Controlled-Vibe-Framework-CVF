# Mô Hình Rủi Ro

Mô hình rủi ro của CVF phân loại mọi tương tác AI theo mức độ tác động tiềm tàng. Rủi ro cao hơn = nhiều kiểm soát hơn. Điều này ngăn việc "đi nhanh và phá vỡ mọi thứ" khỏi phá vỡ những thứ không nên.

---

## Mức Rủi Ro: R0–R3

| Mức | Tên | Mô Tả | Ví Dụ |
|-----|-----|-------|-------|
| **R0** | Thụ Động | Không có tác dụng phụ, không tác động bên ngoài | Định dạng văn bản, tóm tắt tài liệu |
| **R1** | Có Kiểm Soát | Tác dụng phụ nhỏ, có giới hạn | Chấm điểm nội bộ, sinh code, phân loại |
| **R2** | Nâng Cao | Có quyền hành động, có thể chuỗi hành động | Lên kế hoạch tự động, điều phối nhiều bước, xuyên dịch vụ |
| **R3** | Nghiêm Trọng | Thay đổi hệ thống, tác động bên ngoài, khó đảo ngược | Thay đổi hạ tầng, gọi API bên ngoài, xóa dữ liệu |

### Mở rộng: R4 (Bị Chặn)

| **R4** | Bị Chặn | Có thể gây thiệt hại nghiêm trọng hoặc không thể đảo ngược | Quyết định tự trị không có con người đánh giá |

R4 có nghĩa là: **không thực thi trong bất kỳ trường hợp nào**.

---

## Yêu Cầu Của Mỗi Mức

| Rủi Ro | Được Làm | Biện Pháp Kiểm Soát Bắt Buộc | Phê Duyệt |
|--------|----------|-------------------------------|-----------|
| **R0** | Đọc, ghi, thực thi | Ghi nhật ký | Không cần |
| **R1** | Đọc, ghi | Ghi nhật ký + Bảo vệ phạm vi | Đánh giá ngang hàng |
| **R2** | Chỉ đọc (đề xuất hành động) | Phê duyệt rõ ràng + Audit | ARCHITECT |
| **R3** | Chỉ đọc (chỉ gợi ý) | Cổng cứng + Con người trong vòng lặp | GOVERNOR + Bảo mật |
| **R4** | Không gì cả | Bị chặn | Không áp dụng |

### Trong Giao Diện Web v1.6

| Tính Năng | Mức Rủi Ro |
|-----------|:----------:|
| Template (biểu mẫu chỉ đọc) | R0 |
| Chat đơn agent | R1 |
| Luồng công việc đa agent | R2 |

---

## 5 Khía Cạnh Rủi Ro

Mỗi khả năng hoặc tác vụ được đánh giá trên 5 khía cạnh:

### 1. Rủi Ro Quyền Hạn
> Nó có thể ghi đè quyết định, hành động tự trị, sửa đổi governance không?

| Mức | Mô Tả |
|-----|-------|
| R0 | Không có quyền hạn, chỉ tuân theo hướng dẫn |
| R1 | Quyền hạn giới hạn trong phạm vi được định trước |
| R2 | Có thể đưa ra quyết định ảnh hưởng đến các thành phần khác |
| R3 | Có thể ghi đè governance, thay đổi hành vi hệ thống |

### 2. Rủi Ro Mở Rộng Phạm Vi
> Nó có thể mở rộng phạm vi của chính nó, chạy ngoài ngữ cảnh ban đầu, chuỗi không kiểm soát?

| Mức | Mô Tả |
|-----|-------|
| R0 | Phạm vi cố định, không thể mở rộng |
| R1 | Phạm vi có giới hạn, có thể tạo nội dung liền kề |
| R2 | Có thể chuỗi hành động xuyên thành phần |
| R3 | Có thể tự mở rộng phạm vi, tạo tác vụ mới |

### 3. Rủi Ro Không Thể Đảo Ngược
> Hành động có thể hoàn tác không? Có tác động vĩnh viễn không?

| Mức | Mô Tả |
|-----|-------|
| R0 | Hoàn toàn có thể đảo ngược (chỉ đọc, định dạng) |
| R1 | Phần lớn có thể đảo ngược (thay đổi file cục bộ) |
| R2 | Một phần có thể đảo ngược (thay đổi database, gọi API) |
| R3 | Không thể đảo ngược (xóa dữ liệu, thông báo bên ngoài) |

### 4. Rủi Ro Khả Năng Diễn Giải
> Có khó giải thích, truy vết logic, audit nguyên nhân không?

| Mức | Mô Tả |
|-----|-------|
| R0 | Hoàn toàn minh bạch (biến đổi đơn giản) |
| R1 | Có thể truy vết (logic có thể theo dõi được) |
| R2 | Phức tạp (suy luận nhiều bước, khó audit) |
| R3 | Không rõ ràng (quyết định hộp đen, không có truy vết rõ) |

### 5. Rủi Ro Tác Động Bên Ngoài
> Nó có ảnh hưởng đến các hệ thống bên ngoài CVF, gọi API bên ngoài, tác động đến thế giới thực không?

| Mức | Mô Tả |
|-----|-------|
| R0 | Không có tác động bên ngoài |
| R1 | Truy cập bên ngoài chỉ đọc (lấy dữ liệu) |
| R2 | Ghi vào hệ thống bên ngoài (đẩy dữ liệu) |
| R3 | Thay đổi trạng thái bên ngoài (triển khai, xóa, thông báo) |

---

## Tổng Hợp Rủi Ro

**Quy tắc: Nếu BẤT KỲ khía cạnh nào đạt R3, rủi ro tổng hợp là R3.**

Ví dụ đánh giá:

```markdown
## Đánh Giá Rủi Ro: Pipeline Triển Khai Tự Động

| Khía Cạnh | Mức | Lý Do |
|-----------|:---:|-------|
| Quyền hạn | R1 | Tuân theo cấu hình được định trước |
| Mở rộng phạm vi | R1 | Tập hành động cố định |
| Không thể đảo ngược | R3 | Triển khai lên production (khó đảo ngược) |
| Khả năng diễn giải | R1 | Có thể truy vết qua log |
| Tác động bên ngoài | R3 | Thay đổi hệ thống đang chạy |

**Rủi ro tổng hợp: R3** (vì Không thể đảo ngược=R3 và Tác động bên ngoài=R3)
```

---

## Ánh Xạ Rủi Ro → Hành Vi Agent

| Mức Rủi Ro | Chế Độ Agent | Agent Có Thể Làm Gì |
|------------|-------------|----------------------|
| R0 | **Tự động** | Thực thi tự trị |
| R1 | **Tự động + Audit** | Thực thi có ghi nhật ký |
| R2 | **HITL** (Con người trong vòng lặp) | Đề xuất, con người phê duyệt |
| R3 | **Chỉ gợi ý** | Chỉ đọc, không thực thi |
| R4 | **Bị chặn** | Vô hiệu hóa |

---

## Quy Tắc Rủi Ro

Đây là các quy tắc rủi ro không thể thương lượng của CVF:

1. **Một khả năng không thể tự hạ mức rủi ro.** Chỉ GOVERNOR mới có thể hạ rủi ro.

2. **Tăng rủi ro → yêu cầu phiên bản mới.** Nếu một thay đổi làm tăng rủi ro, skill/contract phải được tăng phiên bản.

3. **Ngữ cảnh thời gian chạy có thể TĂNG rủi ro, không bao giờ HẠ.** Nếu một tác vụ là R1 theo thiết kế nhưng chạy trên môi trường production, nó có thể là R2 trên thực tế.

4. **Không có cơ chế tự hạ cấp.** Mức rủi ro do con người đặt, không được AI thương lượng.

5. **Thiếu khai báo rủi ro → Cao.** Nếu một tác vụ không có nhãn rủi ro, coi nó là R3 (trường hợp xấu nhất).

6. **Rủi ro không thể bị agent ghi đè.** Agent luôn hoạt động ở mức rủi ro được khai báo hoặc thấp hơn.

---

## Phân Loại Rủi Ro Thực Tế

### Tác Vụ Phổ Biến Theo Mức Rủi Ro

| Tác Vụ | Rủi Ro | Lý Do |
|--------|:------:|-------|
| Định dạng code | R0 | Không có tác dụng phụ |
| Viết unit test | R0 | Không ảnh hưởng production |
| Tạo file code mới | R1 | Tạo file, phạm vi có giới hạn |
| Sửa đổi code hiện có | R1 | Thay đổi cục bộ, có thể đảo ngược |
| Script migration database | R2 | Thay đổi dữ liệu, một phần có thể đảo ngược |
| Tích hợp thanh toán | R2 | Tác động tài chính, API bên ngoài |
| Triển khai lên production | R3 | Bên ngoài, khó đảo ngược |
| Xóa dữ liệu người dùng | R3 | Không thể đảo ngược |
| Gửi email cho người dùng | R3 | Bên ngoài, không thể thu hồi |
| Tự động phê duyệt PR | R4 | Bỏ qua governance |

### Hướng Dẫn Quyết Định Nhanh

```
Chỉ đọc, không có tác dụng phụ?                → R0
Chỉ tạo/sửa file cục bộ?                       → R1
Tương tác với database hoặc API bên ngoài?      → R2
Có thể thay đổi trạng thái production hoặc ảnh hưởng người dùng? → R3
Bỏ qua hoàn toàn đánh giá của con người?        → R4 (CHẶN)
```

---

## Ánh Xạ Phase — Rủi Ro

Mỗi phase CVF có mức rủi ro tối đa điển hình:

| Phase | Rủi Ro Tối Đa Điển Hình | Lý Do |
|-------|:------------------------:|-------|
| A — Khám Phá | R0 | Chỉ làm rõ ý định, không hành động |
| B — Thiết Kế | R0 | Đề xuất cách tiếp cận, không thực thi |
| C — Xây Dựng | R1–R2 | Tạo sản phẩm, có thể liên quan đến bên ngoài |
| D — Đánh Giá | R0 | Đánh giá, không thay đổi |

Nếu Phase C liên quan đến hành động R3 (ví dụ: triển khai lên production), cần có phê duyệt GOVERNOR và Cổng Cứng.

---

## Framework Đánh Giá CVF

Đối với UAT (Kiểm Tra Chấp Nhận Người Dùng), rủi ro được đánh giá qua 3 khía cạnh:

| Khía Cạnh | Câu Hỏi |
|-----------|---------|
| **Capability (C)** | Agent có hoạt động trong phạm vi được cho phép không? |
| **Validation (V)** | Đầu ra có được hỗ trợ bởi tham chiếu rõ ràng, có thể truy vết không? |
| **Failure Handling (F)** | Agent có từ chối / lưỡng lự / bịa đặt khi không chắc chắn không? |

Một agent được quản lý tốt:
- Giữ trong ranh giới khả năng (C)
- Cung cấp đầu ra có thể truy vết (V)
- Xử lý lỗi một cách trang nhã khi không chắc chắn (F)

---

## Rủi Ro Trong Skill

Mỗi skill có mức rủi ro trong metadata:

```markdown
| **Mức rủi ro** | R1 |
```

Điều này cho người dùng biết:
- Skill R0: Tự do sử dụng, không cần governance
- Skill R1: Khuyến nghị đánh giá ngang hàng
- Skill R2: Cần phê duyệt ARCHITECT trước khi dùng đầu ra
- Skill R3: GOVERNOR phải phê duyệt

Xem phần Hệ Thống Skill để biết cách skill được quản lý.

---

## Đọc Thêm

- Mô Hình Governance — Vai trò và quyền hạn theo mức rủi ro
- Quy Trình 4 Phase — Ánh xạ phase-rủi ro
- Hướng Dẫn Doanh Nghiệp — Quản lý rủi ro quy mô lớn
- Nguồn Risk Matrix — Định nghĩa ma trận rủi ro đầy đủ

---

*Cập nhật lần cuối: 15 tháng 2, 2026 | CVF v1.6*
