# CVF Baselines

Đây là nơi lưu:

- baseline snapshots
- freeze records
- compatibility baselines
- tester baselines
- canonical comparison anchors
- baseline delta/addendum records when a full re-snapshot is not needed

Đặc điểm:

- dùng làm mốc đối soát cho các batch về sau
- không sửa đè lịch sử; ưu tiên addendum hoặc delta
- sau mỗi fix/update có thay đổi thực chất, baseline phải được cập nhật bằng snapshot mới hoặc delta/addendum
- log test thông thường không thay thế baseline update

Rule nguồn:

- `governance/toolkit/05_OPERATION/CVF_BASELINE_UPDATE_GUARD.md`

Không đặt vào đây:

- review diễn giải dài
- roadmap cải tiến
- tutorial hoặc guide
