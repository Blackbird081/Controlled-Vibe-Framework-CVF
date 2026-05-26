import { Template } from '@/types';

type ExportLanguage = 'en' | 'vi';
type ExportMode = 'simple' | 'governance' | 'full';

const VIETNAMESE_SIGNAL = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;

const FIELD_TRANSLATION_PATTERNS: Record<string, Array<[RegExp, string]>> = {
    appName: [
        [/app\s+tài\s+chính\s+cá\s+nhân/i, 'Personal finance app'],
        [/tài\s+chính\s+cá\s+nhân/i, 'Personal finance app'],
    ],
    problem: [
        [/quản\s+lý\s+tài\s+chính\s+cá\s+nhân,\s*dòng\s+tiền\s+ra\s+vào\s+h[ằàa]ng\s+ngày/i, 'Manage personal finances and daily cash inflows and outflows'],
        [/quản\s+lý\s+tài\s+chính\s+cá\s+nhân/i, 'Manage personal finances'],
        [/dòng\s+tiền\s+ra\s+vào\s+h[ằàa]ng\s+ngày/i, 'daily cash inflows and outflows'],
    ],
    targetUsers: [
        [/người\s+việt\s+không\s+chuyên\s+kỹ\s+thuật/i, 'Vietnamese non-technical users'],
        [/team\s+(\d+)\s*-\s*(\d+)\s+người/i, 'Team of $1-$2 people'],
        [/nhóm\s+(\d+)\s*-\s*(\d+)\s+người/i, 'Group of $1-$2 people'],
    ],
    coreFeatures: [
        [/ghi\s+chi\s+tiêu/i, 'Record expenses'],
        [/phân\s+loại\s+giao\s+dịch/i, 'Categorize transactions'],
        [/báo\s+cáo\s+dòng\s+tiền/i, 'Cash-flow reports'],
        [/quản\s+lý\s+thu\s+chi/i, 'Track income and expenses'],
    ],
    successCriteria: [
        [/người\s+dùng\s+nhập\s+giao\s+dịch\s+trong\s+dưới\s+30\s+giây\s+và\s+xem\s+báo\s+cáo\s+tháng\s+rõ\s+ràng/i, 'Users can enter a transaction in under 30 seconds and view a clear monthly report.'],
        [/người\s+dùng\s+tạo\s+task\s+trong\s+1\s+phút/i, 'Users can create a task within one minute.'],
    ],
    mustPreserve: [
        [/giữ\s+dữ\s+liệu\s+local/i, 'Keep data local'],
        [/không\s+yêu\s+cầu\s+kiến\s+thức\s+kỹ\s+thuật/i, 'Do not require technical knowledge from the user'],
    ],
    platforms: [
        [/web\s+browser\s+trên\s+desktop\s+và\s+mobile/i, 'Web browser on desktop and mobile'],
    ],
    dataNeeds: [
        [/giao\s+dịch/i, 'transactions'],
        [/danh\s+mục\s+chi\s+tiêu/i, 'expense categories'],
        [/ghi\s+chú/i, 'notes'],
        [/báo\s+cáo\s+tháng/i, 'monthly reports'],
    ],
    lookAndFeel: [
        [/sạch/i, 'clean'],
        [/tập\s+trung/i, 'focused'],
        [/dễ\s+đọc/i, 'easy to read'],
        [/dashboard\s+tài\s+chính\s+cá\s+nhân/i, 'personal finance dashboard'],
    ],
    outOfScope: [
        [/không\s+kết\s+nối\s+ngân\s+hàng\s+ở\s+bản\s+đầu/i, 'No bank connection in the first version'],
    ],
    constraints: [
        [/không\s+yêu\s+cầu\s+người\s+dùng\s+chọn\s+framework\s+hoặc\s+database/i, 'Do not require the user to choose a framework or database'],
    ],
};

function hasVietnameseSignal(value: string): boolean {
    return VIETNAMESE_SIGNAL.test(value);
}

function normalizeMultilineList(value: string): string[] {
    return value
        .split(/\r?\n/)
        .map(line => line.replace(/^\s*\d+\.\s*/, '').trim())
        .filter(Boolean);
}

function cleanTranslatedValue(value: string): string {
    return value
        .replace(/\.\.+/g, '.')
        .replace(/\s+([,.])/g, '$1')
        .trim();
}

function translateKnownValue(fieldId: string, value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (!hasVietnameseSignal(trimmed)) return trimmed;

    const patterns = FIELD_TRANSLATION_PATTERNS[fieldId] || [];
    const listItems = normalizeMultilineList(trimmed);
    if (listItems.length > 1) {
        const translatedItems = listItems.map(item => translateKnownValue(fieldId, item));
        if (translatedItems.every(Boolean)) {
            return translatedItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
        }
    }

    for (const [pattern, replacement] of patterns) {
        if (pattern.test(trimmed)) {
            const translated = cleanTranslatedValue(trimmed.replace(pattern, replacement));
            if (!hasVietnameseSignal(translated)) {
                return translated;
            }
            const matchedSegments = patterns
                .filter(([segmentPattern]) => segmentPattern.test(trimmed))
                .map(([, segmentReplacement]) => segmentReplacement);
            if (matchedSegments.length) {
                return cleanTranslatedValue(Array.from(new Set(matchedSegments)).join('; '));
            }
            return translated;
        }
    }

    if (fieldId === 'dataNeeds') {
        const matched = patterns
            .filter(([pattern]) => pattern.test(trimmed))
            .map(([, replacement]) => replacement);
        if (matched.length) return matched.join(', ');
    }

    if (fieldId === 'lookAndFeel') {
        const matched = patterns
            .filter(([pattern]) => pattern.test(trimmed))
            .map(([, replacement]) => replacement);
        if (matched.length) return matched.join(', ');
    }

    return null;
}

export function shouldUseEnglishWorkingValues(
    template: Template,
    lang: ExportLanguage,
    _mode: ExportMode,
): boolean {
    return template.id === 'app_builder_complete' && lang === 'en';
}

export function buildEnglishWorkingValues(
    template: Template,
    values: Record<string, string>,
    lang: ExportLanguage,
    mode: ExportMode,
): Record<string, string> {
    if (!shouldUseEnglishWorkingValues(template, lang, mode)) {
        return values;
    }

    return Object.fromEntries(Object.entries(values).map(([fieldId, value]) => {
        const translated = translateKnownValue(fieldId, value);
        if (translated === null) {
            return [
                fieldId,
                `TRANSLATION_REQUIRED: The source value for this field contains non-English content that was not safely normalized by the local translator.`,
            ];
        }
        return [fieldId, translated];
    }));
}

export function buildEnglishWorkingBrief(
    template: Template,
    sourceValues: Record<string, string>,
    workingValues: Record<string, string>,
    lang: ExportLanguage,
    mode: ExportMode,
): string {
    if (!shouldUseEnglishWorkingValues(template, lang, mode)) {
        return '';
    }

    const translated = Object.entries(sourceValues)
        .filter(([, value]) => value?.trim())
        .filter(([fieldId, value]) => workingValues[fieldId] !== value)
        .length;
    const unresolved = Object.values(workingValues)
        .filter(value => value.startsWith('TRANSLATION_REQUIRED:'))
        .length;
    const status = unresolved ? 'NEEDS_TRANSLATION_REVIEW' : 'READY_FOR_EXTERNAL_AGENT_REVIEW';

    return `
---

## 🌐 English Working Brief

**Translation status:** ${status}

- The English export uses normalized English working values for agent-facing execution.
- User source values may have been entered in Vietnamese, but this packet avoids passing Vietnamese control content to the receiving agent.
- Product meaning, acceptance criteria, and non-coder intent are preserved where local normalization is confident.
- Fields marked \`TRANSLATION_REQUIRED\` must be translated by the operator or an approved LLM before external-agent build work starts.

| Translation metric | Count |
| --- | ---: |
| Normalized fields | ${translated} |
| Fields needing translation review | ${unresolved} |
`;
}
