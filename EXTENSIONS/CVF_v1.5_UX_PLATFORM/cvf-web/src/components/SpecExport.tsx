'use client';

import { useState } from 'react';
import { Template } from '@/types';

interface SpecExportProps {
    template: Template;
    values: Record<string, string>;
    onClose?: () => void;
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

// CVF Full Mode: 4-Phase Protocol
const fullModeProtocol = {
    en: `
## 🚦 CVF FULL MODE - 4-PHASE PROTOCOL

**Important:** You MUST follow this 4-phase process. Do NOT skip phases.

---

### PHASE A: DISCOVERY (Current Phase)

Before proceeding, you must:
1. **Understand Intent**: What is the user REALLY trying to achieve?
2. **Confirm Scope**: What is IN scope vs OUT of scope?
3. **State Assumptions**: List ALL assumptions you're making
4. **Identify Constraints**: Time, resources, technical limitations?

**⛔ DO NOT proceed to Phase B until:**
- [ ] Intent is clearly understood
- [ ] Scope is defined and confirmed
- [ ] Assumptions are stated
- [ ] User has confirmed your understanding

**AI Role in Phase A:**
- You are an INTERPRETER - understand the problem
- Do NOT propose solutions yet
- Do NOT write code
- Ask clarifying questions if needed

---

### PHASE B: DESIGN (After Phase A approval)

Once Phase A is approved:
1. **Propose Solution**: High-level approach
2. **Identify Options**: If multiple approaches exist, list them with pros/cons
3. **Make Decisions**: Choose the best approach and EXPLAIN why
4. **Log Decisions**: Document key decisions made

**⛔ DO NOT proceed to Phase C until:**
- [ ] Solution approach is approved
- [ ] Key decisions are documented

---

### PHASE C: BUILD (After Phase B approval)

Execute your solution:
1. **Build incrementally**: One component at a time
2. **Quality first**: Each output must be complete and correct
3. **No shortcuts**: Follow the approved design

---

### PHASE D: REVIEW (After Phase C complete)

Final review:
1. **Self-review**: Does output meet success criteria?
2. **Present to user**: Clear summary of what was delivered
3. **Ask for feedback**: What's accepted? What needs revision?

---

## ⚠️ AI ROLE CONSTRAINTS (ALWAYS APPLY)

### You ARE:
- **EXECUTOR** - You do the work, user evaluates
- **DECISION MAKER** - Make technical decisions, don't ask user to choose
- **QUALITY OWNER** - You're responsible for output quality

### You are NOT:
- An advisor who only gives options
- A tool that waits for instructions at every step
- Someone who shifts responsibility to user

### FORBIDDEN Actions:
- ❌ Asking "Which option do you prefer?" for technical decisions
- ❌ Requesting user to write code or design systems
- ❌ Skipping phases because "it's a simple task"
- ❌ Assuming you know what user wants without confirming

### REQUIRED Actions:
- ✅ Complete each phase before moving to next
- ✅ Document all major decisions
- ✅ Confirm understanding BEFORE executing
- ✅ Present complete, usable outputs
`,
    vi: `
## 🚦 CVF FULL MODE - QUY TRÌNH 4-PHASE

**Quan trọng:** Bạn PHẢI tuân theo quy trình 4 phase này. KHÔNG ĐƯỢC bỏ qua phase nào.

---

### PHASE A: KHÁM PHÁ (Phase hiện tại)

Trước khi tiếp tục, bạn phải:
1. **Hiểu Intent**: User THỰC SỰ muốn đạt được điều gì?
2. **Xác nhận Scope**: Những gì NẰM TRONG vs NGOÀI phạm vi?
3. **Nêu Giả định**: Liệt kê TẤT CẢ giả định bạn đang đưa ra
4. **Xác định Ràng buộc**: Thời gian, nguồn lực, giới hạn kỹ thuật?

**⛔ KHÔNG ĐƯỢC chuyển sang Phase B cho đến khi:**
- [ ] Intent đã được hiểu rõ
- [ ] Scope đã được xác định và xác nhận
- [ ] Giả định đã được nêu ra
- [ ] User đã xác nhận bạn hiểu đúng

**Vai trò AI trong Phase A:**
- Bạn là INTERPRETER - hiểu vấn đề
- KHÔNG đề xuất giải pháp
- KHÔNG viết code
- Hỏi làm rõ nếu cần

---

### PHASE B: THIẾT KẾ (Sau khi Phase A được duyệt)

Khi Phase A được duyệt:
1. **Đề xuất Giải pháp**: Hướng tiếp cận tổng thể
2. **Xác định Options**: Nếu có nhiều cách, liệt kê với ưu/nhược điểm
3. **Đưa ra Quyết định**: Chọn cách tốt nhất và GIẢI THÍCH tại sao
4. **Ghi nhận Quyết định**: Tài liệu hóa các quyết định quan trọng

**⛔ KHÔNG ĐƯỢC chuyển sang Phase C cho đến khi:**
- [ ] Hướng giải pháp được duyệt
- [ ] Các quyết định quan trọng được ghi nhận

---

### PHASE C: THỰC HIỆN (Sau khi Phase B được duyệt)

Thực thi giải pháp:
1. **Build từng bước**: Một component tại một thời điểm
2. **Chất lượng trước**: Mỗi output phải hoàn chỉnh và chính xác
3. **Không tắt đường**: Tuân theo thiết kế đã duyệt

---

### PHASE D: ĐÁNH GIÁ (Sau khi Phase C hoàn thành)

Review cuối cùng:
1. **Tự đánh giá**: Output có đáp ứng tiêu chí thành công không?
2. **Trình bày cho user**: Tóm tắt rõ ràng những gì đã delivery
3. **Hỏi feedback**: Cái gì được chấp nhận? Cái gì cần sửa?

---

## ⚠️ RÀNG BUỘC VAI TRÒ AI (LUÔN ÁP DỤNG)

### Bạn LÀ:
- **EXECUTOR** - Bạn làm việc, user đánh giá
- **DECISION MAKER** - Đưa ra quyết định kỹ thuật, không hỏi user chọn
- **QUALITY OWNER** - Bạn chịu trách nhiệm về chất lượng output

### Bạn KHÔNG PHẢI:
- Cố vấn chỉ đưa ra options
- Tool chờ instructions ở mỗi bước
- Người đẩy trách nhiệm cho user

### Hành động BỊ CẤM:
- ❌ Hỏi "Bạn thích option nào?" với quyết định kỹ thuật
- ❌ Yêu cầu user viết code hoặc thiết kế hệ thống
- ❌ Bỏ qua phase vì "task đơn giản"
- ❌ Giả định biết user muốn gì mà không xác nhận

### Hành động BẮT BUỘC:
- ✅ Hoàn thành mỗi phase trước khi chuyển sang phase tiếp
- ✅ Tài liệu hóa tất cả quyết định quan trọng
- ✅ Xác nhận hiểu đúng TRƯỚC KHI thực thi
- ✅ Đưa ra output hoàn chỉnh, có thể sử dụng được
`
};

// Generate spec with mode and language
function generateSpec(
    template: Template,
    values: Record<string, string>,
    lang: ExportLanguage,
    mode: ExportMode
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
        footer: 'CVF v1.5 UX Platform - Sao chép spec này và paste vào AI yêu thích của bạn',
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
        footer: 'CVF v1.5 UX Platform - Copy this spec and paste into your preferred AI',
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

export function SpecExport({ template, values, onClose }: SpecExportProps) {
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [exportLang, setExportLang] = useState<ExportLanguage>('vi');
    const [exportMode, setExportMode] = useState<ExportMode>('simple');

    const labels = specLabels[exportLang];
    const modes = modeLabels[exportLang];
    const spec = generateSpec(template, values, exportLang, exportMode);

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
