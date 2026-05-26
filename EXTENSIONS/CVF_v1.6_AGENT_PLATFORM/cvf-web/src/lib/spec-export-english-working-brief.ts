import { Template } from '@/types';

type ExportLanguage = 'en' | 'vi';
type ExportMode = 'simple' | 'governance' | 'full';

const VIETNAMESE_SIGNAL = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;

const SUPPORTED_ENGLISH_WORKING_TEMPLATE_IDS = new Set([
    'app_builder_complete',
    'strategy_analysis',
    'marketing_campaign_wizard',
    'brand_voice',
    'web_build_handoff',
]);

const COMMON_TRANSLATION_PATTERNS: Array<[RegExp, string]> = [
    [/khách\s+hàng/i, 'customers'],
    [/người\s+dùng/i, 'users'],
    [/chủ\s+doanh\s+nghiệp\s+nhỏ/i, 'small-business owners'],
    [/đăng\s+ký\s+tư\s+vấn/i, 'book a consultation'],
    [/xem\s+dịch\s+vụ/i, 'view services'],
    [/so\s+sánh\s+gói/i, 'compare packages'],
    [/để\s+lại\s+thông\s+tin\s+liên\s+hệ/i, 'leave contact information'],
    [/trang\s+chủ|home/i, 'Home'],
    [/dịch\s+vụ/i, 'Services'],
    [/bảng\s+giá|pricing/i, 'Pricing'],
    [/form\s+liên\s+hệ/i, 'contact form'],
    [/trang\s+cảm\s+ơn|thank-you/i, 'thank-you page'],
    [/tin\s+cậy/i, 'trustworthy'],
    [/sáng\s+rõ/i, 'clear'],
    [/hiện\s+đại/i, 'modern'],
    [/dễ\s+đọc/i, 'easy to read'],
    [/mobile/i, 'mobile'],
    [/chiến\s+dịch/i, 'campaign'],
    [/ra\s+mắt\s+sản\s+phẩm/i, 'product launch'],
    [/tăng\s+nhận\s+diện\s+thương\s+hiệu/i, 'increase brand awareness'],
    [/tăng\s+trưởng/i, 'growth'],
    [/mở\s+rộng\s+thị\s+trường/i, 'market expansion'],
    [/miền\s+trung/i, 'Central region'],
    [/rủi\s+ro/i, 'risks'],
    [/doanh\s+thu/i, 'revenue'],
    [/ngân\s+sách/i, 'budget'],
    [/đội\s+ngũ/i, 'team'],
    [/thân\s+thiện/i, 'friendly'],
    [/chuyên\s+nghiệp/i, 'professional'],
    [/trẻ\s+trung/i, 'youthful'],
    [/đơn\s+giản/i, 'simple'],
    [/nhân\s+văn/i, 'human-centered'],
    [/mạng\s+xã\s+hội/i, 'social channels'],
];

const FIELD_TRANSLATION_PATTERNS: Record<string, Array<[RegExp, string]>> = {
    appName: [
        [/app\s+tài\s+chính\s+cá\s+nhân/i, 'Personal finance app'],
        [/tài\s+chính\s+cá\s+nhân/i, 'Personal finance app'],
    ],
    topic: [
        [/mở\s+rộng\s+thị\s+trường\s+miền\s+trung/i, 'Expand into the Central region market'],
        [/chiến\s+lược\s+tăng\s+trưởng/i, 'growth strategy'],
    ],
    context: [
        [/công\s+ty\s+saas\s+b2b/i, 'B2B SaaS company'],
        [/công\s+ty\s+d2c/i, 'D2C company'],
        [/thị\s+trường\s+đang\s+tăng\s+trưởng/i, 'The market is growing'],
    ],
    options: [
        [/mở\s+chi\s+nhánh\s+trực\s+tiếp/i, 'Open a direct branch'],
        [/hợp\s+tác\s+với\s+đối\s+tác\s+địa\s+phương/i, 'Partner with local operators'],
        [/bán\s+hàng\s+online/i, 'Sell online'],
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
    audience: [
        [/chủ\s+doanh\s+nghiệp\s+nhỏ\s+đang\s+tìm\s+giải\s+pháp\s+ai\s+automation/i, 'Small-business owners looking for AI automation solutions'],
        [/smb\s+founders\s+và\s+team\s+leaders/i, 'SMB founders and team leaders'],
        [/khách\s+hàng\s+cá\s+nhân/i, 'individual customers'],
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
        [/budget\s+tối\s+đa\s+\$?([\d,.]+k?)/i, 'Maximum budget $1'],
        [/không\s+yêu\s+cầu\s+người\s+dùng\s+chọn\s+framework\s+hoặc\s+database/i, 'Do not require the user to choose a framework or database'],
    ],
    websiteGoal: [
        [/giúp\s+khách\s+hàng\s+đăng\s+ký\s+tư\s+vấn\s+và\s+xem\s+dịch\s+vụ\s+nhanh\s+hơn/i, 'Help customers book consultations and view services faster'],
    ],
    mustDo: [
        [/xem\s+dịch\s+vụ/i, 'View services'],
        [/so\s+sánh\s+gói/i, 'Compare packages'],
        [/đăng\s+ký\s+tư\s+vấn/i, 'Book a consultation'],
        [/để\s+lại\s+thông\s+tin\s+liên\s+hệ/i, 'Leave contact information'],
    ],
    screens: [
        [/home/i, 'Home'],
        [/services/i, 'Services'],
        [/pricing/i, 'Pricing'],
        [/contact\s+form\s+modal/i, 'Contact form modal'],
        [/thank-you\s+page/i, 'Thank-you page'],
    ],
    references: [
        [/headline\s+mạnh/i, 'strong headlines'],
        [/cta\s+nổi/i, 'prominent CTA'],
        [/tránh\s+kiểu\s+quá\s+nhiều\s+hiệu\s+ứng/i, 'avoid excessive effects'],
    ],
    brand: [
        [/thương\s+hiệu\s+tư\s+vấn\s+tài\s+chính/i, 'Financial advisory brand'],
    ],
    industry: [
        [/tài\s+chính\s+cá\s+nhân/i, 'personal finance'],
        [/tư\s+vấn\s+ai\s+automation/i, 'AI automation consulting'],
    ],
    samples: [
        [/website:\s*giúp\s+bạn\s+kiểm\s+soát\s+dòng\s+tiền/i, 'Website: Helps you control cash flow'],
        [/email:\s*đừng\s+bỏ\s+lỡ\s+báo\s+cáo\s+tuần/i, 'Email: Do not miss the weekly report'],
        [/social:\s*mẹo\s+nhỏ\s+để\s+tiết\s+kiệm/i, 'Social: Small tips to save money'],
    ],
    values: [
        [/đơn\s+giản/i, 'simple'],
        [/tin\s+cậy/i, 'trustworthy'],
        [/thân\s+thiện/i, 'friendly'],
    ],
    campaignName: [
        [/ra\s+mắt\s+sản\s+phẩm\s+mới/i, 'New product launch'],
    ],
    objectives: [
        [/tăng\s+nhận\s+diện\s+thương\s+hiệu\s+và\s+thu\s+thập\s+lead/i, 'Increase brand awareness and collect leads'],
    ],
    demographics: [
        [/người\s+dùng\s+văn\s+phòng\s+25\s*-\s*40\s+tuổi/i, 'Office workers aged 25-40'],
    ],
    messaging: [
        [/tiết\s+kiệm\s+thời\s+gian/i, 'save time'],
        [/dễ\s+bắt\s+đầu/i, 'easy to start'],
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

    const patterns = [...(FIELD_TRANSLATION_PATTERNS[fieldId] || []), ...COMMON_TRANSLATION_PATTERNS];
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
    return SUPPORTED_ENGLISH_WORKING_TEMPLATE_IDS.has(template.id) && lang === 'en';
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
