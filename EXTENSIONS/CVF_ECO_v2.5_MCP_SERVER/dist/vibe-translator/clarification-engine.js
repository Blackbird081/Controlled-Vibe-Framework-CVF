/**
 * Clarification Engine — M4.2
 *
 * "Active Clarification" from Non-coder.md: Slot Filling when info is missing.
 * CVF acts as a "strict secretary" — asks before acting, never guesses.
 *
 * @module vibe-translator/clarification-engine
 */
// ─── Slot Question Templates ──────────────────────────────────────────
const SLOT_QUESTIONS = {
    action_type: {
        question: 'What would you like me to do? (create, modify, send, analyze, etc.)',
        questionVi: 'Bạn muốn tôi làm gì? (tạo, sửa, gửi, phân tích, v.v.)',
        required: true,
        priority: 1,
    },
    recipient: {
        question: 'Who should I send this to?',
        questionVi: 'Tôi nên gửi cho ai?',
        required: true,
        priority: 2,
    },
    channel: {
        question: 'Which channel should I use? (Email, Zalo, Telegram, etc.)',
        questionVi: 'Gửi qua kênh nào? (Email, Zalo, Telegram, v.v.)',
        options: ['Email', 'Zalo', 'Telegram', 'Slack'],
        required: true,
        priority: 3,
    },
    subject: {
        question: 'What should I analyze or report on?',
        questionVi: 'Tôi nên phân tích hoặc báo cáo về cái gì?',
        required: true,
        priority: 2,
    },
    target_environment: {
        question: 'Where should I deploy to? (staging, production, etc.)',
        questionVi: 'Triển khai ở đâu? (staging, production, v.v.)',
        options: ['staging', 'production', 'development'],
        required: true,
        priority: 1,
    },
    budget_confirmation: {
        question: 'You mentioned money. What is the maximum budget for this task?',
        questionVi: 'Bạn nhắc đến tiền. Ngân sách tối đa cho tác vụ này là bao nhiêu?',
        required: false,
        priority: 4,
    },
    goal: {
        question: 'Could you describe what you want to achieve?',
        questionVi: 'Bạn có thể mô tả bạn muốn đạt được gì không?',
        required: true,
        priority: 1,
    },
    schedule: {
        question: 'When should this happen? (one-time, daily, weekly, etc.)',
        questionVi: 'Khi nào nên thực hiện? (một lần, hàng ngày, hàng tuần, v.v.)',
        options: ['now', 'daily', 'weekly', 'monthly'],
        required: false,
        priority: 5,
    },
    format: {
        question: 'What format do you want the result in? (text, PDF, email, etc.)',
        questionVi: 'Bạn muốn kết quả ở định dạng nào? (text, PDF, email, v.v.)',
        options: ['text', 'PDF', 'email', 'document'],
        required: false,
        priority: 5,
    },
};
// ─── Context-aware additional slots ───────────────────────────────────
const ADDITIONAL_SLOTS = {
    create: ['format'],
    modify: [],
    delete: [],
    send: ['schedule'],
    analyze: ['format'],
    review: [],
    deploy: [],
    search: [],
    report: ['format', 'schedule'],
    unknown: [],
};
// ─── Engine ───────────────────────────────────────────────────────────
export function generateClarifications(parsed) {
    const questions = [];
    // Add questions for missing required slots
    for (const slot of parsed.missingSlots) {
        const template = SLOT_QUESTIONS[slot];
        if (template) {
            questions.push({ slot, ...template });
        }
    }
    // Add context-aware additional slots if confidence is low
    if (parsed.confidence < 0.7 && parsed.actionType !== 'unknown') {
        const additionalSlots = ADDITIONAL_SLOTS[parsed.actionType] || [];
        for (const slot of additionalSlots) {
            if (!questions.some((q) => q.slot === slot) && !parsed.missingSlots.includes(slot)) {
                const template = SLOT_QUESTIONS[slot];
                if (template) {
                    questions.push({ slot, ...template, required: false });
                }
            }
        }
    }
    // Sort by priority
    questions.sort((a, b) => a.priority - b.priority);
    const needsClarification = questions.some((q) => q.required);
    const summary = buildSummary(parsed, questions, 'en');
    const summaryVi = buildSummary(parsed, questions, 'vi');
    return {
        needsClarification,
        questions,
        confidence: parsed.confidence,
        summary,
        summaryVi,
    };
}
function buildSummary(parsed, questions, lang) {
    if (questions.length === 0) {
        return lang === 'en'
            ? `I understand: "${parsed.goal}". Ready to proceed.`
            : `Tôi hiểu: "${parsed.goal}". Sẵn sàng tiến hành.`;
    }
    const requiredCount = questions.filter((q) => q.required).length;
    const optionalCount = questions.filter((q) => !q.required).length;
    if (lang === 'en') {
        const parts = [`I understand you want to: "${parsed.goal}"`];
        if (requiredCount > 0) {
            parts.push(`But I need ${requiredCount} more piece(s) of information before I can proceed.`);
        }
        if (optionalCount > 0) {
            parts.push(`I also have ${optionalCount} optional question(s) to improve the result.`);
        }
        return parts.join(' ');
    }
    const parts = [`Tôi hiểu bạn muốn: "${parsed.goal}"`];
    if (requiredCount > 0) {
        parts.push(`Nhưng tôi cần thêm ${requiredCount} thông tin trước khi thực hiện.`);
    }
    if (optionalCount > 0) {
        parts.push(`Tôi cũng có ${optionalCount} câu hỏi tùy chọn để cải thiện kết quả.`);
    }
    return parts.join(' ');
}
export { SLOT_QUESTIONS, ADDITIONAL_SLOTS };
//# sourceMappingURL=clarification-engine.js.map