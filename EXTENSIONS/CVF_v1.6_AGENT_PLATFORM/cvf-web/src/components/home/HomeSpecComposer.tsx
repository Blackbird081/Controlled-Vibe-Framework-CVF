'use client';
// Text Encoding Exception: this component presents the Vietnamese and English Home specification workflow.

import { useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, FolderOpen, Plus } from 'lucide-react';
import { TechnicalDetails } from '@/components/TechnicalDetails';
import { HomeSpecAccountScope, useHomeSpecInput } from '@/lib/hooks/useHomeSpecInput';
import { routeEligibleHomeKeywords as routeHomeSpecKeywords } from '@/lib/home-spec-keyword-router';
import { getHomeCommonQuestions, isHomeCommonQuestion } from '@/lib/home-spec-common-questions';
import { homeQuickActions as OUTCOME_WORKFLOW_REGISTRY, getHomeSpecFields, getLegacyHomeSpecFields, homeSpecOutcomeTitle, homeSpecTemplates, resolveHomeOutcomeId, type HomeSpecLocale } from '@/lib/home-spec-jev-catalog';
import { requestHomeSpecJev, type HomeSpecChoice, type HomeSpecFields } from '@/lib/home-spec-jev-client';
import { appendHomeSpecClarification } from '@/lib/home-spec-clarification';
import { HomeAssfSuggestion } from './HomeAssfSuggestion';
import { HomeSpecClarificationPanel, useHomeSpecClarification } from './HomeSpecClarification';
import { prepareHomeSpec, makeHomeGeneralTemplate, recordHomeSpecExport } from './home-spec-export';
import { findHomeSpecDeliverable } from './home-spec-deliverable';
import { homeSpecExternalRequest } from './home-spec-external-request';
import { isMessagingProject, isPersonalMessageRequest } from './home-spec-personal-message';
import { PHYSICAL_SAFETY_GUIDANCE } from '@/lib/physical-safety';
import { isNewHomeSpecTask } from './home-spec-task';

const action = 'cvf-control inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50';
const primary = action + ' bg-indigo-600 text-white hover:bg-indigo-700';
const secondary = action + ' border border-slate-300 bg-white text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200';
const input = 'w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-white/15 dark:bg-[#111218] dark:text-white';
const exportDescriptionCoverage = "From the user's description in User Context (not entered separately)";

interface Props {
    language: HomeSpecLocale;
    initialTemplate?: string;
    selectionRequest?: { id: string; revision: number } | null;
    starterGoal?: string;
    onStarterGoalImported?: () => void;
    onStartNewWork?: () => void;
    library: ReactNode;
}

type Stage = 'describe' | 'clarify' | 'review' | 'candidates' | 'unmatched' | 'outside' | 'quick' | 'fields' | 'draft';
type Event = 'selection' | 'library' | 'no_match' | 'clarify' | 'export';

const copy = {
    vi: {
        title: 'Tạo bản đặc tả', lead: 'Mô tả việc bạn cần, rồi xem lại và tải bản đặc tả cho trợ lý trên máy.',
        goal: 'Bạn muốn tạo gì?', placeholder: 'Ví dụ: Viết quy trình bàn giao đơn hàng cho nhân viên mới.',
        quick: 'Làm ngay với trợ lý AI',
        quickSpec: 'Tạo đặc tả',
        go: 'Tiếp tục', wait: 'Đang xử lý…', templates: 'Bắt đầu bằng loại kết quả', browse: 'Mở thư viện mẫu', close: 'Đóng thư viện mẫu',
        automatic: 'Gợi ý tự động', keywords: 'Gợi ý theo từ khóa', selection: 'Loại kết quả bạn chọn',
        direct: 'Khi bật gợi ý tự động, CVF gửi mô tả này đến dịch vụ gợi ý để tìm loại kết quả phù hợp.',
        clarify: 'Trợ lý cần biết thêm chi tiết nào?', noMatch: 'Không mẫu nào phù hợp',
        clarifyRequired: 'Bổ sung câu trả lời trước khi tiếp tục.', possible: 'Có thể phù hợp', genericInstead: 'Không mẫu nào phù hợp — tạo bản chung',
        unmatched: 'CVF chưa có mẫu cho việc này', makeGeneric: 'Tạo đặc tả chung', genericTitle: 'Đặc tả chung',
        outside: 'CVF không thực hiện hành động bên ngoài',
        outsideNext: 'Bạn có thể nhờ trợ lý soạn tin nhắn để tự gửi hoặc lập danh sách việc để tự làm.',
        outsideHelp: 'Soạn tin nhắn hoặc danh sách việc cần làm',
        outsideDraft: 'Giúp tôi soạn tin nhắn để tự gửi hoặc lập danh sách những việc tôi có thể tự làm cho yêu cầu dưới đây.',
        outsideEdit: 'Sửa mô tả',
        outsideSafety: PHYSICAL_SAFETY_GUIDANCE.vi,
        genericFields: { goal: 'Mục tiêu', context: 'Bối cảnh', deliverable: 'Kết quả cần nhận', constraints: 'Giới hạn' },
        confirm: 'Dùng loại kết quả này', missing: 'Bổ sung thông tin còn thiếu', allSet: 'Bạn có thể xem lại bản đặc tả.',
        review: 'Xem lại đặc tả', edit: 'Sửa thông tin đã nhập',
        technical: 'Chi tiết kỹ thuật',
        draft: 'Bản nháp đặc tả', specification: 'Bản đặc tả', outcome: 'Loại kết quả',
        description: 'Mô tả công việc', clarification: 'Thông tin làm rõ',
        download: 'Tải bản đặc tả',
        startNew: 'Bắt đầu việc mới', discardDraft: 'Bạn muốn bỏ bản nháp chưa tải xuống và bắt đầu việc mới?',
        newTaskQuestion: 'Đây là việc mới phải không?',
        newTaskDetails: 'Việc mới sẽ bắt đầu với các ô trống. Bạn có thể mở lại việc chưa tải trong Bản nháp.',
        continueSameTask: 'Vẫn là việc này, giữ câu trả lời',
        continueNewTask: 'Tiếp tục với việc mới', keepCurrentTask: 'Quay lại việc trước', unfinishedDrafts: 'Bản nháp chưa tải',
        downloadPurpose: 'Dùng tệp này để giao việc cho trợ lý của bạn.',
        copy: 'Sao chép', copied: 'Đã sao chép bản đặc tả.', copyFailed: 'Không sao chép được. Hãy tải tệp xuống.', howTo: 'Cách dùng tệp này', howToText: 'Dán nội dung hoặc gửi tệp cho trợ lý AI bạn tin dùng. Trước khi giao, kiểm tra mục tiêu, thông tin đã nhập, giới hạn và các chỗ còn thiếu.',
        downloaded: 'Đã chuẩn bị tệp tải xuống.', downloadFailed: 'Chưa tải được bản đặc tả. Hãy thử lại.',
        pick: 'Chọn loại kết quả', choose: 'Chọn một loại kết quả', under: 'Nhập ít nhất 8 ký tự.',
        disabled: 'Gợi ý tự động đang tắt. CVF dùng từ khóa để gợi ý.',
        unavailable: 'Dịch vụ gợi ý chưa phản hồi. CVF dùng từ khóa để gợi ý.',
        budget: 'Gợi ý tự động đã hết lượt hôm nay. CVF dùng từ khóa để gợi ý.',
        rate: 'Có quá nhiều yêu cầu gợi ý trong một phút. CVF dùng từ khóa để gợi ý.',
        fieldsFallback: 'CVF dùng danh sách thông tin của mẫu. Bỏ qua phần bạn đã nêu trong mô tả.',
        newFieldPlaceholder: 'Điền nếu thông tin này chưa có trong mô tả.',
        fromUserContext: 'Lấy từ phần bạn mô tả (chưa nhập riêng)',
        optionalQuestions: 'Thông tin bổ sung (không bắt buộc)',
        provided: 'Đã có', userWillSupply: 'Người dùng sẽ bổ sung', openQuestions: 'Câu hỏi mở',
        noMaterials: 'Chưa ghi tệp, mẫu hay đường dẫn sẽ gửi thêm.',
        nothingOpen: 'Chưa thấy chi tiết nào cần hỏi thêm theo mẫu này.',
        checkOpen: 'Trợ lý sẽ xác định chi tiết nào còn cần làm rõ trước khi làm phần phụ thuộc.',
    },
    en: {
        title: 'Create a specification', lead: 'Describe what you need, then review and download the specification for your assistant.',
        goal: 'What do you want to create?', placeholder: 'For example, write an order handoff procedure for new staff.',
        quick: 'Work directly with AI assistant',
        quickSpec: 'Create specification',
        go: 'Continue', wait: 'Working…', templates: 'Start with an outcome', browse: 'Open template library', close: 'Close template library',
        automatic: 'Automatic suggestion', keywords: 'Keyword suggestion', selection: 'Your selected outcome',
        direct: 'When automatic suggestions are on, CVF sends this description to the suggestion service to find an outcome.',
        clarify: 'What other details should the assistant know?', noMatch: 'No suitable template',
        clarifyRequired: 'Add an answer before continuing.', possible: 'Could be a good fit', genericInstead: 'None fit — create a general specification',
        unmatched: 'CVF has no template for this task', makeGeneric: 'Create a general specification', genericTitle: 'General specification',
        outside: 'CVF cannot take actions outside this site',
        outsideNext: 'The assistant can draft a message for you to send or make a checklist for you to follow.',
        outsideHelp: 'Draft a message or checklist',
        outsideDraft: 'Help me draft a message I can send or make a checklist I can follow for the request below.',
        outsideEdit: 'Edit your description',
        outsideSafety: PHYSICAL_SAFETY_GUIDANCE.en,
        genericFields: { goal: 'Goal', context: 'Context', deliverable: 'Deliverable', constraints: 'Constraints' },
        confirm: 'Use this outcome', missing: 'Add missing information', allSet: 'You can review the specification.',
        review: 'Review specification', edit: 'Edit entered information',
        technical: 'Technical details',
        draft: 'Specification draft', specification: 'Specification', outcome: 'Outcome',
        description: 'Work description', clarification: 'Clarification',
        download: 'Download specification',
        startNew: 'Start new work', discardDraft: 'Discard this draft with changes you have not downloaded and start new work?',
        newTaskQuestion: 'Is this a new task?',
        newTaskDetails: 'The new task starts with blank answers. You can reopen work you haven’t downloaded under Unfinished drafts.',
        continueSameTask: 'Same task, keep my answers',
        continueNewTask: 'Continue with the new task', keepCurrentTask: 'Go back to the previous task', unfinishedDrafts: 'Unfinished drafts',
        downloadPurpose: 'Use this file to hand the work over to your assistant.',
        copy: 'Copy', copied: 'Specification copied.', copyFailed: 'Could not copy. Download the file instead.', howTo: 'How to use this file', howToText: 'Paste the content or attach the file to your chosen AI assistant. Before handing it over, check the goal, entered details, limits, and missing information.',
        downloaded: 'Your download is ready.', downloadFailed: 'The specification could not be downloaded. Try again.',
        pick: 'Choose an outcome', choose: 'Select an outcome', under: 'Enter at least 8 characters.',
        disabled: 'Automatic suggestions are off. CVF is using keywords to suggest an outcome.',
        unavailable: 'The suggestion service did not respond. CVF is using keywords to suggest an outcome.',
        budget: 'Automatic suggestions reached their limit for today. CVF is using keywords to suggest an outcome.',
        rate: 'There were too many requests for suggestions in one minute. CVF is using keywords to suggest an outcome.',
        fieldsFallback: 'CVF is using the template’s input list. Skip any details already included in your description.',
        newFieldPlaceholder: 'Fill this in if it is missing from your description.',
        fromUserContext: 'Taken from the description you entered',
        optionalQuestions: 'Optional details',
        provided: 'Provided', userWillSupply: 'User will supply', openQuestions: 'Open questions',
        noMaterials: 'No files, examples or links listed for later.',
        nothingOpen: 'This template has no unanswered details flagged.',
        checkOpen: 'These details will be clarified before any work that depends on them.',
    },
} as const;

function fallbackText(labels: typeof copy[HomeSpecLocale], reason?: string | null) {
    const code = reason?.toLowerCase() ?? '';
    if (code === 'rate_limit') return labels.rate;
    if (code.includes('budget') || code.includes('cap') || code.includes('limit')) return labels.budget;
    return code.includes('disabled') || code.includes('off') ? labels.disabled : labels.unavailable;
}

function isShortWritingOutcome(id: string) {
    return id === 'short_message' || id === 'email_template';
}

function homeSpecJevGoal(description: string, clarification: string) {
    if (!clarification) return description.slice(0, 1000);
    // Keep both answers inside the endpoint's existing 1000-character limit.
    const detail = clarification.slice(0, Math.max(499, 999 - description.length));
    return `${description.slice(0, 999 - detail.length)}\n${detail}`;
}

export function HomeSpecComposer(props: Props) {
    const accountScope = useContext(HomeSpecAccountScope)?.accountScope;
    return <HomeSpecWork key={accountScope ? `account:${accountScope}` : 'guest'} {...props} />;
}

function HomeSpecWork({ language, initialTemplate, selectionRequest, starterGoal, onStarterGoalImported, onStartNewWork, library }: Props) {
    const t = copy[language];
    const homeAccount = useContext(HomeSpecAccountScope);
    const accountScope = homeAccount?.accountScope;
    const { input: savedInput, setInput, resetInput, startSeparateTask, restoreDraft } = useHomeSpecInput(accountScope);
    const { goal, extra, values } = savedInput;
    const [stage, setStage] = useState<Stage>('describe');
    const [chosen, setChosen] = useState(initialTemplate ? resolveHomeOutcomeId(initialTemplate) ?? '' : '');
    const [keywordSuggestion, setKeywordSuggestion] = useState('');
    const [jevChoice, setJevChoice] = useState(false);
    const [journeyChoiceId, setJourneyChoiceId] = useState<string>();
    const [clarificationAsked, setClarificationAsked] = useState(false);
    const [candidates, setCandidates] = useState<string[]>([]);
    const [generic, setGeneric] = useState(false);
    const [runId, setRunId] = useState<string>();
    const [jevSkillRunId, setJevSkillRunId] = useState<string>();
    const [suggestion, setSuggestion] = useState<{ key: string; skillId: string }>();
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [missingFieldIds, setMissingFieldIds] = useState<Set<string> | null>(null);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [downloadReady, setDownloadReady] = useState(false);
    const [goalEdit, setGoalEdit] = useState<string | null>(null);
    const [confirmNewTask, setConfirmNewTask] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const continueNewTaskRef = useRef<HTMLButtonElement>(null);
    const inFlight = useRef(false);
    const mounted = useRef(true);
    const description = goalEdit ?? goal;
    const originalUserText = [goal, extra].filter(value => value.trim()).join('\n');
    const jevGoal = homeSpecJevGoal(goal.trim(), extra.trim());
    const suggestionKey = `${runId}:${jevGoal}`;
    const suggestedAssfPackageId = suggestion?.key === suggestionKey ? suggestion.skillId : undefined;
    const outcomeTitle = generic ? t.genericTitle : homeSpecOutcomeTitle(chosen, language);
    const outcomeId = keywordSuggestion || chosen;
    const quickDescription = stage === 'describe' && isPersonalMessageRequest(description) && !homeSpecExternalRequest(description, extra);
    const allowShortSuggestion = !isMessagingProject(goal);
    const quickSuggestion = isPersonalMessageRequest(goal)
        || (allowShortSuggestion && (jevChoice || Boolean(keywordSuggestion)) && isShortWritingOutcome(outcomeId));
    const quickCandidates = allowShortSuggestion && candidates.length > 0 && candidates.every(isShortWritingOutcome);
    const matchingPreset = OUTCOME_WORKFLOW_REGISTRY.find(item => item.templateId === outcomeId);
    const abbreviatedTitle = matchingPreset?.outcomeKey === 'create_prd' || matchingPreset?.outcomeKey === 'generate_sop'
        ? matchingPreset.title[language] : null;
    const templateFields = generic ? Object.entries(t.genericFields).map(([id, label]) => ({ id, label }))
        : getHomeSpecFields(chosen, language);
    const commonQuestions = getHomeCommonQuestions(language);
    const visibleCommonQuestions = commonQuestions.filter(field => !missingFieldIds || missingFieldIds.has(field.id));
    const fields = templateFields.filter(field => !isHomeCommonQuestion(field.id) && (!missingFieldIds || missingFieldIds.has(field.id)));
    const legacyFields = generic ? [] : getLegacyHomeSpecFields(chosen, language)
        .filter(field => !isHomeCommonQuestion(field.id) && !templateFields.some(current => current.id === field.id));
    const answers = [...templateFields.filter(field => !isHomeCommonQuestion(field.id)), ...legacyFields].flatMap(field => {
        const value = values[field.id]?.trim();
        return value ? [{ id: field.id, label: field.label, value }] : [];
    });
    const commonAnswers = commonQuestions.flatMap(field => {
        const value = values[field.id]?.trim() || (missingFieldIds && !missingFieldIds.has(field.id) ? t.fromUserContext : '');
        return value ? [{ id: field.id, label: field.label, value }] : [];
    });
    const previewSections = [
        { id: 'outcome', label: t.outcome, value: outcomeTitle },
        { id: 'request', label: t.description, value: goal.trim() },
        ...(extra.trim() ? [{ id: 'clarification', label: t.clarification, value: extra.trim() }] : []),
        ...answers.map(answer => ({ ...answer, id: `field-${answer.id}` })),
        ...commonAnswers.filter(answer => answer.id !== 'homeInputReferences'),
    ];
    const referencesAnswer = commonAnswers.find(answer => answer.id === 'homeInputReferences')?.value;
    const exportTemplate = generic ? makeHomeGeneralTemplate('en', copy.en.genericTitle, copy.en.genericFields)
        : homeSpecTemplates.find(template => template.id === chosen);
    const exportFields = [...(exportTemplate?.fields ?? []), ...legacyFields, ...commonQuestions];
    const enteredValues = Object.fromEntries(exportFields.flatMap(({ id }) =>
        values[id]?.trim() ? [[id, values[id]]] : [],
    ));
    const coverageValues = { ...enteredValues, ...Object.fromEntries([...templateFields, ...commonQuestions].flatMap(({ id }) =>
        missingFieldIds && !missingFieldIds.has(id) && !enteredValues[id] ? [[id, exportDescriptionCoverage]] : [],
    )) };
    const packet = stage === 'draft' && exportTemplate
        ? prepareHomeSpec(exportTemplate, enteredValues, coverageValues, language, originalUserText, originalUserText,
            suggestedAssfPackageId, generic ? t.genericFields : undefined) : undefined;
    const agentMarkdown = packet?.markdown ?? '';
    const clarificationAnswers = Object.values(enteredValues);
    const canClarify = stage === 'draft' && !homeSpecExternalRequest(goal, [extra, ...clarificationAnswers].join('\n'));
    const clarification = useHomeSpecClarification(
        { language, goal, extra, answers: clarificationAnswers }, canClarify, homeAccount?.canUseSavedProviderKey,
    );
    const downloadMarkdown = appendHomeSpecClarification(agentMarkdown, clarification.result, language);
    const openQuestions = packet?.openQuestions ?? [];

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        if (!selectionRequest) return;
        let active = true;
        queueMicrotask(() => {
            if (!active) return;
            const id = resolveHomeOutcomeId(selectionRequest.id);
            if (!id) return;
            setChosen(id);
            setKeywordSuggestion('');
            setJevChoice(false);
            setLibraryOpen(false);
            setStage('describe');
        });
        return () => { active = false; };
    }, [selectionRequest]);

    useEffect(() => {
        if (!accountScope || !starterGoal?.trim()) return;
        const preserved = setInput('goal', previous => {
            if (previous === starterGoal || previous.endsWith(`\n\n${starterGoal}`)) return previous;
            return previous ? `${previous}\n\n${starterGoal}` : starterGoal;
        });
        if (preserved) onStarterGoalImported?.();
    }, [accountScope, onStarterGoalImported, setInput, starterGoal]);

    async function perform(work: () => Promise<void>) {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        setError('');
        try { await work(); }
        finally { inFlight.current = false; setBusy(false); }
    }

    function feedback(event: Event, templateId?: string, journey = runId) {
        if (journey) return requestHomeSpecJev({ action: 'feedback', runId: journey, event, ...(templateId ? { templateId } : {}) });
        return Promise.resolve(null);
    }

    function askForDetail(journey?: string, alreadyAsked = clarificationAsked) {
        if (alreadyAsked) {
            setStage('unmatched');
            return;
        }
        setClarificationAsked(true);
        setStage('clarify');
        if (journey) void feedback('clarify', undefined, journey);
    }

    function routeByKeywords(text: string, journey: string | undefined, alreadyAsked: boolean) {
        const result = routeHomeSpecKeywords(text);
        const id = result.confidence === 'strong' && result.recommendedTemplateId
            && homeSpecOutcomeTitle(result.recommendedTemplateId, language) ? result.recommendedTemplateId : null;
        setJevChoice(false);
        setChosen('');
        setKeywordSuggestion(id ?? '');
        if (id) setStage('review');
        else askForDetail(journey, alreadyAsked);
    }

    function submitGoal(event: FormEvent) {
        event.preventDefault();
        if (inFlight.current) return;
        if (stage === 'clarify' && !extra.trim()) { setError(t.clarifyRequired); return; }
        const newTask = stage === 'describe' && goalEdit !== null && isNewHomeSpecTask(goal, description);
        if (newTask && description.trim().length >= 8) {
            setConfirmNewTask(true);
            setError('');
            requestAnimationFrame(() => continueNewTaskRef.current?.focus());
            return;
        }
        continueGoal();
    }

    function continueGoal(action: 'route' | 'new' | 'resume' = 'route') {
        const newTask = action === 'new';
        const nextExtra = newTask ? '' : extra.trim();
        const userText = [description.trim(), nextExtra].filter(Boolean).join('\n');
        if (userText.length < 8) { setError(t.under); return; }
        if (stage === 'describe' && description.trim().length < 8) { setError(t.under); return; }
        setConfirmNewTask(false);
        if (newTask) {
            startSeparateTask(description);
            resetJourney(chosen);
        } else if (goalEdit !== null) {
            setInput('goal', description);
            if (values.goal === goal.trim()) setInput('values', { ...values, goal: description.trim() });
            setGoalEdit(null);
        }
        if (homeSpecExternalRequest(description, nextExtra)) {
            setLibraryOpen(false);
            showStage('outside');
            return;
        }
        if (action === 'resume' && resumeDraftOutcome(savedInput.templateId)) return;
        if (!chosen && isPersonalMessageRequest(description)) {
            setLibraryOpen(false);
            setNotice('');
            showStage('quick');
            return;
        }
        const alreadyAsked = !newTask && clarificationAsked;
        const submittedGoal = homeSpecJevGoal(description.trim(), nextExtra);
        void perform(async () => {
            setLibraryOpen(false);
            if (stage === 'describe' && chosen) { setStage('review'); return; }
            setNotice('');
            const choice = await requestHomeSpecJev<HomeSpecChoice>({ action: 'choose', goal: submittedGoal });
            setRunId(choice?.runId);
            setJevSkillRunId(choice?.decision !== 'fallback' ? choice?.runId : undefined);
            if (choice?.decision === 'preselect' && choice.templateId && homeSpecOutcomeTitle(choice.templateId, language)) {
                setCandidates([]);
                setJourneyChoiceId(choice.templateId);
                setChosen(resolveHomeOutcomeId(choice.templateId) ?? '');
                setJevChoice(true);
                setStage('review');
            } else if (choice?.decision === 'clarify') {
                const offered = (choice.topNoMatch ? [] : choice.candidates ?? []).slice(0, 3).map(id => resolveHomeOutcomeId(id)).filter((id): id is string => id !== null);
                setCandidates(offered);
                if (choice.topNoMatch) {
                    setStage('unmatched');
                } else if (alreadyAsked && offered.length) {
                    setStage('candidates');
                } else askForDetail(choice.runId, alreadyAsked);
            } else {
                setCandidates([]);
                setNotice(fallbackText(t, choice?.fallback));
                routeByKeywords(userText, choice?.runId, alreadyAsked);
            }
        });
    }

    function toggleLibrary() {
        void perform(async () => {
            if (!libraryOpen && runId && stage !== 'describe' && !await feedback('library')) {
                setRunId(undefined);
            }
            setLibraryOpen(!libraryOpen);
        });
    }

    function chooseTemplate(id: string) {
        setChosen(id);
        setKeywordSuggestion('');
        if (stage !== 'describe') {
            setJevChoice(false);
            setLibraryOpen(false);
            setStage('review');
            void feedback('selection', id);
        } else {
            inputRef.current?.focus();
        }
    }

    function rejectOutcome() {
        void perform(async () => {
            await feedback('no_match');
            setJevChoice(false);
            setChosen('');
            setKeywordSuggestion('');
            askForDetail(runId);
        });
    }

    function confirmOutcome() {
        void perform(async () => {
            const templateId = keywordSuggestion || chosen;
            const journeyTemplateId = jevChoice && journeyChoiceId && resolveHomeOutcomeId(journeyChoiceId) === templateId ? journeyChoiceId : templateId;
            setChosen(templateId);
            setKeywordSuggestion('');
            setLibraryOpen(false);
            await feedback('selection', journeyTemplateId);
            const local = getHomeSpecFields(templateId, language);
            const result = runId ? await requestHomeSpecJev<HomeSpecFields>({ action: 'fields', runId, templateId: journeyTemplateId, goal: jevGoal }) : null;
            if (!result?.fallback && Array.isArray(result?.missing)
                && result.missing.every(field => local.some(item => item.id === field?.id) || isHomeCommonQuestion(field?.id))) {
                setMissingFieldIds(new Set(result.missing.map(field => field.id)));
            } else {
                setMissingFieldIds(null);
                if (runId || local.length) setNotice(t.fieldsFallback);
            }
            setInput('templateId', templateId);
            setStage('fields');
        });
    }

    function startGeneric() {
        setGeneric(true);
        setLibraryOpen(false);
        setNotice('');
        const seeded: Record<string, string> = { ...values, goal: values.goal?.trim() || goal.trim() };
        const statements = [goal, extra].flatMap(text => text.split(/[\n;.!?]+/)).map(text => text.trim()).filter(Boolean);
        const seeds: Record<string, string | undefined> = {
            deliverable: findHomeSpecDeliverable(statements),
            context: statements.find(text => /^(?:context|background|bối cảnh)\s*:/iu.test(text)),
            constraints: statements.find(text => /^(?:constraints?|limits?|budget|giới hạn|ngân sách)\s*:/iu.test(text)),
        };
        for (const [field, answer] of Object.entries(seeds)) {
            if (!seeded[field]?.trim() && answer) seeded[field] = answer;
        }
        setMissingFieldIds(new Set([
            ...Object.keys(t.genericFields).filter(id => !seeded[id]?.trim()),
            ...commonQuestions.map(field => field.id),
        ]));
        setInput('values', seeded);
        setInput('templateId', 'home-general');
        setStage('fields');
    }

    function download() {
        setError('');
        try {
            if (!exportTemplate || !packet) throw new Error('Missing Home specification');
            const date = new Date().toISOString().slice(0, 10);
            const filename = `cvf-spec-${exportTemplate.id}-${date}.md`;
            const url = URL.createObjectURL(new Blob([downloadMarkdown], { type: 'text/markdown;charset=utf-8' }));
            const link = Object.assign(document.createElement('a'), { href: url, download: filename });
            try { link.click(); }
            finally { setTimeout(() => URL.revokeObjectURL(url), 0); }
            setInput('downloadedTemplate', exportTemplate.id);
            setDownloadReady(true);
            setNotice(t.downloaded);
            recordHomeSpecExport(accountScope, { runId, tier: 'local' });
            void feedback('export');
        } catch {
            setNotice('');
            setError(t.downloadFailed);
        }
    }

    async function copySpec() {
        try { await navigator.clipboard.writeText(downloadMarkdown); setNotice(t.copied); setError(''); }
        catch { setError(t.copyFailed); }
    }

    function renderField(field: { id: string; label: string; help?: string }) {
        const id = `home-spec-field-${field.id}`;
        const helpId = field.help ? `${id}-help` : undefined;
        return (<div className="space-y-1" key={field.id}>
            <label htmlFor={id} className="block font-medium">{field.label}</label>
            <textarea id={id} className={input} rows={2} maxLength={1000} aria-describedby={helpId} placeholder={t.newFieldPlaceholder} value={values[field.id] ?? ''} onChange={e => {
                const value = e.target.value;
                setInput('values', previous => ({ ...previous, [field.id]: value }));
            }} />
            {field.help && <p id={helpId} className="text-sm text-slate-600 dark:text-slate-300">{field.help}</p>}
        </div>);
    }

    function showStage(next: Stage) {
        if (next !== 'draft') clarification.clear();
        setError('');
        setNotice('');
        setStage(next);
    }

    function openAssistant(assistantDraft: string) {
        window.dispatchEvent(new CustomEvent('cvf:openAgent', { detail: { draft: assistantDraft } }));
    }

    function resetJourney(templateId = '') {
        clarification.clear();
        setStage('describe');
        setChosen(templateId);
        setKeywordSuggestion('');
        setJevChoice(false);
        setJourneyChoiceId(undefined);
        setClarificationAsked(false);
        setCandidates([]);
        setGeneric(false);
        setRunId(undefined);
        setJevSkillRunId(undefined);
        setSuggestion(undefined);
        setLibraryOpen(false);
        setMissingFieldIds(null);
        setNotice('');
        setError('');
        setDownloadReady(false);
        setGoalEdit(null);
        setConfirmNewTask(false);
    }

    function startNewWork() {
        if (inFlight.current) return;
        const selection = generic ? 'home-general' : keywordSuggestion || chosen;
        const hasDraft = [description, goal, extra, ...Object.values(values)].some(value => value.trim());
        const downloadedForThisOutcome = goalEdit === null && savedInput.downloadedTemplate
            && (!selection || selection === savedInput.downloadedTemplate);
        if (hasDraft && !downloadedForThisOutcome && !window.confirm(t.discardDraft)) return;
        resetInput();
        resetJourney();
        onStartNewWork?.();
        requestAnimationFrame(() => inputRef.current?.focus());
    }

    function changeDescription(value: string) {
        if (savedInput.templateId || [extra, ...Object.values(values)].some(answer => answer.trim())) {
            setGoalEdit(value === goal ? null : value);
        } else {
            setInput('goal', value);
        }
        setConfirmNewTask(false);
    }

    function resumeDraftOutcome(savedTemplateId?: string) {
        const isGeneral = savedTemplateId === 'home-general';
        const templateId = isGeneral ? '' : resolveHomeOutcomeId(savedTemplateId ?? '') ?? '';
        if (!isGeneral && !templateId) return false;
        resetJourney(templateId);
        setGeneric(isGeneral);
        setStage('fields');
        return true;
    }

    function reopenDraft(index: number) {
        const saved = savedInput.unfinishedDrafts[index];
        restoreDraft(saved, index);
        if (!resumeDraftOutcome(saved.templateId)) resetJourney();
    }

    return (
        <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6" data-testid="home-spec-composer">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t.title}</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t.lead}</p>
                </div>
                <button type="button" className={primary} onClick={startNewWork} disabled={busy}>
                    <Plus size={17} aria-hidden="true" />{t.startNew}
                </button>
            </header>
            <section className="cvf-surface space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-white/10 sm:p-5" aria-busy={busy}>
                {stage === 'describe' && <form onSubmit={submitGoal} className="space-y-3">
                    <label htmlFor="home-spec-goal" className="block font-semibold">{t.goal}</label>
                    <textarea ref={inputRef} id="home-spec-goal" className={input} rows={4} value={description} onChange={e => changeDescription(e.target.value)} maxLength={1000} placeholder={t.placeholder} disabled={busy} />
                    {chosen && <p className="text-sm">{t.selection} <strong>{homeSpecOutcomeTitle(chosen, language)}</strong></p>}
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t.direct}</p>
                    {confirmNewTask ? <div className="space-y-2" role="group" aria-labelledby="home-spec-new-task-question">
                        <h2 id="home-spec-new-task-question" className="font-semibold">{t.newTaskQuestion}</h2>
                        <p className="text-sm">{t.newTaskDetails}</p>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" ref={continueNewTaskRef} className={primary} onClick={() => continueGoal('new')}>{t.continueNewTask}</button>
                            <button type="button" className={secondary} onClick={() => continueGoal('resume')}>{t.continueSameTask}</button>
                            <button type="button" className={secondary} onClick={() => {
                                setGoalEdit(null);
                                setConfirmNewTask(false);
                                inputRef.current?.focus();
                            }}>{t.keepCurrentTask}</button>
                        </div>
                    </div> : <div className="flex flex-wrap gap-2">
                        {quickDescription && <button type="button" className={primary} onClick={() => openAssistant(description)}>{t.quick}</button>}
                        <button className={quickDescription ? secondary : primary} disabled={busy}>{busy ? t.wait : t.go}<ArrowRight size={16} aria-hidden="true" /></button>
                        {!quickDescription && <button type="button" className={secondary} onClick={() => openAssistant(description)}>{t.quick}</button>}
                    </div>}
                </form>}
                {stage === 'describe' && savedInput.unfinishedDrafts.length > 0 && <details>
                    <summary className="cursor-pointer font-medium">{t.unfinishedDrafts}</summary>
                    <ul className="mt-2 space-y-2">{savedInput.unfinishedDrafts.map((saved, index) => <li key={index}>
                        <button type="button" className={secondary + ' max-w-full break-words text-left'} onClick={() => reopenDraft(index)} disabled={busy}>{saved.goal}</button>
                    </li>)}</ul>
                </details>}
                {stage === 'clarify' && <form onSubmit={submitGoal} className="space-y-3">
                    <label htmlFor="home-spec-clarify" className="block font-semibold">{t.clarify}</label>
                    <textarea id="home-spec-clarify" className={input} rows={3} value={extra} onChange={e => setInput('extra', e.target.value)} maxLength={1000} disabled={busy} />
                    <button className={primary} disabled={busy}>{busy ? t.wait : t.go}</button>
                </form>}
                {stage === 'review' && <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300">{jevChoice ? t.automatic : keywordSuggestion ? t.keywords : t.selection}</p>
                    <h2 className="text-lg font-semibold">{homeSpecOutcomeTitle(outcomeId, language)}</h2>
                    <div className="flex flex-wrap gap-2">
                        {quickSuggestion && <button type="button" className={primary} onClick={() => openAssistant(originalUserText)} disabled={busy}>{t.quick}</button>}
                        <button type="button" className={quickSuggestion ? secondary : primary} onClick={confirmOutcome} disabled={busy}>{busy ? t.wait : quickSuggestion ? t.quickSpec : t.confirm}</button>
                        <button type="button" className={secondary} onClick={rejectOutcome} disabled={busy}>{t.noMatch}</button>
                    </div>
                    {abbreviatedTitle && <TechnicalDetails label={t.technical}><p>{abbreviatedTitle}</p></TechnicalDetails>}
                </div>}
                {stage === 'unmatched' && <div className="space-y-3" aria-live="polite">
                    <h2 className="text-lg font-semibold">{t.unmatched}</h2>
                    <button type="button" className={primary} onClick={startGeneric} disabled={busy}>{t.makeGeneric}</button>
                    <button type="button" className={secondary} onClick={() => openAssistant(t.outsideDraft + '\n\n' + originalUserText)} disabled={busy}>{t.outsideHelp}</button>
                </div>}
                {stage === 'quick' && <div className="flex flex-wrap gap-2" aria-live="polite">
                    <button type="button" className={primary} onClick={() => openAssistant(originalUserText)}>{t.quick}</button>
                    <button type="button" className={secondary} onClick={startGeneric}>{t.quickSpec}</button>
                </div>}
                {stage === 'outside' && <div className="space-y-3" aria-live="polite">
                    <h2 className="text-lg font-semibold">{t.outside}</h2>
                    {homeSpecExternalRequest(goal, extra) === 'hazard' && <p className="font-medium">{t.outsideSafety}</p>}
                    <p>{t.outsideNext}</p>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className={primary} onClick={() => openAssistant(t.outsideDraft + '\n\n' + originalUserText)}>{t.outsideHelp}</button>
                        <button type="button" className={secondary} onClick={() => {
                            showStage('describe');
                            requestAnimationFrame(() => inputRef.current?.focus());
                        }}>{t.outsideEdit}</button>
                    </div>
                </div>}
                {(stage === 'candidates' || stage === 'clarify' && candidates.length > 0) && <div className="space-y-3" aria-live="polite">
                    <h2 className="text-lg font-semibold">{t.possible}</h2>
                    {quickCandidates && <button type="button" className={primary} onClick={() => openAssistant(originalUserText)} disabled={busy}>{t.quick}</button>}
                    <div className="flex flex-wrap gap-2">{candidates.map(id => <button type="button" className={secondary} key={id} onClick={() => chooseTemplate(id)} disabled={busy}>{homeSpecOutcomeTitle(id, language)}</button>)}</div>
                    <button type="button" className={secondary} onClick={startGeneric} disabled={busy}>{t.genericInstead}</button>
                </div>}
                {stage === 'fields' && <div className="space-y-3">
                    <h2 className="font-semibold">{generic ? t.genericTitle : fields.length ? t.missing : t.allSet}</h2>
                    {fields.map(renderField)}
                    {generic && missingFieldIds && templateFields.some(field => !missingFieldIds.has(field.id)) && (
                        <TechnicalDetails label={language === 'vi' ? 'Chỉnh thông tin đã điền' : 'Edit filled-in details'}>
                            {templateFields.filter(field => !missingFieldIds.has(field.id)).map(renderField)}
                        </TechnicalDetails>
                    )}
                    {visibleCommonQuestions.length > 0 && <fieldset className="space-y-3">
                        <legend className="font-semibold">{t.optionalQuestions}</legend>
                        {visibleCommonQuestions.map(renderField)}
                    </fieldset>}
                    <button type="button" className={primary} onClick={() => showStage('draft')}>{t.review}</button>
                </div>}
                {stage === 'draft' && <div className="space-y-3">
                    <h2 className="font-semibold">{t.draft}</h2>
                    <article aria-label={t.specification} className="min-w-0 space-y-4 break-words text-sm leading-relaxed">
                        <section className="space-y-3">
                            <h3 className="font-semibold">{t.provided}</h3>
                            {previewSections.map(section => <div key={section.id}>
                                <h4 className="font-semibold">{section.label}</h4>
                                <p className="mt-1 whitespace-pre-wrap">{section.value}</p>
                            </div>)}
                        </section>
                        <section>
                            <h3 className="font-semibold">{t.userWillSupply}</h3>
                            <p className="whitespace-pre-wrap">{referencesAnswer || t.noMaterials}</p>
                        </section>
                        <section>
                            <h3 className="font-semibold">{t.openQuestions}</h3>
                            <p>{openQuestions.length ? t.checkOpen : t.nothingOpen}</p>
                            {openQuestions.length > 0 && <ul className="list-disc space-y-1 pl-5">
                                {openQuestions.map(question => <li key={question}>{question}</li>)}
                            </ul>}
                        </section>
                    </article>
                    {canClarify && clarification.result && <HomeSpecClarificationPanel language={language} result={clarification.result} />}
                    <div className="space-y-1"><h3 className="font-semibold">{t.howTo}</h3><p className="text-sm">{t.howToText}</p></div>
                    {runId && runId === jevSkillRunId && (
                        <HomeAssfSuggestion key={suggestionKey} runId={runId} goal={jevGoal} language={language}
                            onSuggestion={skillId => setSuggestion({ key: suggestionKey, skillId })} />
                    )}
                    <TechnicalDetails label={t.technical} testId="home-spec-agent-details">
                        <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap font-mono text-xs">{agentMarkdown}</pre>
                    </TechnicalDetails>
                    <p id="home-spec-download-purpose" className="text-sm text-slate-600 dark:text-slate-300">{t.downloadPurpose}</p>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className={secondary} onClick={() => void copySpec()}>{t.copy}</button>
                        <button type="button" className={primary} aria-describedby="home-spec-download-purpose" onClick={download}><Download size={17} aria-hidden="true" />{t.download}</button>
                        {canClarify && <button type="button" className={secondary} onClick={() => void clarification.clarify()}
                            aria-describedby={clarification.message ? 'home-clarification-status' : undefined} disabled={clarification.disabled}>{clarification.label}</button>}
                        <button type="button" className={secondary} onClick={() => showStage('fields')} disabled={busy}>{t.edit}</button>
                    </div>
                    {canClarify && clarification.message && <p id="home-clarification-status" role="status" className="text-sm text-slate-600 dark:text-slate-300">
                        {clarification.message}{clarification.missingKey && <> <Link
                            href={homeAccount?.canUseSavedProviderKey === false ? '/help/setup' : '?open=settings'}
                            scroll={false} className="underline text-indigo-700 dark:text-indigo-300">
                            {homeAccount?.canUseSavedProviderKey === false
                                ? (language === 'vi' ? 'Xem hướng dẫn cài đặt' : 'View setup instructions')
                                : (language === 'vi' ? 'Cài đặt' : 'Settings')}
                        </Link></>}
                    </p>}
                    {canClarify && !clarification.missingKey && <p className="text-sm text-slate-600 dark:text-slate-300">{clarification.billing}</p>}
                    {downloadReady && <button type="button" className={secondary} onClick={startNewWork} disabled={busy}>
                        <Plus size={17} aria-hidden="true" />{t.startNew}
                    </button>}
                </div>}
                {notice && <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{notice}</p>}
                {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
            </section>
            {stage === 'describe' && <section aria-label={t.templates} className="flex flex-wrap gap-2">
                {OUTCOME_WORKFLOW_REGISTRY.map(outcome => <button type="button" className={secondary} key={outcome.templateId} aria-pressed={chosen === outcome.templateId} onClick={() => chooseTemplate(outcome.templateId)} disabled={busy}>{homeSpecOutcomeTitle(outcome.templateId, language)}</button>)}
            </section>}
            {(stage === 'describe' || stage === 'clarify' || stage === 'review' || stage === 'candidates' || stage === 'unmatched') && (
                <button type="button" className={secondary} aria-expanded={libraryOpen} aria-controls="home-spec-library" onClick={toggleLibrary} disabled={busy}><FolderOpen size={17} aria-hidden="true" />{libraryOpen ? t.close : t.browse}</button>
            )}
            {libraryOpen && <div id="home-spec-library" className="min-w-0">
                {stage === 'describe' ? library : <label className="block space-y-2">
                    <span className="font-medium">{t.pick}</span>
                    <select className={input} value={chosen} disabled={busy} onChange={e => { if (e.target.value) chooseTemplate(e.target.value); }}>
                        <option value="">{t.choose}</option>
                        {homeSpecTemplates.map(template => <option key={template.id} value={template.id}>{homeSpecOutcomeTitle(template.id, language)}</option>)}
                    </select>
                </label>}
            </div>}
        </div>
    );
}
