1. Purpose

Định nghĩa van an toàn cho các tình huống khẩn cấp, không biến thành backdoor.

1. What Is Emergency Override

Emergency Override cho phép:

Chuyển trạng thái capability ngoài flow chuẩn

Bypass một số constraint trong thời gian ngắn

1. Who Can Trigger

Chỉ CVF Authority hoặc người được ủy quyền

Agent KHÔNG BAO GIỜ được trigger

1. What Can Be Overridden

✔ Allowed:

Lifecycle state (ACTIVE → RETIRED)

Temporary DENY execution

⛔ Forbidden:

Bypass audit

Bypass human accountability

Modify Skill Contract

1. Mandatory Audit

Mỗi Emergency Override BẮT BUỘC log:

timestamp

trigger_authority

reason

affected_capabilities

duration

postmortem_required (Yes)

1. Time Bound

Override luôn có expiration

Hết hạn → quay lại trạng thái trước đó hoặc RETIRED
