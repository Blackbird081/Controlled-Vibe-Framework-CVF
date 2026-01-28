1. Purpose

Tài liệu này định nghĩa vòng đời chính thức của một Capability trong CVF v1.2, từ lúc đề xuất → sử dụng → nâng cấp → ngừng hoạt động.

Mục tiêu:

Chặn skill drift

Tránh “AI biết làm nhưng không ai chịu trách nhiệm”

Cho phép tiến hóa mà không phá governance

2. Canonical Lifecycle States

Mọi Capability BẮT BUỘC nằm trong đúng 1 trạng thái sau:

PROPOSED

APPROVED

ACTIVE

DEPRECATED

RETIRED

Không có trạng thái ngoài danh sách này.

3. State Definitions
3.1 PROPOSED

Capability mới được đề xuất

Chưa được resolve

BẮT BUỘC có:

Draft Skill Contract

Risk assessment sơ bộ

⛔ Không execution trong trạng thái này

3.2 APPROVED

Skill Contract đã được audit

Governance constraints hợp lệ

Có người chịu trách nhiệm phê duyệt

⛔ Chưa được dùng production
✔ Có thể test sandbox

3.3 ACTIVE

Capability hợp lệ để resolve

Được phép execution theo registry

Audit bắt buộc

✔ Trạng thái duy nhất cho production use

3.4 DEPRECATED

Capability vẫn tồn tại

KHÔNG khuyến khích sử dụng

Có lý do rõ ràng:

Rủi ro

Thay thế

Governance mismatch

⛔ Không được dùng cho quyết định mới
✔ Chỉ cho backward compatibility

3.5 RETIRED

Capability bị vô hiệu hóa hoàn toàn

Registry không resolve

Contract chỉ giữ để audit lịch sử

⛔ Không execution
⛔ Không reference mới

4. Versioning Rules (CRITICAL)
4.1 Contract Versioning

Skill Contract có version riêng

Format: MAJOR.MINOR

Thay đổi	Version
Thêm input/output	MAJOR
Siết governance	MAJOR
Làm rõ mô tả	MINOR
Sửa typo	MINOR
4.2 Capability ID Stability

CAPABILITY_ID KHÔNG BAO GIỜ đổi

Version gắn vào contract, không gắn vào ID

4.3 Breaking Changes

Breaking change → capability phải:

Bị DEPRECATED

Capability mới được tạo riêng

Không overwrite.

5. Lifecycle Transitions
From	To	Điều kiện
PROPOSED	APPROVED	Audit contract
APPROVED	ACTIVE	Registry đăng ký
ACTIVE	DEPRECATED	Governance decision
DEPRECATED	RETIRED	Explicit retirement
ACTIVE	RETIRED	Emergency only
6. Registry Interaction Rules

Registry CHỈ resolve ACTIVE

DEPRECATED phải cảnh báo

RETIRED = DENY

7. Skill Drift Prevention Rules

Một Capability bị coi là DRIFTING nếu:

Execution behavior khác contract

Input/output vượt spec

Governance bị bypass

➡ DRIFT = auto DEPRECATED pending review

8. Accountability

Mỗi Capability có:

Owner

Last audit date

Active contract version

Không owner = không ACTIVE

9. Canonical Status

Tài liệu này là chuẩn vòng đời duy nhất cho capability trong CVF v1.2.

Có thể copy cho domain khác mà không cần sửa core