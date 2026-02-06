'use client';

import { useState } from 'react';
import { Template } from '@/types';
import { useUserContext } from './UserContext';
import { WorkflowVisualizer } from './WorkflowVisualizer';

interface SpecExportProps {
    template: Template;
    values: Record<string, string>;
    onClose?: () => void;
    onSendToAgent?: (spec: string) => void;
}

type ExportLanguage = 'en' | 'vi';
type ExportMode = 'simple' | 'governance' | 'full';

const modeLabels = {
    en: {
        modeLabel: 'Export Mode',
        simpleMode: 'Simple',
        simpleDesc: 'Quick prompts, no rules',
        governanceMode: 'With Rules',
        governanceDesc: 'Add stop conditions & guardrails',
        fullMode: 'CVF Full Mode',
        fullDesc: '4-Phase protocol with full governance',
    },
    vi: {
        modeLabel: 'Chế độ xuất',
        simpleMode: 'Đơn giản',
        simpleDesc: 'Prompt nhanh, không có quy tắc',
        governanceMode: 'Có Quy tắc',
        governanceDesc: 'Thêm stop conditions & guardrails',
        fullMode: 'CVF Full Mode',
        fullDesc: 'Quy trình 4-Phase đầy đủ',
    }
};

const specLabels = {
    en: {
        title: 'Complete Spec Export',
        description: 'Copy the complete spec and paste into ChatGPT, Claude, Gemini or your preferred AI.',
        copyBtn: 'Copy to Clipboard',
        exportBtn: 'Export to File (.md)',
        previewBtn: 'Show Preview',
        hidePreviewBtn: 'Hide Preview',
        copied: 'Copied!',
        langLabel: 'Export Language',
        quickPaste: 'Quick paste to:',
        instruction: 'Click "Copy to Clipboard" → Open ChatGPT/Claude/Gemini → Paste → Enter',
        helpTitle: '📋 Export Spec (Prompt)',
        helpDesc: 'Export prompt to paste into your preferred AI assistant.',
    },
    vi: {
        title: 'Xuất Spec Hoàn Chỉnh',
        description: 'Sao chép spec hoàn chỉnh để paste vào ChatGPT, Claude, Gemini hoặc AI yêu thích của bạn.',
        copyBtn: 'Sao chép',
        exportBtn: 'Xuất file (.md)',
        previewBtn: 'Xem trước',
        hidePreviewBtn: 'Ẩn xem trước',
        copied: 'Đã sao chép!',
        langLabel: 'Ngôn ngữ xuất',
        quickPaste: 'Mở nhanh:',
        instruction: 'Nhấn "Sao chép" → Mở ChatGPT/Claude/Gemini → Paste → Enter',
        helpTitle: '📋 Xuất Spec (Prompt)',
        helpDesc: 'Xuất prompt để paste vào AI.',
    },
};

// CVF Governance Rules for Mode 2
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

// CVF Full Mode: 4-Phase Protocol - ENHANCED VERSION
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

## 🔄 MANDATORY 4-PHASE PROCESS

You MUST complete each phase in order. NO SHORTCUTS.

---

### ═══════════════════════════════════════════════════════════
### PHASE A: DISCOVERY 🔍
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
## 📋 PHASE A: Discovery Summary

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

**⛔ HARD STOP**: Wait for user confirmation before Phase B.
- If user says "yes/đúng/ok/proceed" → Go to Phase B
- If user says "đúng rồi" or similar → Go to Phase B  
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

**⛔ HARD STOP**: Wait for user approval before Phase C.

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

Begin with **PHASE A: Discovery**.
Produce the Phase A output format and wait for confirmation.
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

## 🔄 QUY TRÌNH 4-PHASE BẮT BUỘC

Bạn PHẢI hoàn thành từng phase theo thứ tự. KHÔNG TẮT ĐƯỜNG.

---

### ═══════════════════════════════════════════════════════════
### PHASE A: KHÁM PHÁ 🔍
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
## 📋 PHASE A: Tóm tắt Khám phá

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

**⛔ DỪNG CỨNG**: Chờ user xác nhận trước khi sang Phase B.
- Nếu user nói "đúng/ok/được/tiếp tục" → Sang Phase B
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

**⛔ DỪNG CỨNG**: Chờ user duyệt trước khi sang Phase C.

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

Bắt đầu với **PHASE A: Khám phá**.
Tạo output theo format Phase A và chờ xác nhận.
`
};

// Generate spec with mode and language
function generateSpec(
    template: Template,
    values: Record<string, string>,
    lang: ExportLanguage,
    mode: ExportMode,
    userContext?: string
): string {
    const date = new Date().toISOString().split('T')[0];

    // Build user input section
    const userInputLines = Object.entries(values)
        .filter(([, value]) => value && value.trim())
        .map(([key, value]) => {
            const field = template.fields.find(f => f.id === key);
            const label = field?.label || key;
            return `- **${label}:** ${value}`;
        })
        .join('\n');

    // Build expected output section
    const expectedOutput = template.outputExpected
        ?.map(item => `- ${item}`)
        .join('\n') || '- Comprehensive analysis\n- Actionable recommendations';

    const labels = lang === 'vi' ? {
        specTitle: mode === 'full' ? 'Đặc Tả Nhiệm Vụ CVF (FULL MODE)' : mode === 'governance' ? 'Đặc Tả Nhiệm Vụ CVF (Có Quy Tắc)' : 'Đặc Tả Nhiệm Vụ CVF',
        generated: 'Ngày tạo',
        templateLabel: 'Template',
        category: 'Danh mục',
        mode: 'Chế độ',
        context: 'Bối cảnh',
        userInput: 'Thông tin đầu vào',
        task: 'Nhiệm vụ',
        expectedOutput: 'Định dạng kết quả mong muốn',
        instructions: 'Hướng dẫn cho AI',
        instructionList: [
            'Giải quyết tất cả các tiêu chí thành công',
            'Tuân theo cấu trúc định dạng kết quả',
            'Đưa ra insights và khuyến nghị cụ thể',
            'Sử dụng ngôn ngữ chuyên nghiệp, rõ ràng',
        ],
        footer: 'CVF v1.6 Agent Platform - Sao chép spec này và paste vào AI yêu thích của bạn',
        noInput: '(Chưa có thông tin)',
        modeSimple: 'Đơn giản',
        modeGovernance: 'Có Quy Tắc',
        modeFull: 'Full Mode (4-Phase)',
    } : {
        specTitle: mode === 'full' ? 'CVF Task Specification (FULL MODE)' : mode === 'governance' ? 'CVF Task Specification (With Rules)' : 'CVF Task Specification',
        generated: 'Generated',
        templateLabel: 'Template',
        category: 'Category',
        mode: 'Mode',
        context: 'Context',
        userInput: 'User Input',
        task: 'Task',
        expectedOutput: 'Expected Output Format',
        instructions: 'Instructions for AI',
        instructionList: [
            'Addresses all the success criteria listed in the Task section',
            'Follows the Expected Output Format structure',
            'Provides actionable insights and recommendations',
            'Uses clear, professional language',
        ],
        footer: 'CVF v1.6 Agent Platform - Copy this spec and paste into your preferred AI',
        noInput: '(No input provided)',
        modeSimple: 'Simple',
        modeGovernance: 'With Rules',
        modeFull: 'Full Mode (4-Phase)',
    };

    // Generate intent
    let intent = template.intentPattern;
    Object.entries(values).forEach(([key, value]) => {
        intent = intent.replace(new RegExp(`\\[${key}\\]`, 'g'), value || 'N/A');
    });

    // Get mode label
    const modeLabel = mode === 'full' ? labels.modeFull : mode === 'governance' ? labels.modeGovernance : labels.modeSimple;

    // Base spec
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

## 📝 ${labels.userInput}

${userInputLines || labels.noInput}
${userContext ? `
---

## 👤 User Context

${userContext}` : ''}

---

## 🎯 ${labels.task}

${intent}

---

## 📤 ${labels.expectedOutput}

${expectedOutput}
`;

    // Add governance rules for mode 2
    if (mode === 'governance') {
        spec += governanceRules[lang];
    }

    // Add full CVF protocol for mode 3
    if (mode === 'full') {
        spec += fullModeProtocol[lang];
    }

    // Add standard instructions for all modes
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
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [exportLang, setExportLang] = useState<ExportLanguage>('vi');
    const [exportMode, setExportMode] = useState<ExportMode>('simple');
    const { getContextPrompt } = useUserContext();

    const labels = specLabels[exportLang];
    const modes = modeLabels[exportLang];
    const userContextStr = getContextPrompt();
    const spec = generateSpec(template, values, exportLang, exportMode, userContextStr);

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
        a.download = `cvf-spec-${template.id}-${exportMode}-${Date.now()}.md`;
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

            {/* Export Mode Selector */}
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

                {/* Workflow Visualizer */}
                <div className="mt-4">
                    <WorkflowVisualizer mode={exportMode} compact />
                </div>
            </div>

            {/* Mode Info Banner */}
            {exportMode === 'full' && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-700 dark:text-green-300">
                        <strong>🚦 CVF Full Mode:</strong> {exportLang === 'vi'
                            ? 'AI sẽ tuân theo quy trình 4-phase (Discovery → Design → Build → Review) với đầy đủ governance rules. Đây là chế độ mạnh nhất của CVF.'
                            : 'AI will follow the 4-phase process (Discovery → Design → Build → Review) with full governance rules. This is the most powerful CVF mode.'
                        }
                    </p>
                </div>
            )}
            {exportMode === 'governance' && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        <strong>⚠️ {exportLang === 'vi' ? 'Có Quy Tắc' : 'With Rules'}:</strong> {exportLang === 'vi'
                            ? 'Thêm stop conditions và guardrails cơ bản để kiểm soát AI.'
                            : 'Adds basic stop conditions and guardrails to control AI behavior.'
                        }
                    </p>
                </div>
            )}

            {/* Language Selector */}
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

            {/* Action Buttons */}
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

                {/* Send to Agent Button */}
                {onSendToAgent && (
                    <button
                        onClick={() => {
                            onSendToAgent(spec);
                            onClose?.();
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all shadow-md"
                    >
                        <span>🤖</span>
                        {exportLang === 'vi' ? 'Gửi đến Agent' : 'Send to Agent'}
                    </button>
                )}
            </div>

            {/* Quick Copy for Specific AIs */}
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

            {/* Preview */}
            {showPreview && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                        {spec}
                    </pre>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>{exportLang === 'vi' ? 'Hướng dẫn' : 'Instructions'}:</strong> {labels.instruction}
                </p>
            </div>
        </div>
    );
}

// Keep the old function for backward compatibility
export function generateCompleteSpec(
    template: Template,
    values: Record<string, string>,
    userIntent?: string
): string {
    return generateSpec(template, values, 'vi', 'simple');
}
