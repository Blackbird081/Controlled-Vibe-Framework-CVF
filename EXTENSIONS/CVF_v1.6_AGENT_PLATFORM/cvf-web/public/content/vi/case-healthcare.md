# Nghiên cứu tình huống 2: SaaS Y tế — CVF cho chẩn đoán hỗ trợ bằng AI

**Ngày:** Tháng 1 năm 2026  
**Ngành:** Công nghệ Y tế  
**Quy mô nhóm:** 25 (5 Kỹ sư ML, 8 Nhân viên Lâm sàng, 12 Sản phẩm/Hỗ trợ)  
**Phiên bản CVF:** v1.2

---

## Thách thức

**Tình huống:**  
MediScan, một SaaS y tế cung cấp sàng lọc X-quang hỗ trợ bằng AI, đối mặt với:
- **Rủi ro trách nhiệm pháp lý**: Bệnh viện lo ngại về khuyến nghị AI ảnh hưởng đến quyết định của bác sĩ
- **Hỗn loạn xác thực**: Không có cách chuẩn hóa để xác thực đầu ra AI trước khi sử dụng lâm sàng
- **Ma sát tích hợp**: Các hệ thống bệnh viện khác nhau có yêu cầu governance khác nhau
- **Bất định pháp lý**: FDA yêu cầu bằng chứng về sự giám sát của con người cho tất cả quyết định AI

**Khoảng trống:** AI đang tạo ra các đề xuất chẩn đoán, nhưng không có framework nào đảm bảo bác sĩ vẫn là người ra quyết định.

---

## Giải pháp: CVF v1.2 với Skill Contract

### Kiến trúc

**Thách thức chính:** Biến AI thành công cụ hỗ trợ, không bao giờ là người ra quyết định tự chủ

```
Patient Scan Upload
    ↓
INPUT_SPEC validation (scan quality, metadata)
    ↓
Skill Contract: diagnose_radiology (R3 - CRITICAL)
    ↓
Execute: AI generates 3 possible diagnoses + confidence scores
    ↓
Trace: Which anatomical regions flagged, confidence by region, model version used
    ↓
Human Review: Radiologist reviews AI suggestions + original scan
    ↓
OUTPUT_SPEC: Radiologist decision + relationship to AI output
    ↓
Patient Report + Liability acknowledgment
```

### Triển khai (Tuần 1-4)

**Tuần 1-2: Thiết kế Skill Contract**  
Tạo contract `diagnose_radiology`:
- Đầu vào: Hình ảnh DICOM, thông tin nhân khẩu bệnh nhân, phim chụp trước đó, lịch sử lâm sàng
- Đầu ra: Top 3 chẩn đoán, độ tin cậy cho mỗi chẩn đoán, phát hiện giải phẫu, khuyến nghị (chấp nhận AI / yêu cầu ý kiến thứ hai / từ chối)
- Mức rủi ro: **R3** — tác động ở cấp hệ thống đến chăm sóc bệnh nhân
- Phê duyệt con người: **BẮT BUỘC** — bác sĩ phải xem xét và phê duyệt
- Kiểm toán: **NGHIÊM TRỌNG** — ghi vào hệ thống EMR bệnh viện
- Trách nhiệm: Bác sĩ vẫn là người ra quyết định, AI là hỗ trợ

**Tuần 3: Framework xác thực**  
Thiết lập OUTPUT_SPEC với xác thực:
- Bác sĩ X-quang phải xác nhận/sửa đổi từng phát hiện AI
- Điểm tin cậy phải đạt ngưỡng (>85%) HOẶC yêu cầu đánh giá thủ công
- So sánh phim chụp trước (AI phát hiện thay đổi nhưng bác sĩ có thể không đồng ý)
- Báo cáo cuối cùng phải bao gồm: tuyên bố "Đã đánh giá với sự hỗ trợ của AI"

**Tuần 4: Tích hợp + Tuân thủ**
- Kết nối với hệ thống EHR bệnh viện (tuân thủ FHIR)
- Thiết lập ghi nhật ký kiểm toán vào hệ thống tuân thủ bệnh viện
- Tạo tài liệu trách nhiệm chứng minh sự giám sát của bác sĩ
- Đào tạo bác sĩ X-quang về quy trình mới (đào tạo nửa ngày)

---

## Kết quả

### Chỉ số lâm sàng (thử nghiệm 90 ngày với 4 bệnh viện)

| Chỉ số | Trước | Sau | Tác động |
|--------|-------|-----|----------|
| **Thời gian/phim chụp** | 8-10 phút (bác sĩ X-quang đơn độc) | 6-7 phút (AI + bác sĩ X-quang) | -25% thời gian |
| **Độ chính xác chẩn đoán** | 94% cơ sở | 97.5% (với đề xuất AI) | +3.5 điểm % |
| **Phát hiện bị bỏ sót** | 2% cơ sở | 0.5% | -75% |
| **Sự tự tin của bác sĩ** | Cao (bác sĩ X-quang giàu kinh nghiệm) | Rất cao (AI như mạng an toàn) | +30% |
| **Sự cố trách nhiệm** | 3 trong 12 tháng | 0 trong 3 tháng (thử nghiệm) | Đang theo dõi ở quy mô lớn |
| **Kiệt sức của bác sĩ X-quang** | Cao (mệt mỏi trong ngày dài) | Thấp hơn (AI phát hiện trường hợp biên) | Giảm (định tính) ↓ |

### Tác động kinh doanh

**Sự chấp nhận của bệnh viện:**
- 4 bệnh viện mở rộng thành 12 bệnh viện trong 6 tháng
- Khối lượng trường hợp trung bình: +15% (bác sĩ X-quang có thể xử lý nhiều hơn)
- Thông lượng không chỉ là tốc độ — còn giảm lỗi (giảm trách nhiệm pháp lý)

**Thành công pháp lý:**
- Cuộc họp tiền nộp hồ sơ FDA: Phê duyệt kiến trúc (human-in-loop + contract R3)
- Hội đồng y tế tiểu bang: Không có lo ngại (nhật ký kiểm toán rõ ràng)
- Đội pháp lý bệnh viện: Thoải mái với cấu trúc trách nhiệm

---

## Các thành phần CVF được sử dụng

| Thành phần | Mục đích |
|-----------|---------|
| **Skill Contract (R3)** | ✅ Bắt buộc phê duyệt bác sĩ cho mỗi chẩn đoán |
| **INPUT_SPEC** | ✅ Yêu cầu chất lượng phim chụp, metadata bắt buộc |
| **OUTPUT_SPEC** | ✅ Định dạng chẩn đoán, tuyên bố trách nhiệm, chữ ký bác sĩ |
| **Phê duyệt con người** | ✅ Không có quyết định AI nào mà không có đánh giá của bác sĩ |
| **Ghi nhật ký kiểm toán** | ✅ Mọi đề xuất được ghi vào EMR bệnh viện để tuân thủ |
| **Mô hình trách nhiệm** | ✅ Rõ ràng: Bác sĩ = người ra quyết định, AI = hỗ trợ |
| **Phần mở rộng v1.2** | ✅ Quản lý phiên bản khả năng, nhập skill bên ngoài |

---

## Bài học chính

**1. Contract R3 = An toàn bệnh nhân**  
Mức rủi ro cao nhất với phê duyệt con người bắt buộc là thiết yếu cho sự tin tưởng của cơ quan quản lý

**2. Nhật ký kiểm toán = Giảm trách nhiệm**  
Bản ghi đầy đủ về đề xuất AI + quyết định bác sĩ = bảo vệ pháp lý mạnh hơn

**3. Tích hợp quy trình làm việc rất quan trọng**  
Chỉ đơn giản chèn AI vào quy trình hiện tại không hiệu quả — phải thiết kế lại quy trình với AI là công cụ hỗ trợ

**4. Minh bạch xây dựng niềm tin**  
Bác sĩ X-quang ban đầu hoài nghi; cho họ thấy: "AI phát hiện những gì bạn bỏ sót, bạn phát hiện lỗi của AI"

---

## Nợ kỹ thuật & Tương lai

**Thách thức hiện tại:**
- Các bệnh viện khác nhau muốn OUTPUT_SPEC khác nhau (một số muốn điểm tin cậy ML, số khác không)
- Tích hợp với hơn 20 hệ thống EMR = nỗ lực kỹ thuật đáng kể
- Tuân thủ pháp lý khác nhau theo khu vực pháp lý (FDA vs hội đồng tiểu bang)

**Giai đoạn tiếp theo (Năm 2):**
- Đăng ký khả năng cho skill có phiên bản (chẩn đoán khác nhau theo hệ cơ quan)
- Nhập skill bên ngoài (bệnh viện có thể gắn dữ liệu đào tạo tùy chỉnh)
- Dashboard giám sát cho vòng phản hồi của bác sĩ X-quang

---

## Khuyến nghị

**Cho AI y tế:**
- **Luôn sử dụng contract R3** cho hỗ trợ quyết định lâm sàng
- **Phê duyệt con người bắt buộc** không phải tùy chọn — đó là bảo hiểm trách nhiệm
- **OUTPUT_SPEC rõ ràng** tiết kiệm hàng tháng trao đổi qua lại với cơ quan quản lý
- **Nhật ký kiểm toán là bạn đồng hành** — bản ghi đầy đủ bảo vệ cả nhà cung cấp và bệnh nhân

**Thời gian:** 4-6 tuần cho tích hợp y tế (phụ thuộc vào độ phức tạp EHR)

---

*Cập nhật lần cuối: 15 tháng 2 năm 2026 | CVF v1.6*
