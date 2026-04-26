'use client';

import { useState } from 'react';
import { Template } from '@/types';
import { useUserContext } from './UserContext';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { useSettings } from './Settings';
import { evaluateSpecGate } from '@/lib/spec-gate';
import { evaluateEnforcement } from '@/lib/enforcement';
import { logEnforcementDecision } from '@/lib/enforcement-log';
import { CVF_WEB_REDESIGN_DNA_APPENDIX, shouldAttachCvfWebRedesignDna } from '@/lib/cvf-web-redesign-dna';
import { renderTemplateIntent } from '@/lib/template-intent';
import {
    autoDetectGovernance,
    buildGovernanceSpecBlock,
    isRiskAllowed,
    type GovernanceState,
    type AutoDetectResult,
} from '@/lib/governance-context';

interface SpecExportProps {
    template: Template;
    values: Record<string, string>;
    onClose?: () => void;
    onSendToAgent?: (spec: string) => void;
}

type ExportLanguage = 'en' | 'vi'; type ExportMode = 'simple' | 'governance' | 'full';

const modeLabels = {
    en: { modeLabel: 'Packet Mode', simpleMode: 'Brief', simpleDesc: 'Lightweight spec for copy/paste', governanceMode: 'Agent Handoff', governanceDesc: 'Recommended: build packet with guardrails', fullMode: 'CVF Guided Agent', fullDesc: '5-phase governed packet for complex work' },
    vi: { modeLabel: 'Chế độ packet', simpleMode: 'Brief', simpleDesc: 'Spec gọn để copy/paste', governanceMode: 'Handoff cho Agent', governanceDesc: 'Khuyến nghị: packet build có guardrails', fullMode: 'CVF Guided Agent', fullDesc: 'Packet 5 phase cho việc phức tạp' }
};

const specLabels = {
    en: { title: 'Agent Handoff Packet', description: 'Turn the filled brief into a packet another AI agent can execute without making the user manage hidden technical choices.', copyBtn: 'Copy to Clipboard', exportBtn: 'Export Packet (.md)', previewBtn: 'Show Preview', hidePreviewBtn: 'Hide Preview', copied: 'Copied!', langLabel: 'Export Language', quickPaste: 'Quick paste to:', instruction: 'Click "Copy to Clipboard" → Open ChatGPT/Claude/Gemini → Paste → let the agent continue from the packet', helpTitle: '📋 Export Agent Packet', helpDesc: 'Export a governed handoff packet for another AI assistant or agent.' },
    vi: { title: 'Packet Giao Việc Cho Agent', description: 'Biến brief đã điền thành packet để AI/agent khác thực thi, mà người dùng không cần tự xử lý các lựa chọn kỹ thuật ẩn phía sau.', copyBtn: 'Sao chép', exportBtn: 'Xuất packet (.md)', previewBtn: 'Xem trước', hidePreviewBtn: 'Ẩn xem trước', copied: 'Đã sao chép!', langLabel: 'Ngôn ngữ xuất', quickPaste: 'Mở nhanh:', instruction: 'Nhấn "Sao chép" → Mở ChatGPT/Claude/Gemini → Paste → để agent tiếp tục từ packet này', helpTitle: '📋 Xuất Agent Packet', helpDesc: 'Xuất packet handoff có governance để giao tiếp cho AI hoặc agent khác.' },
};

const governanceRules = {
    en: `
## ⚠️ CVF GOVERNANCE RULES (AI MUST FOLLOW)

### Stop Conditions
- **STOP** immediately if the request is unclear or ambiguous - ask for clarification
- **STOP** if the task requires access to systems you cannot reach
- **STOP** if you're making critical assumptions - confirm with user first

### Guardrails
- **DO NOT** execute code without explicit permission
- **DO NOT** make financial, legal, or medical recommendations without disclaimers
- **DO NOT** assume missing information - ask for it

### Response Requirements
- **EXPLAIN** your reasoning before conclusions
- **ACKNOWLEDGE** limitations and uncertainties
- **PROVIDE** sources or references when applicable
`,
    vi: `
## ⚠️ QUY TẮC CVF GOVERNANCE (AI PHẢI TUÂN THỦ)

### Điều kiện dừng (Stop Conditions)
- **DỪNG LẠI** ngay nếu yêu cầu không rõ ràng hoặc mơ hồ - hỏi lại để làm rõ
- **DỪNG LẠI** nếu task yêu cầu truy cập hệ thống mà bạn không có quyền
- **DỪNG LẠI** nếu bạn đang đưa ra giả định quan trọng - xác nhận với user trước

### Rào cản (Guardrails)
- **KHÔNG ĐƯỢC** thực thi code mà không có sự cho phép rõ ràng
- **KHÔNG ĐƯỢC** đưa ra khuyến nghị tài chính, pháp lý, y tế mà không có disclaimer
- **KHÔNG ĐƯỢC** giả định thông tin thiếu - hãy hỏi để lấy thông tin

### Yêu cầu phản hồi
- **GIẢI THÍCH** logic trước khi đưa ra kết luận
- **THỪA NHẬN** những giới hạn và điều không chắc chắn
- **CUNG CẤP** nguồn hoặc tham chiếu khi có thể
`
};

const executionConstraints = {
    en: `
## ⛔ Execution Constraints
- Do not invent missing inputs. If required inputs are missing, stop and ask for clarification.
- Follow the Output Template headings exactly (no reordering).
- Stay within the scope defined by the Task section.
- If data is unavailable, state it explicitly as "Unknown" instead of guessing.
`,
    vi: `
## ⛔ Ràng buộc thực thi
- Không tự bịa thông tin thiếu. Nếu thiếu input bắt buộc, phải dừng và hỏi lại.
- Tuân theo đúng thứ tự heading trong Output Template (không đảo thứ tự).
- Chỉ làm trong phạm vi Task đã khai báo.
- Nếu không có dữ liệu, ghi rõ "Chưa có dữ liệu" thay vì đoán.
`
};

const validationHooks = {
    en: `
## ✅ Validation Hooks
- Check required inputs against the Input Coverage table.
- Ensure every Expected Output section is present.
- Include a Success Criteria Check.
- If any item is missing, mark the result as "Not Ready" and list what's missing.
`,
    vi: `
## ✅ Validation Hooks
- Đối chiếu input bắt buộc theo bảng Input Coverage.
- Bảo đảm đủ mọi mục trong Expected Output.
- Có mục Success Criteria Check.
- Nếu thiếu mục nào, đánh dấu "Not Ready" và liệt kê phần thiếu.
`
};

const fullModeProtocol = {
    en: `
---

# 🚦 CVF FULL MODE PROTOCOL

> **CRITICAL**: You are now operating under CVF (Controlled Vibe Framework) Full Mode.
> This is NOT a suggestion - it's a MANDATORY protocol you MUST follow.

---

## 📌 CVF CORE PRINCIPLE

**"User describes WHAT they want → AI decides HOW and EXECUTES"**

- User = Problem owner, Evaluator
- AI = Solution architect, Decision maker, Executor

---

## 🔄 MANDATORY 5-PHASE PROCESS

You MUST complete each phase in order. NO SHORTCUTS.

---

### ═══════════════════════════════════════════════════════════
### PHASE A: INTAKE 🔍
### ═══════════════════════════════════════════════════════════

**YOUR ROLE**: Interpreter - understand the problem deeply

**MANDATORY ACTIONS:**
1. Restate what user wants in your own words
2. Identify the REAL goal (not just surface request)
3. List ALL assumptions you're making
4. Define what's IN scope and OUT of scope
5. Identify constraints (time, resources, tech)

**OUTPUT FORMAT (MUST PRODUCE):**
\`\`\`
## 📋 PHASE A: Intake Summary

### 1. My Understanding
[Restate user's goal in your words]

### 2. Assumptions I'm Making
- Assumption 1: ...
- Assumption 2: ...
(user will correct if wrong)

### 3. Scope Definition
✅ IN SCOPE:
- ...

❌ OUT OF SCOPE:
- ...

### 4. Constraints Identified
- ...

### 5. Questions for Clarification (if any)
- ...

---
⏸️ **CHECKPOINT A**: Do you confirm my understanding is correct?
\`\`\`

**⛔ HARD STOP**: Wait for user confirmation before Design.
- If user says "yes/đúng/ok/proceed" → Go to Design
- If user says "đúng rồi" or similar → Go to Design  
- If user corrects you → Update understanding, re-confirm
- If unclear → Ask specific questions

**FORBIDDEN IN PHASE A:**
- ❌ Proposing solutions
- ❌ Writing any code
- ❌ Making technical recommendations
- ❌ Skipping to build because "it's obvious"

---

### ═══════════════════════════════════════════════════════════
### PHASE B: DESIGN 📐
### ═══════════════════════════════════════════════════════════

**YOUR ROLE**: Architect - design the solution

**MANDATORY ACTIONS:**
1. Propose solution approach (high-level)
2. If multiple options exist: compare and CHOOSE the best one
3. YOU make the technical decisions (don't ask user to choose)
4. Document your decisions with reasoning

**OUTPUT FORMAT (MUST PRODUCE):**
\`\`\`
## 📐 PHASE B: Design Plan

### 1. Solution Approach
[High-level description of how you'll solve this]

### 2. Technical Decisions Made
| Decision | Choice | Reasoning |
|----------|--------|-----------|
| ... | ... | ... |

### 3. Implementation Plan
- Step 1: ...
- Step 2: ...
- Step 3: ...

### 4. Expected Deliverables
- [ ] Deliverable 1
- [ ] Deliverable 2

### 5. Potential Risks
- Risk 1: [mitigation]

---
⏸️ **CHECKPOINT B**: Approve this design to proceed to Build phase?
\`\`\`

**⛔ HARD STOP**: Wait for user approval before Build.

**FORBIDDEN IN PHASE B:**
- ❌ Asking "Which option do you prefer?" (YOU decide!)
- ❌ Requesting user to make technical choices
- ❌ Starting to build before approval

---

### ═══════════════════════════════════════════════════════════
### PHASE C: BUILD 🔨
### ═══════════════════════════════════════════════════════════

**YOUR ROLE**: Builder - execute with quality

**MANDATORY ACTIONS:**
1. Build incrementally (one component at a time)
2. Follow your approved design (no unauthorized changes)
3. Each output must be COMPLETE and USABLE
4. If you encounter issues → solve them, don't stop and ask

**OUTPUT FORMAT:**
\`\`\`
## 🔨 PHASE C: Build Output

### Deliverable 1: [Name]
[Complete, usable output]

### Deliverable 2: [Name]
[Complete, usable output]

### Implementation Notes
- Note 1: ...

---
✅ Build complete. Proceeding to Review phase.
\`\`\`

**FORBIDDEN IN PHASE C:**
- ❌ Stopping mid-build to ask trivial questions
- ❌ Producing incomplete outputs ("I'll continue if you want...")
- ❌ Deviating from approved design without explanation

---

### ═══════════════════════════════════════════════════════════
### PHASE D: REVIEW ✅
### ═══════════════════════════════════════════════════════════

**YOUR ROLE**: Quality owner - ensure excellence

**MANDATORY ACTIONS:**
1. Self-review against success criteria
2. Present clear summary of what was delivered
3. Highlight any deviations or decisions made during build
4. Ask for user evaluation

**OUTPUT FORMAT:**
\`\`\`
## ✅ PHASE D: Review & Delivery

### 1. Delivery Summary
| Deliverable | Status | Notes |
|-------------|--------|-------|
| ... | ✅ Done | ... |

### 2. Success Criteria Check
- [x] Criterion 1: Met
- [x] Criterion 2: Met

### 3. Decisions Made During Build
- Decision: [what & why]

### 4. Known Limitations
- ...

---
🎯 **FINAL CHECKPOINT**: 
- Accept this delivery?
- Any revisions needed?
\`\`\`

### PHASE E: FREEZE 🔒

**ONLY AFTER ACCEPTANCE:**
1. Confirm acceptance status
2. Capture baseline / review artifact / comparison evidence
3. List open follow-ups
4. State that the current run is now frozen

**FREEZE OUTPUT FORMAT:**
\`\`\`
## 🔒 PHASE E: Freeze Record

### 1. Acceptance Status
[Accepted / Needs follow-up]

### 2. Evidence
- Baseline / delta / review artifact

### 3. Open Follow-ups
- ...

---
✅ Scope frozen for this run.
\`\`\`

---

## ⚠️ AI ROLE CONSTRAINTS (ALWAYS ENFORCED)

### ✅ YOU ARE:
| Role | Meaning |
|------|---------|
| **EXECUTOR** | You DO the work, user EVALUATES |
| **DECISION MAKER** | YOU make technical decisions |
| **QUALITY OWNER** | YOU ensure output quality |
| **VIBE CODER** | You turn user's vision into reality |

### ❌ YOU ARE NOT:
- An advisor who only suggests options
- A tool waiting for step-by-step instructions
- Someone who shifts responsibility to user

### 🚫 FORBIDDEN ACTIONS (WILL VIOLATE CVF):
1. ❌ "Which option do you prefer?" → YOU choose!
2. ❌ "Should I continue?" → YES, until done!
3. ❌ "Let me know if you want me to..." → Just DO it!
4. ❌ Skipping phases for "simple" tasks
5. ❌ Producing partial/incomplete outputs
6. ❌ Asking user to write code or design

### ✅ REQUIRED ACTIONS:
1. Complete each phase with proper output format
2. Document all decisions with reasoning
3. Confirm understanding BEFORE executing
4. Deliver COMPLETE, USABLE outputs
5. Self-review before presenting

---

## 🚀 START NOW

Begin with **PHASE A: Intake**.
Produce the Phase A intake output format and wait for confirmation.
`,
    vi: `
---

# 🚦 CVF FULL MODE PROTOCOL

> **QUAN TRỌNG**: Bạn đang hoạt động theo CVF (Controlled Vibe Framework) Full Mode.
> Đây KHÔNG phải gợi ý - đây là quy trình BẮT BUỘC bạn PHẢI tuân theo.

---

## 📌 NGUYÊN TẮC CỐT LÕI CVF

**"User mô tả CÁI GÌ họ muốn → AI quyết định CÁCH LÀM và THỰC THI"**

- User = Chủ sở hữu vấn đề, Người đánh giá
- AI = Kiến trúc sư giải pháp, Người quyết định, Người thực thi

---

## 🔄 QUY TRÌNH 5 PHASE BẮT BUỘC

Bạn PHẢI hoàn thành từng phase theo thứ tự. KHÔNG TẮT ĐƯỜNG.

---

### ═══════════════════════════════════════════════════════════
### PHASE A: TIẾP NHẬN 🔍
### ═══════════════════════════════════════════════════════════

**VAI TRÒ**: Interpreter - hiểu sâu vấn đề

**HÀNH ĐỘNG BẮT BUỘC:**
1. Diễn đạt lại yêu cầu của user bằng lời của bạn
2. Xác định MỤC TIÊU THỰC SỰ (không chỉ bề mặt)
3. Liệt kê TẤT CẢ giả định bạn đang đưa ra
4. Định nghĩa scope: NẰM TRONG vs NGOÀI phạm vi
5. Xác định ràng buộc (thời gian, nguồn lực, kỹ thuật)

**OUTPUT FORMAT (PHẢI TẠO RA):**
\`\`\`
## 📋 PHASE A: Tóm tắt Tiếp nhận

### 1. Hiểu biết của tôi
[Diễn đạt lại mục tiêu của user]

### 2. Giả định tôi đang đưa ra
- Giả định 1: ...
- Giả định 2: ...
(user sẽ sửa nếu sai)

### 3. Định nghĩa Scope
✅ TRONG PHẠM VI:
- ...

❌ NGOÀI PHẠM VI:
- ...

### 4. Ràng buộc đã xác định
- ...

### 5. Câu hỏi cần làm rõ (nếu có)
- ...

---
⏸️ **CHECKPOINT A**: Bạn xác nhận tôi hiểu đúng chưa?
\`\`\`

**⛔ DỪNG CỨNG**: Chờ user xác nhận trước khi sang Design.
- Nếu user nói "đúng/ok/được/tiếp tục" → Sang Design
- Nếu user sửa → Cập nhật hiểu biết, xác nhận lại
- Nếu không rõ → Hỏi câu hỏi cụ thể

**CẤM TRONG PHASE A:**
- ❌ Đề xuất giải pháp
- ❌ Viết bất kỳ code nào
- ❌ Đưa ra khuyến nghị kỹ thuật
- ❌ Nhảy sang build vì "rõ ràng rồi"

---

### ═══════════════════════════════════════════════════════════
### PHASE B: THIẾT KẾ 📐
### ═══════════════════════════════════════════════════════════

**VAI TRÒ**: Kiến trúc sư - thiết kế giải pháp

**HÀNH ĐỘNG BẮT BUỘC:**
1. Đề xuất hướng tiếp cận (high-level)
2. Nếu có nhiều lựa chọn: so sánh và CHỌN cái tốt nhất
3. BẠN đưa ra quyết định kỹ thuật (không hỏi user chọn)
4. Ghi nhận quyết định với lý do

**OUTPUT FORMAT (PHẢI TẠO RA):**
\`\`\`
## 📐 PHASE B: Kế hoạch Thiết kế

### 1. Hướng Giải pháp
[Mô tả high-level cách bạn sẽ giải quyết]

### 2. Quyết định Kỹ thuật đã đưa ra
| Quyết định | Lựa chọn | Lý do |
|------------|----------|-------|
| ... | ... | ... |

### 3. Kế hoạch Thực hiện
- Bước 1: ...
- Bước 2: ...
- Bước 3: ...

### 4. Deliverables dự kiến
- [ ] Deliverable 1
- [ ] Deliverable 2

### 5. Rủi ro tiềm ẩn
- Rủi ro 1: [cách giảm thiểu]

---
⏸️ **CHECKPOINT B**: Duyệt thiết kế này để tiến hành Build?
\`\`\`

**⛔ DỪNG CỨNG**: Chờ user duyệt trước khi sang Build.

**CẤM TRONG PHASE B:**
- ❌ Hỏi "Bạn thích option nào?" (BẠN quyết định!)
- ❌ Yêu cầu user đưa ra lựa chọn kỹ thuật
- ❌ Bắt đầu build trước khi được duyệt

---

### ═══════════════════════════════════════════════════════════
### PHASE C: THỰC THI 🔨
### ═══════════════════════════════════════════════════════════

**VAI TRÒ**: Builder - thực thi với chất lượng

**HÀNH ĐỘNG BẮT BUỘC:**
1. Build từng bước (một component một lúc)
2. Tuân theo thiết kế đã duyệt (không thay đổi tự ý)
3. Mỗi output phải HOÀN CHỈNH và SỬ DỤNG ĐƯỢC
4. Nếu gặp vấn đề → giải quyết, không dừng lại hỏi

**OUTPUT FORMAT:**
\`\`\`
## 🔨 PHASE C: Output Build

### Deliverable 1: [Tên]
[Output hoàn chỉnh, sử dụng được]

### Deliverable 2: [Tên]
[Output hoàn chỉnh, sử dụng được]

### Ghi chú Implementation
- Ghi chú 1: ...

---
✅ Build hoàn thành. Chuyển sang Review phase.
\`\`\`

**CẤM TRONG PHASE C:**
- ❌ Dừng giữa chừng để hỏi câu hỏi không quan trọng
- ❌ Tạo output không hoàn chỉnh ("Tôi sẽ tiếp tục nếu bạn muốn...")
- ❌ Đi chệch thiết kế đã duyệt mà không giải thích

---

### ═══════════════════════════════════════════════════════════
### PHASE D: ĐÁNH GIÁ ✅
### ═══════════════════════════════════════════════════════════

**VAI TRÒ**: Quality owner - đảm bảo chất lượng

**HÀNH ĐỘNG BẮT BUỘC:**
1. Tự review theo success criteria
2. Trình bày tóm tắt rõ ràng những gì đã delivery
3. Nêu bật các quyết định đã đưa ra trong quá trình build
4. Hỏi user đánh giá

**OUTPUT FORMAT:**
\`\`\`
## ✅ PHASE D: Review & Bàn giao

### 1. Tóm tắt Delivery
| Deliverable | Trạng thái | Ghi chú |
|-------------|------------|---------|
| ... | ✅ Xong | ... |

### 2. Kiểm tra Success Criteria
- [x] Tiêu chí 1: Đạt
- [x] Tiêu chí 2: Đạt

### 3. Quyết định đã đưa ra trong Build
- Quyết định: [gì & tại sao]

### 4. Hạn chế đã biết
- ...

---
🎯 **CHECKPOINT CUỐI**: 
- Chấp nhận delivery này?
- Cần sửa đổi gì không?
\`\`\`

### PHASE E: KHÓA KẾT QUẢ 🔒

**CHỈ THỰC HIỆN SAU KHI ĐƯỢC CHẤP NHẬN:**
1. Xác nhận trạng thái chấp nhận
2. Ghi lại baseline / review artifact / bằng chứng đối soát
3. Liệt kê việc còn mở
4. Nêu rõ lần chạy hiện tại đã được khóa

**FREEZE OUTPUT FORMAT:**
\`\`\`
## 🔒 PHASE E: Biên bản Khóa Kết quả

### 1. Trạng thái chấp nhận
[Đã chấp nhận / Cần follow-up]

### 2. Bằng chứng
- Baseline / delta / review artifact

### 3. Việc còn mở
- ...

---
✅ Phạm vi của lần chạy này đã được khóa.
\`\`\`

---

## ⚠️ RÀNG BUỘC VAI TRÒ AI (LUÔN ÁP DỤNG)

### ✅ BẠN LÀ:
| Vai trò | Ý nghĩa |
|---------|---------|
| **EXECUTOR** | Bạn LÀM việc, user ĐÁNH GIÁ |
| **DECISION MAKER** | BẠN đưa ra quyết định kỹ thuật |
| **QUALITY OWNER** | BẠN đảm bảo chất lượng output |
| **VIBE CODER** | Bạn biến tầm nhìn của user thành hiện thực |

### ❌ BẠN KHÔNG PHẢI:
- Cố vấn chỉ đề xuất options
- Tool chờ hướng dẫn từng bước
- Người đẩy trách nhiệm cho user

### 🚫 HÀNH ĐỘNG BỊ CẤM (SẼ VI PHẠM CVF):
1. ❌ "Bạn thích option nào?" → BẠN chọn!
2. ❌ "Tôi có nên tiếp tục?" → CÓ, cho đến khi xong!
3. ❌ "Cho tôi biết nếu bạn muốn tôi..." → Cứ LÀM đi!
4. ❌ Bỏ qua phase cho task "đơn giản"
5. ❌ Tạo output không hoàn chỉnh
6. ❌ Yêu cầu user viết code hoặc thiết kế

### ✅ HÀNH ĐỘNG BẮT BUỘC:
1. Hoàn thành mỗi phase với output format đúng
2. Ghi nhận tất cả quyết định với lý do
3. Xác nhận hiểu đúng TRƯỚC KHI thực thi
4. Deliver output HOÀN CHỈNH, SỬ DỤNG ĐƯỢC
5. Tự review trước khi trình bày

---

## 🚀 BẮT ĐẦU NGAY

Bắt đầu với **PHASE A: Tiếp nhận**.
Tạo output theo format intake và chờ xác nhận.
`
};

function generateSpec(
    template: Template,
    values: Record<string, string>,
    lang: ExportLanguage,
    mode: ExportMode,
    userContext?: string
): string {
    const date = new Date().toISOString().split('T')[0];

    const userInputLines = Object.entries(values)
        .filter(([, value]) => value && value.trim())
        .map(([key, value]) => {
            const field = template.fields.find(f => f.id === key);
            const label = field?.label || key;
            return `- **${label}:** ${value}`;
        })
        .join('\n');

    const expectedOutput = template.outputExpected
        ?.map(item => `- ${item}`)
        .join('\n') || '- Comprehensive analysis\n- Actionable recommendations';
    const outputTemplate = template.outputTemplate
        ? renderTemplateIntent(template.outputTemplate, values)
        : (template.outputExpected?.length
        ? template.outputExpected.map(section => `## ${section}\n- ...`).join('\n\n')
        : '');

    const labels = lang === 'vi' ? {
        specTitle: mode === 'full' ? 'CVF Agent Handoff Packet (GUIDED MODE)' : mode === 'governance' ? 'CVF Agent Handoff Packet' : 'CVF Brief Packet',
        generated: 'Ngày tạo',
        templateLabel: 'Template',
        category: 'Danh mục',
        mode: 'Chế độ',
        context: 'Bối cảnh',
        packetPurpose: 'Mục đích packet',
        userInput: 'Thông tin đầu vào',
        inputCoverage: 'Độ đầy đủ đầu vào',
        task: 'Nhiệm vụ',
        expectedOutput: 'Định dạng kết quả mong muốn',
        outputTemplate: 'Template đầu ra',
        nonCoderStandard: 'Chuẩn Thành Công Cho Non-Coder',
        governedResponseRules: 'Quy tắc Phản hồi Governed',
        knowledgePreference: 'Ưu tiên Knowledge Context',
        instructions: 'Hướng dẫn cho AI',
        instructionList: [
            'Giải quyết tất cả các tiêu chí thành công',
            'Tuân theo cấu trúc định dạng kết quả',
            'Đưa ra insights và khuyến nghị cụ thể',
            'Sử dụng ngôn ngữ chuyên nghiệp, rõ ràng',
            'Không tự bịa thông tin thiếu; hỏi lại khi cần',
        ],
        footer: 'CVF Agent Platform - Sao chép spec này và paste vào AI yêu thích của bạn',
        noInput: '(Chưa có thông tin)',
        noRequired: '(Không có input bắt buộc)',
        modeSimple: 'Brief',
        modeGovernance: 'Handoff cho Agent',
        modeFull: 'CVF Guided Agent (5-Phase)',
    } : {
        specTitle: mode === 'full' ? 'CVF Agent Handoff Packet (GUIDED MODE)' : mode === 'governance' ? 'CVF Agent Handoff Packet' : 'CVF Brief Packet',
        generated: 'Generated',
        templateLabel: 'Template',
        category: 'Category',
        mode: 'Mode',
        context: 'Context',
        packetPurpose: 'Packet Purpose',
        userInput: 'User Input',
        inputCoverage: 'Input Coverage',
        task: 'Task',
        expectedOutput: 'Expected Output Format',
        outputTemplate: 'Output Template',
        nonCoderStandard: 'CVF Non-Coder Success Standard',
        governedResponseRules: 'Governed Response Rules',
        knowledgePreference: 'Knowledge Context Preference',
        instructions: 'Instructions for AI',
        instructionList: [
            'Addresses all the success criteria listed in the Task section',
            'Follows the Expected Output Format structure',
            'Provides actionable insights and recommendations',
            'Uses clear, professional language',
            'Do not invent missing inputs; ask for clarification when needed',
        ],
        footer: 'CVF Agent Platform - Copy this spec and paste into your preferred AI',
        noInput: '(No input provided)',
        noRequired: '(No required inputs)',
        modeSimple: 'Brief',
        modeGovernance: 'Agent Handoff',
        modeFull: 'CVF Guided Agent (5-Phase)',
    };

    const intent = renderTemplateIntent(template.intentPattern, values);
    const cvfWebDnaAppendix = shouldAttachCvfWebRedesignDna({
        templateId: template.id,
        templateName: template.name,
    }) ? CVF_WEB_REDESIGN_DNA_APPENDIX : '';

    const modeLabel = mode === 'full' ? labels.modeFull : mode === 'governance' ? labels.modeGovernance : labels.modeSimple;

    const requiredFields = template.fields.filter(field => field.required);
    const specGate = evaluateSpecGate(requiredFields, values);
    const missingRequired = specGate.missing;
    const inputCoverage = requiredFields.length
        ? [
            '| Field | Provided |',
            '| --- | --- |',
            ...requiredFields.map(field => {
                const value = values[field.id];
                const provided = value && value.trim() && value.trim().toLowerCase() !== 'n/a';
                return `| ${field.label} | ${provided ? '✅' : '❌'} |`;
            })
        ].join('\n')
        : labels.noRequired;

    let spec = `---
# ${labels.specTitle}
**${labels.generated}:** ${date}
**${labels.templateLabel}:** ${template.name}
**${labels.category}:** ${template.category}
**${labels.mode}:** ${modeLabel}
---

## 📋 ${labels.context}

**${labels.templateLabel}:** ${template.icon} ${template.name}

${template.description}

---

## 🤝 ${labels.packetPurpose}

${lang === 'vi'
        ? `- Packet này được viết cho AI/agent khác đọc và tiếp tục thực thi.
- Người dùng cuối không cần hiểu framework, stack, hay implementation details ẩn phía sau.
- Agent nhận packet phải tự chuyển brief thành quyết định implementation phù hợp trong phạm vi guardrails.`
        : `- This packet is written for another AI/agent to read and continue execution.
- The end user should not need to understand hidden frameworks, stacks, or implementation details.
- The receiving agent must convert the brief into implementation decisions inside the provided guardrails.`}

---

## 📝 ${labels.userInput}

${userInputLines || labels.noInput}
${userContext ? `
---

## 👤 User Context

${userContext}` : ''}

---

## ✅ ${labels.inputCoverage}

${inputCoverage}
${missingRequired.length ? `\n\n**${lang === 'vi' ? 'Thiếu input bắt buộc' : 'Missing Required Inputs'}:** ${missingRequired.map((field: { label: string }) => field.label).join(', ')}` : ''}

---

## 🎯 ${labels.task}

${intent}

---

## 📤 ${labels.expectedOutput}

${expectedOutput}

${outputTemplate ? `\n---\n\n## 📐 ${labels.outputTemplate}\n\n\`\`\`markdown\n${outputTemplate}\n\`\`\`\n` : ''}
`;

    spec += `
---

${cvfWebDnaAppendix ? `${cvfWebDnaAppendix}\n\n---\n\n` : ''}

${executionConstraints[lang]}

---

${validationHooks[lang]}
`;

    spec += `
---

## 🧭 ${labels.nonCoderStandard}

${lang === 'vi'
            ? `- Kết quả phải đủ actionable cho non-coder, không chỉ mô tả chung chung.
- Phải bám sát input đã cung cấp, không rơi về lời khuyên generic.
- Phải cover đủ output shape chính của task từ đầu đến cuối.
- Agent phải tự chọn kỹ thuật/phương án ẩn phía sau nếu việc đó không làm thay đổi risk hay business intent.
- Phải governance-safe: không gợi ý bypass, shortcut nguy hiểm, hay giả định ngầm.
- Nếu không thể hoàn thành an toàn, phải đưa ra safe next step rõ ràng thay vì kết thúc bế tắc.`
            : `- The result must be actionable for a non-coder, not just descriptive.
- It must stay tailored to the provided inputs instead of drifting into generic advice.
- It must cover the main requested output shape end-to-end.
- The receiving agent should choose hidden implementation details itself unless that would materially change risk or business intent.
- It must remain governance-safe: no bypass suggestions, unsafe shortcuts, or hidden assumptions.
- If the task cannot be completed safely, provide the clearest safe next step instead of ending in a dead end.`}

---

## 🛡️ ${labels.governedResponseRules}

${lang === 'vi'
            ? `- Nếu task được phép, trả lời rõ ràng và đi thẳng vào việc.
- Nếu task phải BLOCK hoặc NEEDS_APPROVAL, giải thích lý do bằng ngôn ngữ dễ hiểu.
- Khi bị chặn hoặc cần approval, phải nêu đường đi tiếp an toàn mà user có thể thực hiện.
- Làm rõ implication về risk / review / approval, không giấu trong thuật ngữ mơ hồ.`
            : `- If the task is allowed, answer directly and clearly.
- If the task should be BLOCKED or marked NEEDS_APPROVAL, explain why in plain language.
- When blocked or approval-gated, provide a safe next-step path the user can actually follow.
- Make risk, review, or approval implications visible instead of burying them in jargon.`}

---

## 🧠 ${labels.knowledgePreference}

${lang === 'vi'
            ? `- Nếu user cung cấp domain facts, policy nội bộ, hoặc project context đã govern, hãy ưu tiên phần context đó hơn kiến thức tổng quát.
- Nếu thiếu knowledge context quan trọng, hãy nói rõ cần bổ sung gì thay vì đoán.
- Không tự bịa domain facts riêng tư hoặc thông tin nội bộ chưa được cung cấp.`
            : `- If the user provides governed domain facts, internal policy text, or project-specific context, prioritize that context over generic training knowledge.
- If important knowledge context is missing, state exactly what context would improve the result instead of guessing.
- Do not invent proprietary domain facts or internal details that were not provided.`}
`;

    if (mode === 'governance') {
        spec += governanceRules[lang];
    }
    if (mode === 'full') {
        spec += fullModeProtocol[lang];
    }
    if (mode === 'governance' || mode === 'full') {
        const detected = autoDetectGovernance({
            templateCategory: template.category,
            messageText: intent,
            exportMode: mode,
        });
        const govState: GovernanceState = {
            phase: detected.phase,
            role: detected.role,
            riskLevel: detected.riskLevel,
            toolkitEnabled: true,
        };
        spec += buildGovernanceSpecBlock(govState, lang);
    }

    spec += `
---

## 💡 ${labels.instructions}

${labels.instructionList.map((item, i) => `${i + 1}. ${item}`).join('\n')}

---

> **${labels.footer}**
`;

    return spec;
}

export function SpecExport({ template, values, onClose, onSendToAgent }: SpecExportProps) {
    const { settings } = useSettings();
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [exportLang, setExportLang] = useState<ExportLanguage>(() => settings.preferences.defaultLanguage);
    const [exportMode, setExportMode] = useState<ExportMode>(() => settings.preferences.defaultExportMode);
    const [specGateError, setSpecGateError] = useState(false);
    const { getContextPrompt } = useUserContext();

    const labels = specLabels[exportLang];
    const modes = modeLabels[exportLang];
    const userContextStr = getContextPrompt();
    const spec = generateSpec(template, values, exportLang, exportMode, userContextStr);

    const requiredFields = template.fields.filter(field => field.required);
    const enforcement = evaluateEnforcement({
        mode: exportMode,
        content: spec,
        budgetOk: true,
        specFields: requiredFields,
        specValues: values,
    });
    const specGate = enforcement.specGate || evaluateSpecGate(requiredFields, values);
    const missingRequired = specGate.missing;
    const specGateStatus: 'PASS' | 'CLARIFY' | 'FAIL' = specGate.status;
    const canSendToAgent = specGateStatus === 'PASS';

    const autoDetected: AutoDetectResult = autoDetectGovernance({
        templateCategory: template.category,
        messageText: Object.values(values).join(' '),
        exportMode: exportMode,
    });
    const riskExceedsPhase = (exportMode === 'governance' || exportMode === 'full')
        && !isRiskAllowed(autoDetected.riskLevel, autoDetected.phase);
    const specGateLabels = exportLang === 'vi'
        ? {
            pass: 'Spec Gate: PASS — Đủ input để thực thi',
            clarify: 'Spec Gate: CLARIFY — Thiếu input bắt buộc, cần bổ sung',
            fail: 'Spec Gate: FAIL — Không đủ dữ liệu để tạo spec',
            missing: 'Thiếu input bắt buộc',
        }
        : {
            pass: 'Spec Gate: PASS — Ready to execute',
            clarify: 'Spec Gate: CLARIFY — Missing required inputs',
            fail: 'Spec Gate: FAIL — Not enough data to generate spec',
            missing: 'Missing required inputs',
        };

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(spec);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleExportToFile = () => {
        const blob = new Blob([spec], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cvf-spec-${template.id}-${exportMode}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {labels.helpTitle}
                </h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        ✕
                    </button>
                )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {labels.description}
            </p>

            <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">{modes.modeLabel}:</div>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => setExportMode('simple')}
                        className={`p-3 rounded-lg text-left transition-all border-2 ${exportMode === 'simple'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                            📝 {modes.simpleMode}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {modes.simpleDesc}
                        </div>
                    </button>
                    <button
                        onClick={() => setExportMode('governance')}
                        className={`p-3 rounded-lg text-left transition-all border-2 ${exportMode === 'governance'
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                            ⚠️ {modes.governanceMode}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {modes.governanceDesc}
                        </div>
                    </button>
                    <button
                        onClick={() => setExportMode('full')}
                        className={`p-3 rounded-lg text-left transition-all border-2 ${exportMode === 'full'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                            🚦 {modes.fullMode}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {modes.fullDesc}
                        </div>
                    </button>
                </div>

                <div className="mt-4">
                    <WorkflowVisualizer mode={exportMode} compact />
                </div>
            </div>

            {exportMode === 'full' && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-700 dark:text-green-300">
                        <strong>🚦 CVF Full Mode:</strong> {exportLang === 'vi'
                            ? 'Agent sẽ tuân theo quy trình 5 phase (Intake → Design → Build → Review → Freeze) với đầy đủ governance rules. Dùng cho việc phức tạp hoặc có rủi ro cao hơn.'
                            : 'The agent will follow the 5-phase process (Intake → Design → Build → Review → Freeze) with full governance rules. Use this for more complex or higher-risk work.'
                        }
                    </p>
                </div>
            )}

            {(exportMode === 'governance' || exportMode === 'full') && (
                <div className={`mb-4 p-3 rounded-lg border ${riskExceedsPhase
                    ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                    : 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                            🤖 {exportLang === 'vi' ? 'CVF Auto-Detect' : 'CVF Auto-Detect'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                            ${autoDetected.confidence === 'high'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : autoDetected.confidence === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                            {autoDetected.confidence}
                        </span>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                        📋 Phase: <strong>{autoDetected.phase}</strong> | 👤 Role: <strong>{autoDetected.role}</strong> | ⚠️ Risk: <strong>{autoDetected.riskLevel}</strong>
                    </p>
                    {riskExceedsPhase && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                            🚫 {exportLang === 'vi'
                                ? `Risk ${autoDetected.riskLevel} vượt quá giới hạn cho phase ${autoDetected.phase}. Agent nhận packet sẽ được cảnh báo.`
                                : `Risk ${autoDetected.riskLevel} exceeds the limit for phase ${autoDetected.phase}. The receiving agent will be warned.`
                            }
                        </p>
                    )}
                </div>
            )}
            {exportMode === 'governance' && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        <strong>⚠️ {exportLang === 'vi' ? 'Handoff cho Agent' : 'Agent Handoff'}:</strong> {exportLang === 'vi'
                            ? 'Thêm guardrails và stop conditions để agent khác có thể build từ packet này an toàn hơn. Đây là chế độ khuyến nghị cho non-coder.'
                            : 'Adds guardrails and stop conditions so another agent can build safely from this packet. This is the recommended mode for non-coders.'
                        }
                    </p>
                </div>
            )}

            <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">{labels.langLabel}:</div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setExportLang('vi')}
                        className={`px-3 py-1 text-sm rounded ${exportLang === 'vi'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        🇻🇳 Tiếng Việt
                    </button>
                    <button
                        onClick={() => setExportLang('en')}
                        className={`px-3 py-1 text-sm rounded ${exportLang === 'en'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        🇺🇸 English
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
                <button
                    onClick={handleCopyToClipboard}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${copied
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {copied ? (
                        <>
                            <span>✓</span>
                            {labels.copied}
                        </>
                    ) : (
                        <>
                            <span>📋</span>
                            {labels.copyBtn}
                        </>
                    )}
                </button>

                <button
                    onClick={handleExportToFile}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                    <span>💾</span>
                    {labels.exportBtn}
                </button>

                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                    <span>{showPreview ? '🙈' : '👁️'}</span>
                    {showPreview ? labels.hidePreviewBtn : labels.previewBtn}
                </button>

                {onSendToAgent && (
                    <button
                        onClick={() => {
                            logEnforcementDecision({
                                source: 'spec_export',
                                mode: exportMode,
                                enforcement,
                                context: {
                                    templateId: template.id,
                                    templateName: template.name,
                                },
                            });
                            if (!canSendToAgent) {
                                setSpecGateError(true);
                                return;
                            }
                            onSendToAgent(spec);
                            onClose?.();
                        }}
                        disabled={!canSendToAgent}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-md ${canSendToAgent
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                    >
                        <span>🤖</span>
                        {exportLang === 'vi' ? 'Gửi Packet cho Agent' : 'Send Packet to Agent'}
                    </button>
                )}
            </div>

            <div className={`mb-4 p-3 rounded-lg border ${specGateStatus === 'PASS'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : specGateStatus === 'CLARIFY'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
            >
                <div className="text-xs font-semibold">
                    {specGateStatus === 'PASS' && specGateLabels.pass}
                    {specGateStatus === 'CLARIFY' && specGateLabels.clarify}
                    {specGateStatus === 'FAIL' && specGateLabels.fail}
                </div>
                {missingRequired.length > 0 && (
                    <div className="text-xs mt-1">
                        {specGateLabels.missing}: {missingRequired.map(field => field.label).join(', ')}
                    </div>
                )}
                {specGateError && !canSendToAgent && (
                    <div className="text-xs mt-1 font-semibold">
                        {exportLang === 'vi'
                            ? 'Không thể gửi đến Agent khi Spec chưa đạt.'
                            : 'Cannot send to Agent until Spec passes.'}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs text-gray-500 dark:text-gray-400">{labels.quickPaste}</span>
                <a
                    href="https://chat.openai.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                >
                    ChatGPT ↗
                </a>
                <a
                    href="https://claude.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-800"
                >
                    Claude ↗
                </a>
                <a
                    href="https://gemini.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                    Gemini ↗
                </a>
            </div>

            {showPreview && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                        {spec}
                    </pre>
                </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>{exportLang === 'vi' ? 'Hướng dẫn' : 'Instructions'}:</strong> {labels.instruction}
                </p>
            </div>
        </div>
    );
}

export function generateCompleteSpec(
    template: Template,
    values: Record<string, string>,
    userIntent?: string
): string {
    return generateSpec(template, values, 'vi', 'simple', userIntent);
}
