// Text Encoding Exception: Vietnamese input labels describe the existing Home outcomes.
import descriptions from '@/data/home-spec-jev-descriptions.json';
import { templates } from '@/lib/templates';
import { highestRisk, normalizeRiskLevel } from '@/lib/risk-check';
import { homeCertifiedPacks, newHomeOutcomes, newHomeTemplates, getNewHomeOutcomeContent, homeLandingContent } from './home-outcome-data';
import type { Template } from '@/types';
import { getRecommendedAssfPackage } from '@/lib/assf-template-recommendations';
import { getTemplateFieldLabel, getTemplateName, getTemplateIntentPattern, getTemplateOutputTemplate } from '@/lib/template-i18n';
import { OUTCOME_WORKFLOW_REGISTRY } from '@/lib/workflow-composition';
import { getHomeCommonQuestions, isHomeCommonQuestion } from './home-spec-common-questions';

export type HomeSpecLocale = 'vi' | 'en';
export const NO_SPEC_MATCH = 'no_match';
const noMatchDescription = 'No suitable template. The request is outside every listed result type or too vague to select a result safely.';
const override: Readonly<Record<string, string>> = descriptions;
// Template description changes follow docs/roadmaps/CVF_UI01_WEB_LOCAL_ALIGNMENT_ROADMAP_2026-11-22.md#permanent-e1-gate-for-template-descriptions.
const homeScopedDescriptions: Readonly<Partial<Record<string, Record<HomeSpecLocale, string>>>> = {
    web_build_handoff: {
        vi: 'Soạn lời giới thiệu, tiêu đề từng phần và lời mời hành động cho một trang tĩnh giới thiệu dịch vụ, sản phẩm hoặc tổ chức.',
        en: 'Write text, section headings, and calls to action for one static introduction page about a service, product, or organization.',
    },
    app_requirements_spec: {
        vi: 'Mô tả yêu cầu cho ứng dụng có chức năng hoặc làm lại cả website, như đặt chỗ, đăng ký, gửi email, dùng tài khoản hoặc cập nhật dữ liệu.',
        en: 'Specify requirements for a functional app with bookings, sign-ups, email, accounts, or data updates, or for a whole-site redesign.',
    },
    operator_plan: {
        vi: 'Lập kế hoạch vận hành hằng ngày cho nội bộ: phân công, ca làm, bàn giao và công việc định kỳ. Không dùng cho chiến dịch tiếp thị, tăng khách hàng hay chiến lược kinh doanh.',
        en: 'Plan day-to-day internal operations: staffing, shifts, handoffs, responsibilities, and recurring work. Not for marketing campaigns, audience growth, or business strategy.',
    },
    home_proposal: {
        vi: 'Soạn lời đề nghị để thuyết phục một bên cụ thể chấp thuận, mua hoặc tài trợ. Nêu chi phí hoặc lợi ích cho họ. Không dùng cho kế hoạch nghiên cứu, chiến dịch tiếp thị hay kế hoạch nội bộ.',
        en: 'Persuade a specific client, sponsor, or manager to approve, buy, or fund an offer. Explain its cost or benefit to them. Not for research, marketing campaigns, or internal plans.',
    },
    strategy_analysis: {
        vi: 'So sánh phương án, chọn chiến lược hoặc lập kế hoạch tiếp thị, chiến dịch quảng bá hay tăng khách. Nêu việc ưu tiên, cách làm và cách đánh giá kết quả.',
        en: 'Compare options, choose a strategy, or plan marketing, a promotional campaign, or customer growth. Include priorities, actions, and how to judge results.',
    },
};
const legacyFieldLabelsVi: Readonly<Record<string, string>> = {
    product_goal: 'Mục tiêu sản phẩm', target_user: 'Ai sẽ dùng', problem: 'Vấn đề cần giải quyết', constraints: 'Giới hạn',
    process_name: 'Tên quy trình', actors: 'Ai thực hiện', steps: 'Các bước', controls: 'Điểm cần kiểm tra',
    contract_text: 'Nội dung hợp đồng', review_goal: 'Mục đích rà soát', jurisdiction_context: 'Nơi áp dụng và bối cảnh',
    offer: 'Sản phẩm hoặc dịch vụ', audience: 'Người đọc', proof_points: 'Dẫn chứng',
};

const homeFieldLabels: Record<HomeSpecLocale, Readonly<Record<string, Readonly<Record<string, string>>>>> = {
    en: {
        documentation: {
            subject: 'What is this document about?',
            currentNotes: 'What notes or information do you already have?',
            readerGoal: 'What should the reader be able to do after reading?',
        },
        meeting_notes: {
            meeting_topic: 'What was the meeting about?',
            raw_notes: 'What was discussed? You can paste your notes.',
        },
        email_template: {
            purpose: 'What is the purpose of the email?',
        },
    },
    vi: {
        tos_review: {
            tos: 'Đường dẫn hoặc nội dung điều khoản dịch vụ',
            serviceType: 'Loại dịch vụ',
            model: 'Mô hình kinh doanh',
            markets: 'Thị trường hoạt động',
        },
    },
};

// Home-facing labels are separate from the Jev selection descriptions and contracts.
const displayTitles: Readonly<Record<string, { vi: string; en: string }>> = {
    app_builder_complete: { vi: 'Bản yêu cầu sản phẩm', en: 'Product requirements document' },
    documentation: { vi: 'Quy trình vận hành', en: 'Standard operating procedure' },
    tos_review: { vi: 'Rà soát điều khoản dịch vụ', en: 'Terms of service review' },
    web_build_handoff: { vi: 'Nội dung trang giới thiệu', en: 'Landing page content' },
    meeting_notes: { vi: 'Tóm tắt cuộc họp', en: 'Meeting summary' },
    email_template: { vi: 'Viết email', en: 'Email' },
    job_description: { vi: 'Mô tả công việc', en: 'Job description' },
    operator_plan: { vi: 'Kế hoạch vận hành', en: 'Operations plan' },
    performance_review: { vi: 'Đánh giá hiệu suất nhân viên', en: 'Employee performance review' },
    decision_memo: { vi: 'Bản ghi quyết định', en: 'Decision memo' },
    faq_outline: { vi: 'Dàn ý câu hỏi thường gặp', en: 'Frequently asked questions outline' },
    acceptance_criteria: { vi: 'Tiêu chí chấp nhận', en: 'Acceptance criteria' },
    vibe_to_spec: { vi: 'Chuyển ý tưởng thành bản đặc tả', en: 'Translate an idea into a specification' },
    project_init_checklist: { vi: 'Danh sách kiểm tra khởi tạo dự án', en: 'Project initialization checklist' },
    non_coder_debug: { vi: 'Hỗ trợ tìm lỗi cho người không viết mã', en: 'Debugging help for non-coders' },
    auto_documentation: { vi: 'Tạo tài liệu tự động', en: 'Automatic documentation' },
    app_requirements_spec: { vi: 'Bản yêu cầu ứng dụng', en: 'Application requirements specification' },
    api_design: { vi: 'Bản thiết kế giao diện kết nối', en: 'API design specification' },
    cli_tool_spec: { vi: 'Bản thiết kế công cụ dòng lệnh', en: 'Command-line tool specification' },
    vibe_logic_mapping: { vi: 'Chuyển ý tưởng phong cách thành hướng dẫn', en: 'Translate style ideas into a design brief' },
    copywriting_evaluation: { vi: 'Đánh giá nội dung quảng cáo', en: 'Copywriting evaluation' },
    pricing_strategy: { vi: 'Rà soát chiến lược giá', en: 'Pricing strategy review' },
    content_quality: { vi: 'Kiểm tra chất lượng nội dung', en: 'Content quality checklist' },
    ux_heuristic_evaluation: { vi: 'Đánh giá trải nghiệm theo nguyên tắc thiết kế', en: 'User experience heuristic evaluation' },
    error_handling_ux: { vi: 'Cải thiện trải nghiệm xử lý lỗi', en: 'Error handling experience' },
    web_ux_redesign_system: { vi: 'Hệ thống thiết kế trải nghiệm web', en: 'Web user experience system' },
    gdpr_compliance: { vi: 'Kiểm tra tuân thủ quy định bảo vệ dữ liệu của EU', en: 'EU data protection compliance review' },
    code_review: { vi: 'Rà soát mã', en: 'Code review' },
    architecture_review: { vi: 'Rà soát kiến trúc hệ thống', en: 'Architecture review' },
    api_security: { vi: 'Kiểm tra bảo mật giao diện kết nối', en: 'API security checklist' },
    data_handling: { vi: 'Rà soát cách xử lý dữ liệu', en: 'Data handling review' },
    user_flow_analysis: { vi: 'Phân tích hành trình người dùng', en: 'User flow analysis' },
    user_persona: { vi: 'Xây dựng chân dung người dùng', en: 'User persona development' },
    onboarding_review: { vi: 'Rà soát trải nghiệm người dùng mới', en: 'Onboarding experience review' },
    accessibility_audit: { vi: 'Kiểm tra khả năng tiếp cận', en: 'Accessibility audit' },
    seo_audit: { vi: 'Kiểm tra khả năng tìm thấy trên công cụ tìm kiếm', en: 'Search engine optimization audit' },
    landing_page_cro: { vi: 'Tối ưu hiệu quả trang giới thiệu', en: 'Landing page conversion review' },
    email_campaign: { vi: 'Rà soát chiến dịch email', en: 'Email campaign review' },
    social_ad_review: { vi: 'Rà soát quảng cáo mạng xã hội', en: 'Social media advertising review' },
};

const excludedHomeIds = new Set([
    'app_builder_wizard', 'business_strategy_wizard', 'content_strategy_wizard', 'data_analysis_wizard',
    'marketing_campaign_wizard', 'product_design_wizard', 'research_project_wizard',
    'security_assessment_wizard', 'system_design_wizard', 'api_design', 'api_security',
    'architecture_design', 'architecture_review', 'auto_documentation', 'cli_tool_spec', 'code_review',
    'non_coder_debug', 'project_init_checklist', 'vibe_logic_mapping', 'vibe_to_spec', 'web_ux_redesign_system',
    'app_builder_complete', 'build_my_app', 'decision_memo',
]);
const aliases: Readonly<Record<string, string>> = {
    app_builder_complete: 'app_requirements_spec', build_my_app: 'app_requirements_spec',
    decision_memo: 'strategy_analysis',
};
export const homeSpecTemplates: Template[] = [
    ...templates.filter(template => !template.isFolder && !excludedHomeIds.has(template.id))
        .map(template => ({
            ...template, parentFolder: undefined,
            description: homeScopedDescriptions[template.id]?.vi ?? template.description,
            ...(template.id === 'web_build_handoff' ? { sampleOutput: undefined, ...homeLandingContent('vi') } : {}),
        })),
    ...newHomeTemplates.map(template => ({
        ...template, description: homeScopedDescriptions[template.id]?.vi ?? template.description,
    })),
];
export function isHomeOnlyOutcome(id: string): boolean {
    return newHomeOutcomes.some(outcome => outcome.id === id);
}
export function resolveHomeOutcomeId(id: string): string | null {
    const canonical = aliases[id] ?? id;
    return homeSpecTemplates.some(template => template.id === canonical) ? canonical : null;
}

export function homeSpecOutcomeTitle(templateId: string, locale: HomeSpecLocale): string {
    const id = resolveHomeOutcomeId(templateId);
    if (!id) return '';
    const created = newHomeOutcomes.find(outcome => outcome.id === id);
    if (created) return created[locale];
    const displayTitle = displayTitles[id];
    if (displayTitle) return displayTitle[locale];
    const template = homeSpecTemplates.find(entry => entry.id === id)!;
    return getTemplateName(id, template.name, locale).replace(/^\d+[.\s_-]*/, '');
}

export function getJevOutcomeChoices(): { id: string; description: string }[] {
    return [{ id: NO_SPEC_MATCH, description: noMatchDescription }, ...homeSpecTemplates.map(template => {
        const created = newHomeOutcomes.find(outcome => outcome.id === template.id);
        const description = homeScopedDescriptions[template.id]?.en ?? created?.descriptionEn ?? (template.id === 'email_template' ? 'Write an email for a recipient and purpose.'
            : template.id === 'tos_review' ? 'Review terms of service for a specific service.'
            : override[template.id] ?? [homeSpecOutcomeTitle(template.id, 'en'), template.description].filter(Boolean).join('. '));
        return { id: template.id, description: description.replace(/\s+/g, ' ').trim().slice(0, 195) };
    })];
}

const vietnameseFieldNames: Readonly<Record<string, string>> = {
    feature: 'Tính năng hoặc quy trình', context: 'Bối cảnh', url: 'Địa chỉ trang', copy: 'Nội dung cần xem',
    type: 'Loại nội dung', audience: 'Người đọc', cta: 'Hành động mong muốn', goal: 'Mục tiêu',
    product: 'Sản phẩm hoặc dịch vụ', currentPrice: 'Giá hiện tại', model: 'Mô hình áp dụng',
    target: 'Khách hàng mục tiêu', content: 'Nội dung hoặc địa chỉ', keyword: 'Từ khóa cần tìm',
    email: 'Nội dung email', creative: 'Nội dung quảng cáo', platform: 'Kênh hoặc nền tảng',
    objective: 'Mục tiêu', brand: 'Tên thương hiệu', industry: 'Ngành hoặc lĩnh vực', samples: 'Nội dung mẫu',
    level: 'Mức tiêu chuẩn tiếp cận', flow: 'Luồng sử dụng', description: 'Mô tả chi tiết',
    features: 'Danh sách tính năng', data: 'Thông tin người dùng', errors: 'Thông báo lỗi hiện tại',
    dataCollected: 'Thông tin được thu thập', purpose: 'Mục đích', policy: 'Nội dung hoặc địa chỉ chính sách',
    businessType: 'Loại hình hoạt động', markets: 'Thị trường hoạt động', companySize: 'Quy mô tổ chức',
    criticalSystems: 'Hệ thống quan trọng', appName: 'Tên ứng dụng', appType: 'Loại ứng dụng',
    problem: 'Vấn đề cần giải quyết', targetUsers: 'Ai sẽ dùng?', coreFeatures: 'Các tính năng chính',
    outOfScope: 'Những gì chưa làm', successCriteria: 'Dấu hiệu đạt yêu cầu', dataStorage: 'Cách lưu dữ liệu',
};
function localizedHomeField(id: string, fieldId: string, fallback: string, locale: HomeSpecLocale): string {
    const created = newHomeOutcomes.find(outcome => outcome.id === id);
    const candidate = created?.fields.find(item => item[0] === fieldId)?.[locale === 'vi' ? 1 : 2]
        ?? homeFieldLabels[locale][id]?.[fieldId]
        ?? getTemplateFieldLabel(id, fieldId, fallback, locale);
    if (locale === 'vi' && /^[\x20-\x7E]+$/.test(candidate)) return vietnameseFieldNames[fieldId] ?? candidate;
    return locale === 'en' && /[^\x00-\x7F]/.test(candidate) ? englishFieldName(fieldId) : candidate;
}
export function getHomeSpecFields(templateId: string, locale: HomeSpecLocale = 'en'): { id: string; label: string }[] {
    const id = resolveHomeOutcomeId(templateId);
    const template = homeSpecTemplates.find(entry => entry.id === id);
    return (template?.fields ?? []).filter(field => field.required).map(field => ({
        id: field.id, label: localizedHomeField(id!, field.id, field.label, locale),
    }));
}

export function getHomeDescriptionFields(templateId: string) {
    return [
        ...getHomeSpecFields(templateId).filter(field => !isHomeCommonQuestion(field.id)),
        ...getHomeCommonQuestions('en').map(({ id, descriptionField }) => ({ id, label: descriptionField })),
    ];
}
const translatedOutputs: Readonly<Record<string, string[]>> = {
    documentation: ['Document purpose', 'Required inputs', 'Step-by-step procedure', 'Decision branches', 'Quality checks', 'Failure recovery', 'Handoff checklist'],
    data_analysis: ['Data summary', 'Key insights', 'Uncertainty and missing data', 'Prioritized recommendations', 'Follow-up checklist'],
    data_handling: ['Data lifecycle map', 'Risks and ambiguities', 'Retention, sharing and deletion rules', 'Governance checklist'],
    meeting_notes: ['Meeting details', 'Summary', 'Discussion', 'Decisions', 'Action items'],
    job_description: ['Role overview', 'Responsibilities', 'Requirements', 'Benefits and work environment'],
    performance_review: ['Review overview', 'Achievements', 'Strengths', 'Development areas', 'Next goals'],
};
function englishFieldName(id: string): string {
    const text = id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
}
export function getHomeExportTemplate(templateId: string, locale: HomeSpecLocale): Template | undefined {
    const id = resolveHomeOutcomeId(templateId);
    const source = homeSpecTemplates.find(template => template.id === id);
    if (!source) return undefined;
    if (locale === 'vi') return { ...source, fields: source.fields.map(field => ({ ...field, label: localizedHomeField(id!, field.id, field.label, 'vi') })) };
    const labels = new Map(getHomeSpecFields(id!, 'en').map(field => [field.id, field.label]));
    const title = homeSpecOutcomeTitle(id!, 'en');
    const newContent = id === 'web_build_handoff' ? homeLandingContent('en') : getNewHomeOutcomeContent(id!, 'en');
    const outputExpected = newContent?.outputExpected ?? translatedOutputs[id!] ?? source.outputExpected;
    const translatedIntent = getTemplateIntentPattern(id!, '', 'en');
    const translatedOutput = getTemplateOutputTemplate(id!, undefined, 'en');
    return { ...source, name: title, description: homeScopedDescriptions[id!]?.en ?? title,
        fields: source.fields.map(field => ({ ...field, label: labels.get(field.id) ?? englishFieldName(field.id),
            placeholder: undefined, hint: undefined, example: undefined })),
        intentPattern: newContent?.intentPattern ?? (translatedIntent || (`INTENT: Prepare ${title}.\n` + source.fields.map(field => `${englishFieldName(field.id)}: [${field.id}]`).join('\n')
            + '\nOUTPUT REQUIREMENTS: Use the provided information and distinguish missing facts.\nSUCCESS CRITERIA: Deliver the requested result within the stated limits.')),
        outputTemplate: newContent?.outputTemplate ?? translatedOutput ?? `# ${title}\n\n${outputExpected.map(section => `## ${section}\n`).join('\n')}\n## Assumptions and missing information\n`,
        outputExpected,
    };
}

// New Home-only outcomes have no certified ASSF recommendation until separately reviewed.
export const homeOnlyAssfRecommendations: Readonly<Record<string, null>> = {
    short_message: null, social_post: null, tracking_table: null, lesson_or_test: null,
    summary_translation: null, home_proposal: null, home_contract_review: null,
};
export function getHomeRecommendedAssfPackage(templateId: string) {
    const id = resolveHomeOutcomeId(templateId);
    return !id || Object.hasOwn(homeOnlyAssfRecommendations, id) ? null : getRecommendedAssfPackage(id);
}

type PackId = keyof typeof homeCertifiedPacks;
const outcomePacks: Readonly<Record<string, readonly PackId[]>> = {
    strategy_analysis: ['strategy_analysis'], app_requirements_spec: ['app_requirements_spec', 'product_brief'],
    documentation: ['sop_generator'], home_proposal: ['proposal_writer'], meeting_notes: ['meeting_summarizer'],
    home_contract_review: ['contract_review'], tos_review: ['contract_review'],
    web_build_handoff: ['landing_page_builder'], competitor_review: ['competitor_review'], data_analysis: ['data_analysis'],
};
export function getHomeOutcomeAuthority(templateId: string) {
    const id = resolveHomeOutcomeId(templateId);
    const packs = id ? outcomePacks[id]?.map(key => homeCertifiedPacks[key]) : undefined;
    if (!packs?.length) return null;
    return { riskLevel: highestRisk(...packs.map(({ risk }) => normalizeRiskLevel(risk.riskLevel))), packs };
}

const quickActionIds: Readonly<Record<string, string>> = {
    create_prd: 'app_requirements_spec', generate_sop: 'documentation', review_contract: 'home_contract_review',
    build_landing_page: 'web_build_handoff', summarize_meeting: 'meeting_notes', create_proposal: 'home_proposal',
};
export const homeQuickActions = OUTCOME_WORKFLOW_REGISTRY.map(item => ({
    ...item, templateId: quickActionIds[item.outcomeKey],
}));
export function getHomeOutcomeByKey(key: string | null): string | undefined {
    return key ? quickActionIds[key] : undefined;
}

export function getLegacyHomeSpecFields(templateId: string, locale: HomeSpecLocale): { id: string; label: string }[] {
    const id = resolveHomeOutcomeId(templateId);
    const outcome = homeQuickActions.find(entry => entry.templateId === id);
    return outcome?.composition.inputContract.split(',').map(field => {
        const id = field.trim();
        return { id, label: (locale === 'vi' && legacyFieldLabelsVi[id]) || id.replaceAll('_', ' ') };
    }) ?? [];
}
