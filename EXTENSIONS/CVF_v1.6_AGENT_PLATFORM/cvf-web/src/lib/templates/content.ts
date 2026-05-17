import { Template } from '@/types';

export const contentTemplates: Template[] = [
    {
        id: 'content_strategy_wizard',
        name: '✍️ Chiến lược Nội dung',
        icon: '✍️',
        description: 'Multi-step wizard tạo Content Strategy với governed packet và live path để đối soát',
        category: 'content',
        difficulty: 'medium',
        fields: [],
        intentPattern: '',
        outputExpected: ['Content Strategy', 'Editorial Calendar', 'Content Pillars', 'Channel Plan'],
    },
    {
        id: 'documentation',
        name: 'Tài liệu Kỹ thuật',
        icon: '📝',
        description: 'Biến knowledge rời rạc thành tài liệu handoff hoặc hướng dẫn dễ hiểu để người không chuyên vẫn dùng và bàn giao tiếp được',
        category: 'content',
        fields: [
            { id: 'subject', type: 'text', label: 'Tài liệu này nói về việc gì?', placeholder: 'Tên quy trình, tính năng hoặc phần việc cần bàn giao', required: true, section: 'required', hint: 'Đặt tên theo góc nhìn người đọc, không cần dùng thuật ngữ kỹ thuật.', example: 'Quy trình tiếp nhận khách hàng mới và gửi báo giá' },
            { id: 'currentNotes', type: 'textarea', label: 'Bạn đang có những ghi chú / thông tin gì?', placeholder: 'Dán các ý chính, ghi chú rời, bước làm hiện tại, câu hỏi thường gặp...', required: true, rows: 6, section: 'required', hint: 'Có thể rất thô cũng được. AI sẽ sắp xếp lại thành tài liệu có cấu trúc.', example: 'Khách đi từ form đăng ký -> sales gọi lại trong 2h -> nếu đủ điều kiện thì gửi báo giá trong ngày. Hay bị hỏi: bao lâu triển khai, cần chuẩn bị gì.' },
            { id: 'readerGoal', type: 'text', label: 'Người đọc cần làm được gì sau khi đọc?', placeholder: 'Kết quả thực tế người đọc cần đạt được', required: true, section: 'required', hint: 'Đây là mục tiêu thực dụng của tài liệu.', example: 'Nhân viên mới có thể xử lý lead đầu vào mà không phải hỏi lại team lead.' },
            { id: 'audience', type: 'select', label: 'Ai sẽ dùng tài liệu này?', options: ['Người mới tiếp nhận', 'Người vận hành nội bộ', 'Khách hàng / end user', 'Quản lý / approver'], default: 'Người vận hành nội bộ', required: false, section: 'advanced', hint: 'Chọn nhóm người đọc chính để AI điều chỉnh giọng điệu và độ chi tiết.' },
            { id: 'mustPreserve', type: 'textarea', label: 'Những thuật ngữ / bước nào phải giữ nguyên?', placeholder: 'Tên tài liệu, tên bước, rule nội bộ, cam kết pháp lý...', required: false, rows: 2, section: 'advanced', hint: 'Nếu có tên gọi nội bộ hoặc câu chữ bắt buộc giữ nguyên, ghi ở đây.', example: 'Giữ nguyên tên gói Enterprise Plus, SLA phản hồi 2 giờ, và checklist đủ điều kiện lead.' },
        ],
        intentPattern: `INTENT:
Tôi muốn biến phần knowledge / ghi chú này thành tài liệu dễ dùng và dễ handoff.

CHỦ ĐỀ:
[subject]

NGUỒN GHI CHÚ / THÔNG TIN:
[currentNotes]

NGƯỜI ĐỌC CẦN LÀM ĐƯỢC:
[readerGoal]

AI SẼ DÙNG TÀI LIỆU NÀY CHO:
[audience]

NHỮNG GÌ PHẢI GIỮ NGUYÊN:
[mustPreserve]

SUCCESS CRITERIA:
- Analyze the subject and organize content so non-experts can follow each step
- Chỉ ra bước làm, required artifacts/fields, rule cần nhớ, QA checks, và lỗi hay gặp
- Có decision branches và escalation rules khi tình huống rẽ nhánh
- Kết thúc bằng handoff acceptance checklist rõ ràng
- Giữ phần overview/assumptions ngắn; ưu tiên procedure, QA và recovery có thể làm ngay
- Không yêu cầu người đọc hiểu API hoặc developer internals

OUTPUT FORMAT (use these exact section headings in English):
## What This Document Is For
## Required Inputs, Artifacts, And Fields
## Step-By-Step Procedure
## Decision Branches
## QA Checks
## Common Failure Modes And Recovery
## Final Handoff Acceptance Checklist`,
        outputExpected: ['Mục tiêu tài liệu', 'Required inputs/artifacts/fields', 'Step-by-step procedure', 'Decision branches', 'QA checks', 'Failure recovery', 'Final handoff acceptance checklist'],
        difficulty: 'easy',
        outputTemplate: `# SOP And Handoff Runbook

## 1. What This Document Is For
- Topic, in one sentence
- Who should use it
- What they should achieve
- Done state
- Key assumptions, max 3 bullets

## 2. Required Inputs, Artifacts, And Fields
| Required Item | Source/Owner | Where It Lives | Needed Before Step | Acceptance Check |
| --- | --- | --- | --- | --- |

## 3. Step-By-Step Procedure
| Step | Owner/Role | Trigger | Action | Required Artifact Or Field | Done Signal | Acceptance Check |
| --- | --- | --- | --- | --- | --- | --- |

## 4. Decision Branches
| Situation | Decision Rule | Next Action | Owner/Role | Escalate When |
| --- | --- | --- | --- | --- |

## 5. QA Checks
- Pre-handoff QA:
- Data/content QA:
- User-facing QA:
- Audit/evidence to retain:

## 6. Common Failure Modes And Recovery
| Situation | How To Notice It | What To Do | When To Escalate |
| --- | --- | --- | --- |

## 7. Final Handoff Acceptance Checklist
- [ ] Required artifacts or fields are complete
- [ ] Procedure steps have visible done signals
- [ ] QA checks have pass/fail evidence
- [ ] Escalation rule is clear
- [ ] Open assumptions are marked for confirmation`,
        sampleOutput: `# SOP And Handoff Runbook

## 1. What This Document Is For
- This guide explains how the team receives a new inbound lead and turns it into a same-day quotation.
- It is written for new sales operators.
- Done state: the lead is qualified, quoted, or escalated with notes.
- Key assumptions: lead form and CRM access are available; the approved quote template exists.

## 2. Required Inputs, Artifacts, And Fields
| Required Item | Source/Owner | Where It Lives | Needed Before Step | Acceptance Check |
| --- | --- | --- | --- | --- |
| Lead form | Website form | CRM lead record | Step 1 | Required fields are present |
| Quote template | Sales lead | Shared drive | Step 4 | Approved version is used |

## 3. Step-By-Step Procedure
| Step | Owner/Role | Trigger | Action | Required Artifact Or Field | Done Signal | Acceptance Check |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sales operator | New form arrives | Check whether the submission is complete | Lead form | Lead status updated | Missing fields are marked |
| 2 | Sales operator | Lead is complete | Call the lead within 2 hours | Phone/email | Call note stored | Project type, budget, timeline captured |

## 4. Decision Branches
| Situation | Decision Rule | Next Action | Owner/Role | Escalate When |
| --- | --- | --- | --- | --- |
| Missing budget | Budget not stated | Ask for range before quote | Sales operator | Lead refuses or asks for procurement terms |

## 5. QA Checks
- Lead status, notes, and next action are visible in CRM.
- Quote uses approved package wording.

## 6. Common Failure Modes And Recovery
| Situation | How To Notice It | What To Do | When To Escalate |
| --- | --- | --- | --- |
| Lead asks for pricing too early | Qualification fields are blank | Explain quick intake first | Legal/procurement terms appear |

## 7. Final Handoff Acceptance Checklist
- [ ] Lead status updated
- [ ] Qualification notes stored
- [ ] Quote sent or escalation recorded
- [ ] Open assumptions are marked`,
    },
    {
        id: 'faq_outline',
        name: 'FAQ Outline',
        icon: '❓',
        description: 'Tạo FAQ có câu hỏi, câu trả lời trực tiếp, edge cases và publish readiness checks',
        category: 'content',
        fields: [
            { id: 'subject', type: 'text', label: 'FAQ nói về việc gì?', placeholder: 'VD: Checkout flow cho khóa học online', required: true, section: 'required', hint: 'Tên workflow, sản phẩm hoặc phần cần giải thích', example: 'Checkout flow cho khóa học online' },
            { id: 'context', type: 'textarea', label: 'Bối cảnh / ghi chú', placeholder: 'Dán thông tin thô, câu hỏi hay gặp, policy...', required: true, rows: 6, section: 'required', hint: 'Thông tin để viết câu trả lời cụ thể', example: 'Người mua chọn khóa học, nhập email, thanh toán, nhận link enroll. Hay hỏi về refund và lỗi thanh toán.' },
            { id: 'audience', type: 'text', label: 'Audience', placeholder: 'VD: khách hàng mới, support operators', required: false, section: 'advanced', hint: 'Ai sẽ đọc FAQ', example: 'Customers and support operators' },
            { id: 'mustCover', type: 'textarea', label: 'Must cover', placeholder: 'Payment, access, troubleshooting...', required: false, rows: 3, section: 'advanced', hint: 'Các nhóm câu hỏi phải có', example: 'Payment, enrollment access, refund, troubleshooting' },
        ],
        intentPattern: `INTENT:
Tôi muốn tạo FAQ outline cho [subject].

CONTEXT:
[context]

AUDIENCE: [audience]
MUST COVER:
[mustCover]

OUTPUT FORMAT:
- Audience and Scope → FAQ Entries → Edge Cases → Publish Readiness Checks

SUCCESS CRITERIA:
- Có 8-12 câu hỏi cụ thể
- Câu trả lời trực tiếp, dễ hiểu
- Bao gồm payment/access/troubleshooting khi liên quan
- Có checklist xác nhận có thể publish`,
        outputExpected: ['Audience and Scope', 'FAQ Entries', 'Edge Cases', 'Publish Readiness Checks'],
        difficulty: 'easy',
        outputTemplate: `# FAQ Outline

## 1. Audience And Scope
- Who this FAQ is for:
- What workflow or product area it covers:

## 2. FAQ Entries
| Question | Direct Answer | When It Applies | Owner/Source To Confirm |
| --- | --- | --- | --- |
| 1. | | | |
| 2. | | | |

## 3. Must-Include Edge Cases
- Payment/access/troubleshooting questions:
- Policy or wording that must stay unchanged:

## 4. Publish Readiness Checks
- [ ] Answers are direct and understandable by the target audience
- [ ] Missing facts are marked as assumptions or confirmation items
- [ ] Support/operator escalation path is clear`,
    },
    {
        id: 'acceptance_criteria',
        name: 'Acceptance Criteria',
        icon: '✅',
        description: 'Viết acceptance criteria quan sát được, test được, kèm data/state/error expectations',
        category: 'content',
        fields: [
            { id: 'feature', type: 'text', label: 'Feature / workflow', placeholder: 'VD: Dashboard weekly sales', required: true, section: 'required', hint: 'Tính năng hoặc workflow cần kiểm tra', example: 'Dashboard hiển thị weekly sales, conversion, open tasks' },
            { id: 'context', type: 'textarea', label: 'Bối cảnh / yêu cầu', placeholder: 'Dữ liệu, trạng thái, role, constraints...', required: true, rows: 6, section: 'required', hint: 'Thông tin để viết tiêu chí test được', example: 'Dashboard cần cho operator kiểm weekly sales, conversion, open tasks trước handoff.' },
            { id: 'users', type: 'text', label: 'Users / roles', placeholder: 'VD: operator, manager, customer', required: false, section: 'advanced', hint: 'Vai trò dùng tính năng', example: 'Non-technical operator and manager' },
            { id: 'states', type: 'textarea', label: 'States to cover', placeholder: 'Empty, error, loading, permission...', required: false, rows: 3, section: 'advanced', hint: 'Các state cần test', example: 'Empty state, stale data, permission denied, failed refresh' },
        ],
        intentPattern: `INTENT:
Tôi muốn viết acceptance criteria cho [feature].

CONTEXT:
[context]

USERS / ROLES: [users]
STATES TO COVER:
[states]

OUTPUT FORMAT:
- Scope Under Test → Criteria By Workflow → Empty/Error/Edge States → Handoff Checks

SUCCESS CRITERIA:
- Mỗi tiêu chí quan sát được và test được
- Có Given/When/Then hoặc pass/fail check
- Bao gồm data source, refresh/state, empty/error expectations
- Người không chuyên có thể xác nhận trước handoff`,
        outputExpected: ['Scope Under Test', 'Criteria By Workflow', 'Empty/Error/Edge States', 'Handoff Checks'],
        difficulty: 'easy',
        outputTemplate: `# Acceptance Criteria Packet

## 1. Scope Under Test
- Feature/workflow:
- User or operator outcome:

## 2. Criteria By Workflow
| Workflow Area | Given | When | Then | Data/State Requirement | Pass/Fail Check |
| --- | --- | --- | --- | --- | --- |
| 1. | | | | | |
| 2. | | | | | |

## 3. Empty, Error, And Edge States
- Empty state:
- Error state:
- Permission/access state:
- Refresh or data-latency state:

## 4. Handoff Checks
- [ ] Each criterion is observable
- [ ] Each criterion can be verified by a non-technical operator or tester
- [ ] Open assumptions are listed`,
    },
    {
        id: 'email_template',
        name: 'Mẫu Email',
        icon: '📧',
        description: 'Tạo email chuyên nghiệp',
        category: 'content',
        fields: [
            { id: 'purpose', type: 'text', label: 'Mục đích email', placeholder: 'VD: Follow-up sau meeting', required: true, section: 'required', hint: 'Tóm tắt mục đích chính của email', example: 'Follow-up sau cuộc họs với khách hàng về dự án mới' },
            { id: 'context', type: 'textarea', label: 'Context', placeholder: 'Tình huống cụ thể...', required: true, rows: 4, section: 'required', hint: 'Mô tả tình huống, mối quan hệ, và những gì cần nhắc đến trong email', example: 'Đã họs với Giám đốc công ty ABC về giải pháp CRM. Họ quan tâm gói Enterprise, cần báo giá chi tiết.' },
            { id: 'recipient', type: 'text', label: 'Người nhận', placeholder: 'VD: Khách hàng, đồng nghiệp...', required: false, section: 'advanced', hint: 'Vai trò / chức danh của người nhận', example: 'Giám đốc CNTT công ty ABC' },
            { id: 'tone', type: 'select', label: 'Tone', options: ['Formal', 'Professional', 'Friendly', 'Urgent'], default: 'Professional', required: false, section: 'advanced', hint: 'Formal = rất trang trọng, Professional = chuyên nghiệp, Friendly = thân thiện' },
        ],
        intentPattern: `INTENT:
Tôi muốn soạn email [purpose].

CONTEXT:
[context]

RECIPIENT: [recipient]
TONE: [tone]

OUTPUT FORMAT:
- Subject Line | Opening | Body | Call to Action | Closing

SUCCESS CRITERIA:
- Chuyên nghiệp
- Rõ ràng call-to-action
- Phù hợp context`,
        outputExpected: ['Subject Line', 'Opening', 'Body', 'Call to Action', 'Closing'],
        outputTemplate: `## Email Output

**Subject:**

**Opening:**

**Body:**

**CTA:**

**Closing:**`,
        difficulty: 'easy',
    },
];
