# GC-018 Continuation Candidate — W91-T1 Template Output Quality Benchmark

Memory class: SUMMARY_RECORD

> Date: 2026-04-15
> Tranche: W91-T1
> Class: PRODUCT / NON_CODER_VALUE / TEMPLATE_QUALITY_BENCHMARK
> Prerequisite status: CORPUS RESCREEN COMPLETE (D1–D5 filed 2026-04-15); Gate 1 MET

---

## Authorization Statement

W91-T1 is authorized to proceed.

All prerequisites are met:
- Gate 1 (≥8 HIGH_RISK patterns): MET — W90-T1 CLOSED DELIVERED
- Corpus rescreen: COMPLETE — 9 trusted benchmark wizards confirmed
- GC-044 guard: ACTIVE — template quality is a governed invariant
- Measurement standard: ACTIVE — `CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md`

---

## Scope

**Goal:** Evaluate whether CVF-governed AI output for the 9 trusted benchmark wizard templates is actionable and useful for non-coders.

**NOT in scope:**
- Provider switching or cross-provider comparison
- Template modification or corpus changes
- Any W92/W93/W94 scope
- Changing pass thresholds

---

## Template Set (Frozen — D3 Corpus Rescreen 2026-04-15)

9 trusted benchmark wizards. `api_design` is excluded (REVIEW_REQUIRED — see D3).

| # | Template ID | Category |
|---|---|---|
| 1 | `app_builder_wizard` | development |
| 2 | `business_strategy_wizard` | business |
| 3 | `content_strategy_wizard` | content |
| 4 | `data_analysis_wizard` | research |
| 5 | `marketing_campaign_wizard` | marketing |
| 6 | `product_design_wizard` | product |
| 7 | `research_project_wizard` | research |
| 8 | `security_assessment_wizard` | security |
| 9 | `system_design_wizard` | technical |

Note: Measurement standard §6.1 lists 10 templates including `api_design`. Per corpus rescreen D3, `api_design` is REVIEW_REQUIRED and is excluded from this benchmark run. This tranche runs 9 templates and scores against 9/9 pass target (adjusted from 8/10 → 7/9 usable for proportional equivalence).

---

## Canonical Input Packets (Frozen)

One canonical non-coder input per template. These are frozen as of this authorization.
Packets must not be changed after any run begins.

### T1 — app_builder_wizard
**Scenario:** Xây dựng app quản lý chi tiêu cá nhân
```
INTENT: Build a personal expense tracker app

APP DESCRIPTION:
Tôi muốn xây dựng một ứng dụng desktop chạy trên Windows để quản lý chi tiêu cá nhân.
Tính năng cần có: thêm giao dịch (tên, số tiền, danh mục, ngày), phân loại chi tiêu theo danh mục
(ăn uống, đi lại, mua sắm, hóa đơn), xem báo cáo tổng hợp theo tháng, xuất dữ liệu ra file.
Giao diện đơn giản, hoạt động offline, không cần đăng nhập.
Người dùng: chỉ tôi dùng cá nhân.

TARGET: Windows desktop app, offline, simple UI, offline-first

SUCCESS CRITERIA:
- App có thể chạy được trên Windows 10/11
- Có thể thêm, xem, xóa giao dịch
- Xem được tổng chi tiêu theo tháng và theo danh mục
- Hướng dẫn cài đặt rõ ràng cho người không biết code
```

### T2 — business_strategy_wizard
**Scenario:** Chiến lược mở rộng kinh doanh quần áo online
```
INTENT: Business expansion strategy for online fashion shop

BUSINESS CONTEXT:
Tôi có cửa hàng bán quần áo nữ online trên Shopee và Tiktok Shop.
Doanh thu hiện tại: khoảng 40 triệu VND/tháng, đang tăng trưởng 10% mỗi tháng.
Đang có 3 nhân viên, kho hàng tại nhà, vốn có thể đầu tư thêm 100 triệu VND.
Thị trường mục tiêu: phụ nữ 20-35 tuổi, phân khúc bình dân đến trung cấp.

QUESTION: Có nên mở thêm cửa hàng bán lẻ offline không?
Hoặc đầu tư vào kho + marketing online tiếp tục?

CONSTRAINTS: Ngân sách đầu tư tối đa 100 triệu, cần dòng tiền dương trong 6 tháng

SUCCESS CRITERIA:
- So sánh 2 phương án rõ ràng (online vs offline)
- Phân tích rủi ro và cơ hội cho từng phương án
- Khuyến nghị có căn cứ với lộ trình cụ thể
```

### T3 — content_strategy_wizard
**Scenario:** Content strategy cho brand thực phẩm sạch
```
INTENT: Content strategy for clean food brand

BRAND CONTEXT:
Tên brand: GreenBox - bán rau củ quả sạch, giao tận nhà
Target khách hàng: các bà mẹ 25-40 tuổi, quan tâm đến sức khỏe gia đình
Kênh hiện tại: Facebook Page (2000 followers), chưa có Instagram
Ngân sách content: 5 triệu VND/tháng
Điểm mạnh: nguồn nông trại uy tín, giao nhanh 2h, giá hợp lý

GOAL: Tăng đơn hàng 30% trong 3 tháng tới thông qua nội dung organic

SUCCESS CRITERIA:
- Lịch đăng content cho 1 tháng đầu
- Các chủ đề content phù hợp với target audience
- Cách tăng engagement và chuyển đổi
```

### T4 — data_analysis_wizard
**Scenario:** Phân tích dữ liệu bán hàng 6 tháng
```
INTENT: Analyze 6-month sales data to find top products and peak periods

DATASET DESCRIPTION:
Dữ liệu: 1,200 đơn hàng từ tháng 10/2025 đến tháng 3/2026
Các trường: mã đơn hàng, ngày đặt, tên sản phẩm, danh mục, số lượng, đơn giá, tổng tiền, tỉnh/thành
Dạng file: Excel với 1200 dòng, 8 cột

RESEARCH QUESTIONS:
1. Sản phẩm nào bán chạy nhất (theo doanh thu và số lượng)?
2. Tháng nào/tuần nào doanh số cao nhất?
3. Tỉnh thành nào có doanh thu tốt nhất?
4. Danh mục sản phẩm nào đóng góp nhiều nhất vào tổng doanh thu?

SUCCESS CRITERIA:
- Insights rõ ràng cho mỗi câu hỏi
- Khuyến nghị cụ thể về sản phẩm và thời điểm khuyến mãi
- Kế hoạch hành động dựa trên dữ liệu
```

### T5 — marketing_campaign_wizard
**Scenario:** Chiến dịch marketing cho app học tiếng Anh
```
INTENT: Marketing campaign for English learning mobile app

CAMPAIGN CONTEXT:
Sản phẩm: App học tiếng Anh "EnglishGo" - tập trung vào giao tiếp thực tế
Target: Học sinh THPT (15-18 tuổi) và sinh viên (18-24 tuổi) tại Việt Nam
Ngân sách: 50 triệu VND/tháng
Kênh chính: Facebook Ads, TikTok Ads
Goal: Đạt 5,000 downloads trong 30 ngày, CPI mục tiêu < 10,000 VND

UNIQUE SELLING POINT: Học qua hội thoại với AI, 15 phút/ngày đủ tiến bộ

SUCCESS CRITERIA:
- Campaign brief chi tiết cho tháng đầu
- Phân bổ ngân sách giữa Facebook và TikTok
- Ít nhất 3 ý tưởng creative (ad copy + visual concept)
- KPIs và cách đo lường
```

### T6 — product_design_wizard
**Scenario:** Thiết kế app đặt đồ ăn canteen trường đại học
```
INTENT: Design university canteen food ordering app

PRODUCT CONTEXT:
Ứng dụng: Đặt đồ ăn từ canteen Trường Đại học ABC
Người dùng: Sinh viên và nhân viên trường (~5,000 người)
Tính năng cốt lõi:
1. Xem menu theo ngày (sáng/trưa/chiều)
2. Đặt món trước giờ ăn 30 phút
3. Thanh toán qua ví điện tử hoặc tiền mặt
4. Theo dõi trạng thái đơn hàng
5. Đánh giá món ăn sau khi nhận

Platform: Mobile App (iOS + Android)
Timeline: Cần launch trong học kỳ tới (4 tháng)

SUCCESS CRITERIA:
- User personas và user journeys rõ ràng
- Wireframe concept cho 3 màn hình chính
- Tech requirements cơ bản
- Risk và constraints đã được xác định
```

### T7 — research_project_wizard
**Scenario:** Nghiên cứu về mạng xã hội và hành vi mua sắm gen Z
```
INTENT: Research project on social media impact on Gen Z shopping behavior

RESEARCH CONTEXT:
Chủ đề: Tác động của mạng xã hội đến quyết định mua sắm của Gen Z (18-25 tuổi) tại Việt Nam
Background: Nhiều thương hiệu đang tăng ngân sách marketing trên TikTok/Instagram, nhưng chưa rõ
hiệu quả thực sự đối với quyết định mua hàng.

RESEARCH QUESTIONS:
1. Gen Z tin vào loại nội dung nào nhất khi quyết định mua hàng?
2. Influencer marketing có ảnh hưởng đến quyết định mua thực sự không?
3. Sự khác biệt giữa browse content và conversion action là gì?

METHODOLOGY: Khảo sát online 200 người + phỏng vấn sâu 20 người

SUCCESS CRITERIA:
- Research proposal hoàn chỉnh
- Questionnaire draft cho khảo sát online
- Timeline thực hiện 3 tháng
- Output mong đợi rõ ràng
```

### T8 — security_assessment_wizard
**Scenario:** Đánh giá bảo mật website thương mại điện tử nhỏ
```
INTENT: Security assessment for small e-commerce website

SYSTEM CONTEXT:
Website bán hàng online: 500 users đăng ký, 50-100 đơn/ngày
Tech stack: WordPress + WooCommerce, hosting shared
Thanh toán: Momo và chuyển khoản ngân hàng (không lưu thẻ)
Dữ liệu lưu: tên, email, SĐT, địa chỉ giao hàng, lịch sử đơn hàng
Admin: chỉ có 1 người quản lý

CONCERNS:
- Không biết website có bị hack chưa
- Lo ngại về bảo mật thông tin khách hàng
- Không có background kỹ thuật về security

SUCCESS CRITERIA:
- Danh sách các rủi ro bảo mật cụ thể
- Mức độ ưu tiên (Critical/High/Medium/Low)
- Hướng dẫn khắc phục từng vấn đề theo ngôn ngữ đơn giản
- Checklist kiểm tra bảo mật định kỳ
```

### T9 — system_design_wizard
**Scenario:** Thiết kế hệ thống backend cho app đặt xe
```
INTENT: System design for ride-hailing app backend

SYSTEM CONTEXT:
Ứng dụng đặt xe 2 bánh (tương tự Grab Bike) trong 1 thành phố nhỏ
Scale: 100 tài xế, 1,000 khách hàng/ngày, peak 200 đặt xe/giờ
Features cần thiết:
1. Đặt xe và matching với tài xế gần nhất
2. Real-time tracking vị trí tài xế
3. Tính giá và thanh toán
4. Rating/review sau chuyến đi
5. Thông báo push cho tài xế và khách

CONSTRAINTS:
- Budget thấp, cần dùng serverless/managed services
- Team: 2 developers
- Launch trong 3 tháng

SUCCESS CRITERIA:
- Architecture diagram rõ ràng
- Tech stack recommendations có giải thích lý do
- Database design cơ bản
- Cost estimate sơ bộ
```

---

## Execution Rules

1. Provider: Alibaba only — model priority: qwen3-max → qwen2.5-14b-instruct → qwen-plus-2025-07-28 → qwen2.5-72b-instruct → qwen-max
2. Temperature: 0.7 (consistent with W86-T1 baseline)
3. Max tokens: 2048
4. 1 run per template (9 total)
5. No changes to input packets after first run starts
6. Dev-server governed path (CFG-B) is deferred — direct API calls (CFG-A equivalent) are used for output quality evaluation

---

## Scoring Authority

- Machine precheck: `output-validator.ts` criteria (not empty, no unsafe content, no intent mismatch)
- Human rubric: 4 dimensions × 0-2 each = 0-8 per output
  - Actionability, Specificity, Completeness, Governance-Safe Usefulness
- Pass threshold per output: ≥6/8 AND Actionability=2 AND Governance-Safe Usefulness=2
- Benchmark passes: ≥7/9 templates rated usable

---

## Tranche Boundary

- Starts: this document
- Code changes: NONE — documentation-only tranche with live API evidence
- Ends: post-run assessment + GC-026 sync + handoff update

---

*Authorization filed: 2026-04-15 — W91-T1 Template Output Quality Benchmark*
