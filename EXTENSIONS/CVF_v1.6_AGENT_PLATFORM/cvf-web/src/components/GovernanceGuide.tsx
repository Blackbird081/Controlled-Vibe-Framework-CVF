'use client';

// Text Encoding Exception: Vietnamese copy and existing guide symbols follow the product convention.

import { useLanguage } from '@/lib/i18n';

interface GuideCard {
    icon: string;
    title: string;
    what: string;
    when: string;
    how: string;
    tip: string;
}

function guideCopy(t: (key: string) => string) {
    return {
        vi: {
            title: t('governancePage.guideTitle'),
            subtitle: 'Dành cho người không biết code — đọc 3 phút là hiểu',
            whatIs: t('governancePage.guideWhat'),
            whatIsAnswer: 'Kiểm soát AI giống như "bộ lọc an toàn" cho AI. Trước khi AI đưa ra câu trả lời quan trọng, hệ thống sẽ kiểm tra: Có rủi ro gì không? Có cần ai duyệt không? Có đúng tiêu chuẩn không?',
            analogy: '💡 Hãy hình dung bước kiểm soát như nhân viên kiểm soát chất lượng trong nhà máy — họ không sản xuất, nhưng đảm bảo sản phẩm ra đúng tiêu chuẩn.',
            sections: 'Mỗi mục làm gì?',
            whatLabel: 'Nó là gì',
            whenLabel: 'Khi nào cần xem',
            howLabel: 'Cách đọc',
            tipLabel: '💡 Mẹo',
            cards: [
                {
                    icon: '📊',
                    title: t('governancePage.overview'),
                    what: '4 con số cho biết "sức khỏe" của hệ thống AI',
                    when: 'Mỗi ngày — giống như xem nhiệt kế cho dự án',
                    how: 'Xanh = tốt, Vàng = cần chú ý, Đỏ = cần hành động ngay. Không cần hiểu con số cụ thể.',
                    tip: 'Nếu tất cả card đều xanh → Mọi thứ ổn. Không cần làm gì.',
                },
                {
                    icon: '📒',
                    title: t('governancePage.ledger'),
                    what: 'Lịch sử mọi quyết định AI đã đưa ra — giống như sổ nhật ký',
                    when: 'Khi cần báo cáo cho quản lý, hoặc khi có sự cố cần tra lại',
                    how: t('governancePage.guideLogHow'),
                    tip: t('governancePage.guideLogTip'),
                },
                {
                    icon: '✅',
                    title: t('governancePage.approval'),
                    what: 'Khi AI gặp quyết định rủi ro cao, nó sẽ yêu cầu người duyệt',
                    when: 'Khi bạn thấy cảnh báo màu đỏ, hoặc nhận thông báo',
                    how: 'Quy trình 4 bước: người phát triển, trưởng nhóm, người phụ trách bảo mật, người duyệt cấp quản lý. Bạn chỉ cần duyệt bước của mình.',
                    tip: t('governancePage.guideApprovalTip'),
                },
                {
                    icon: '🎨',
                    title: t('governancePage.brand'),
                    what: 'Xem AI có khác chuẩn không và xin ngoại lệ nếu cần',
                    when: t('governancePage.guideBrandWhen'),
                    how: 'Thanh tiến trình: <20% = ổn (xanh), 20-50% = cần xem lại (vàng), >50% = lệch nhiều (đỏ)',
                    tip: t('governancePage.guideBrandTip'),
                },
                {
                    icon: '🧪',
                    title: t('governancePage.simulation'),
                    what: 'Thử nghiệm chính sách mới trước khi áp dụng — như "bản nháp" để xem trước tác động',
                    when: 'Khi muốn thay đổi cách AI xử lý rủi ro mà không ảnh hưởng hệ thống thật',
                    how: t('governancePage.guideSimulationHow'),
                    tip: 'Nếu "Tác động" > 30% → cẩn thận, thay đổi lớn. Hãy hỏi team trước khi áp dụng.',
                },
            ] as GuideCard[],
            faq: 'Câu hỏi thường gặp',
            faqs: [
                { q: 'Kiểm soát AI có làm chậm công việc không?', a: 'Không. Các bước kiểm tra chạy tự động trong 1-2 giây. Bạn chỉ cần hành động khi có cảnh báo đỏ hoặc yêu cầu duyệt.' },
                { q: 'Tôi cần biết lập trình để xem trang này không?', a: 'Không. Tất cả đều hiển thị bằng icon, màu sắc và con số. Xanh = tốt, Đỏ = cần chú ý.' },
                { q: t('governancePage.guideBlockedQ'), a: t('governancePage.guideBlockedA') },
                { q: 'Tôi có thể bỏ qua bước kiểm tra không?', a: t('governancePage.guideRiskA') },
            ],
            quickRef: '⚡ Bảng tra nhanh',
            quickRefItems: [
                { color: '🟢', meaning: 'Xanh', action: 'Mọi thứ ổn — không cần làm gì' },
                { color: '🟡', meaning: 'Vàng', action: 'Cần chú ý — xem chi tiết và quyết định' },
                { color: '🔴', meaning: 'Đỏ', action: 'Cần hành động — duyệt, sửa, hoặc báo cáo' },
                { color: '🔒', meaning: 'Khóa', action: t('governancePage.guideFrozen') },
            ],
        },
        en: {
            title: t('governancePage.guideTitle'),
            subtitle: 'For non-coders — 3-minute read to understand everything',
            whatIs: t('governancePage.guideWhat'),
            whatIsAnswer: 'Governance is like a "safety filter" for AI. Before AI makes important decisions, Governance checks: Is there a risk? Does someone need to approve? Does it meet standards?',
            analogy: '💡 Think of Governance as a quality control inspector in a factory — they don\'t produce, but they ensure products meet standards.',
            sections: 'What does each section do?',
            whatLabel: 'What it is',
            whenLabel: 'When to check',
            howLabel: 'How to read',
            tipLabel: '💡 Tip',
            cards: [
                {
                    icon: '📊',
                    title: t('governancePage.overview'),
                    what: '4 numbers showing your AI system\'s "health"',
                    when: 'Daily — like checking a thermometer for your project',
                    how: 'Green = good, Yellow = needs attention, Red = act now. No need to understand exact numbers.',
                    tip: 'If all cards are green → Everything\'s fine. Nothing to do.',
                },
                {
                    icon: '📒',
                    title: t('governancePage.ledger'),
                    what: 'History of every AI decision ever made — like a diary',
                    when: 'When reporting to management, or investigating an incident',
                    how: t('governancePage.guideLogHow'),
                    tip: t('governancePage.guideLogTip'),
                },
                {
                    icon: '✅',
                    title: t('governancePage.approval'),
                    what: 'When AI encounters high-risk decisions, it asks for human approval',
                    when: 'When you see a red badge on the governance bar, or receive a notification',
                    how: '4-step process: Developer → Team Lead → Security → Executive. Just approve your step.',
                    tip: t('governancePage.guideApprovalTip'),
                },
                {
                    icon: '🎨',
                    title: t('governancePage.brand'),
                    what: 'Check whether AI is following brand standards and request exceptions',
                    when: t('governancePage.guideBrandWhen'),
                    how: 'Progress bar: <20% = fine (green), 20-50% = review (yellow), >50% = high drift (red)',
                    tip: t('governancePage.guideBrandTip'),
                },
                {
                    icon: '🧪',
                    title: t('governancePage.simulation'),
                    what: 'Test new policies before applying — like a "draft" for rules',
                    when: 'When you want to change how AI handles risk without affecting the live system',
                    how: t('governancePage.guideSimulationHow'),
                    tip: 'If "Impact" > 30% → careful, it\'s a big change. Ask your team before applying.',
                },
            ] as GuideCard[],
            faq: 'Frequently Asked Questions',
            faqs: [
                { q: 'Does Governance slow down my work?', a: 'No. Governance runs automatically in 1-2 seconds. You only need to act on red alerts or approval requests.' },
                { q: 'Do I need to know code to use Governance?', a: 'No. Everything uses icons, colors, and numbers. Green = good, Red = needs attention.' },
                { q: t('governancePage.guideBlockedQ'), a: t('governancePage.guideBlockedA') },
                { q: 'Can I skip Governance?', a: t('governancePage.guideRiskA') },
            ],
            quickRef: '⚡ Quick Reference',
            quickRefItems: [
                { color: '🟢', meaning: 'Green', action: 'Everything\'s fine — no action needed' },
                { color: '🟡', meaning: 'Yellow', action: 'Needs attention — review details and decide' },
                { color: '🔴', meaning: 'Red', action: 'Action needed — approve, fix, or report' },
                { color: '🔒', meaning: 'Lock', action: t('governancePage.guideFrozen') },
            ],
        },
    };
}

export function GovernanceGuide() {
    const { language, t } = useLanguage();
    const l = guideCopy(t)[language];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{l.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{l.subtitle}</p>
            </div>

            {/* What is Governance */}
            <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-3">
                <h3 className="text-base font-semibold text-blue-900 dark:text-blue-200">{l.whatIs}</h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{l.whatIsAnswer}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 italic">{l.analogy}</p>
            </div>

            {/* Quick Reference */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{l.quickRef}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {l.quickRefItems.map((item, i) => (
                        <div key={i} className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-center space-y-1">
                            <div className="text-2xl">{item.color}</div>
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.meaning}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{item.action}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feature Cards */}
            <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{l.sections}</h3>
                <div className="space-y-4">
                    {l.cards.map((card, i) => (
                        <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{card.icon}</span>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{card.title}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded bg-gray-50 dark:bg-gray-900">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{l.whatLabel}: </span>
                                    <span className="text-gray-600 dark:text-gray-400">{card.what}</span>
                                </div>
                                <div className="p-2 rounded bg-gray-50 dark:bg-gray-900">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{l.whenLabel}: </span>
                                    <span className="text-gray-600 dark:text-gray-400">{card.when}</span>
                                </div>
                                <div className="p-2 rounded bg-gray-50 dark:bg-gray-900">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{l.howLabel}: </span>
                                    <span className="text-gray-600 dark:text-gray-400">{card.how}</span>
                                </div>
                                <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30">
                                    <span className="font-semibold text-amber-700 dark:text-amber-300">{l.tipLabel}: </span>
                                    <span className="text-amber-600 dark:text-amber-400">{card.tip}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ */}
            <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{l.faq}</h3>
                <div className="space-y-2">
                    {l.faqs.map((faq, i) => (
                        <details key={i} className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <summary className="flex min-h-11 items-center px-4 py-3 text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                {faq.q}
                            </summary>
                            <div className="px-4 pb-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                {faq.a}
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </div>
    );
}
