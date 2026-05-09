/**
 * Smart Onboarding — M7.4
 *
 * Psychographic profiling to personalize CVF for each user.
 * Replaces technical settings with human-friendly questions.
 *
 * From Non-coder.md:
 * - Persona Alignment (autonomy level)
 * - Red Lines (data access whitelist, HITL triggers)
 * - Personal Dictionary (context mapping)
 * - Identity Mapping (contact graph)
 * - Action Cards (gesture-based governance)
 *
 * @module non-coder/smart-onboarding
 */
const PERSONA_QUESTIONS = [
    {
        id: 'autonomy',
        question: 'How much control do you want over AI actions?',
        questionVi: 'Bạn muốn kiểm soát AI ở mức nào?',
        options: [
            { label: 'Full control — approve everything', labelVi: 'Kiểm soát hoàn toàn — duyệt mọi thứ', value: 'guardian' },
            { label: 'Balanced — approve risky actions only', labelVi: 'Cân bằng — chỉ duyệt hành động rủi ro', value: 'balanced' },
            { label: 'Co-pilot — AI suggests, I confirm key decisions', labelVi: 'Co-pilot — AI đề xuất, tôi xác nhận quyết định quan trọng', value: 'copilot' },
            { label: 'Auto-pilot — AI handles most things', labelVi: 'Auto-pilot — AI xử lý hầu hết mọi thứ', value: 'autopilot' },
        ],
    },
    {
        id: 'risk',
        question: 'What is your comfort level with risk?',
        questionVi: 'Mức chấp nhận rủi ro của bạn là gì?',
        options: [
            { label: 'Very cautious — block anything uncertain', labelVi: 'Rất thận trọng — chặn mọi thứ không chắc chắn', value: 'R0' },
            { label: 'Careful — allow safe actions, flag others', labelVi: 'Cẩn thận — cho phép hành động an toàn, đánh dấu còn lại', value: 'R1' },
            { label: 'Moderate — allow most things, block dangerous', labelVi: 'Vừa phải — cho phép hầu hết, chặn nguy hiểm', value: 'R2' },
        ],
    },
    {
        id: 'language',
        question: 'Preferred language?',
        questionVi: 'Ngôn ngữ ưa thích?',
        options: [
            { label: 'English', labelVi: 'Tiếng Anh', value: 'en' },
            { label: 'Tiếng Việt', labelVi: 'Tiếng Việt', value: 'vi' },
        ],
    },
    {
        id: 'explanations',
        question: 'How detailed should explanations be?',
        questionVi: 'Giải thích chi tiết đến mức nào?',
        options: [
            { label: 'Brief — just the essentials', labelVi: 'Ngắn gọn — chỉ thông tin cốt lõi', value: 'brief' },
            { label: 'Detailed — explain reasoning', labelVi: 'Chi tiết — giải thích lý do', value: 'detailed' },
        ],
    },
];
export function getPersonaQuestions() {
    return [...PERSONA_QUESTIONS];
}
export function buildPersonaProfile(answers) {
    const autonomy = (answers.autonomy || 'balanced');
    const riskMap = { R0: 'R0', R1: 'R1', R2: 'R2' };
    return {
        autonomyLevel: autonomy,
        riskTolerance: riskMap[answers.risk] || 'R1',
        preferredLanguage: (answers.language === 'vi' ? 'vi' : 'en'),
        confirmBeforeAction: autonomy === 'guardian' || autonomy === 'balanced',
        verboseExplanations: answers.explanations === 'detailed',
        nickname: answers.nickname,
    };
}
export function getMaxRiskForAutonomy(autonomy) {
    switch (autonomy) {
        case 'guardian': return 'R0';
        case 'balanced': return 'R1';
        case 'copilot': return 'R2';
        case 'autopilot': return 'R2';
    }
}
export function getDefaultRedLines() {
    return {
        dataAccessWhitelist: [],
        hitlTriggers: ['deploy', 'delete', 'payment', 'send_external'],
        forbiddenActions: ['delete_production_data', 'share_credentials', 'bypass_auth'],
        requireApprovalFor: ['deploy', 'merge', 'external_api_call', 'data_export'],
    };
}
export function mergeRedLines(base, custom) {
    return {
        dataAccessWhitelist: [
            ...base.dataAccessWhitelist,
            ...(custom.dataAccessWhitelist || []),
        ],
        hitlTriggers: [
            ...new Set([...base.hitlTriggers, ...(custom.hitlTriggers || [])]),
        ],
        forbiddenActions: [
            ...new Set([...base.forbiddenActions, ...(custom.forbiddenActions || [])]),
        ],
        requireApprovalFor: [
            ...new Set([...base.requireApprovalFor, ...(custom.requireApprovalFor || [])]),
        ],
    };
}
export function checkRedLine(action, config) {
    const lower = action.toLowerCase();
    if (config.forbiddenActions.some((f) => lower.includes(f.toLowerCase()))) {
        return { allowed: false, requiresApproval: false, triggersHITL: true, reason: `Action "${action}" is in forbidden list.` };
    }
    const requiresApproval = config.requireApprovalFor.some((r) => lower.includes(r.toLowerCase()));
    const triggersHITL = config.hitlTriggers.some((t) => lower.includes(t.toLowerCase()));
    return { allowed: true, requiresApproval, triggersHITL };
}
export class PersonalDictionary {
    entries = new Map();
    add(entry) {
        const key = entry.term.toLowerCase();
        this.entries.set(key, entry);
        for (const alias of entry.aliases) {
            this.entries.set(alias.toLowerCase(), entry);
        }
    }
    lookup(term) {
        return this.entries.get(term.toLowerCase());
    }
    resolve(text) {
        let resolved = text;
        for (const [key, entry] of this.entries) {
            const regex = new RegExp(`\\b${escapeRegex(key)}\\b`, 'gi');
            resolved = resolved.replace(regex, entry.meaning);
        }
        return resolved;
    }
    getAll() {
        const seen = new Set();
        const result = [];
        for (const entry of this.entries.values()) {
            if (!seen.has(entry.term)) {
                seen.add(entry.term);
                result.push(entry);
            }
        }
        return result;
    }
    count() {
        return this.getAll().length;
    }
    remove(term) {
        const entry = this.entries.get(term.toLowerCase());
        if (!entry)
            return false;
        this.entries.delete(entry.term.toLowerCase());
        for (const alias of entry.aliases) {
            this.entries.delete(alias.toLowerCase());
        }
        return true;
    }
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function completeOnboarding(answers, customRedLines, dictionaryEntries) {
    const persona = buildPersonaProfile(answers);
    const redLines = mergeRedLines(getDefaultRedLines(), customRedLines || {});
    const dict = new PersonalDictionary();
    if (dictionaryEntries) {
        for (const entry of dictionaryEntries) {
            dict.add(entry);
        }
    }
    return {
        persona,
        redLines,
        dictionary: dict.getAll(),
        completedAt: new Date().toISOString(),
    };
}
export { PERSONA_QUESTIONS };
//# sourceMappingURL=smart-onboarding.js.map