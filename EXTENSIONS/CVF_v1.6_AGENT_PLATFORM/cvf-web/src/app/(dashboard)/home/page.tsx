'use client';

import { useState, useMemo, useCallback, useEffect, useRef, startTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layers3, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { templates, generateIntent } from '@/lib/templates';
import { useExecutionStore } from '@/lib/store';
import { useProviders } from '@/lib/hooks/useExecute';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import { useSettings } from '@/components/Settings';
import { Template, Execution } from '@/types';
import { useLanguage } from '@/lib/i18n';
import { pilotCopy } from '@/components/html-pilot-copy';
import { trackEvent } from '@/lib/analytics';
import {
    clearGovernedStarterHandoff,
    readGovernedStarterHandoff,
    saveGovernedStarterHandoff,
    type GovernedStarterHandoff,
} from '@/lib/governed-starter-path';
import { isIntentFirstEnabled, type IntentRouteResult } from '@/lib/intent-router';
import { buildContinuationExecution, buildEvidenceSnapshot } from '@/lib/execution-continuity';
import { createReceiptArchive, restoreReceiptArchive } from '@/lib/execution-receipt-archive';
import { OUTCOME_WORKFLOW_REGISTRY } from '@/lib/workflow-composition';
import {
    DynamicForm,
    ProcessingScreen,
    ResultViewer,
    AppBuilderWizard,
    ProductDesignWizard,
    MarketingCampaignWizard,
    BusinessStrategyWizard,
    SecurityAssessmentWizard,
    ResearchProjectWizard,
    SystemDesignWizard,
    ContentStrategyWizard,
    DataAnalysisWizard,
    TemplatePreviewModal,
    OnboardingTour,
} from '@/components';
import { HomeBrowseExperience } from '@/components/home/HomeBrowseExperience';

type WorkflowState = 'browse' | 'form' | 'processing' | 'result' |
    'wizard' | 'product-wizard' | 'marketing-wizard' | 'business-wizard' |
    'security-wizard' | 'research-wizard' | 'system-wizard' | 'content-wizard' | 'data-wizard';

const QUICK_TRY_CONFIGS: Record<string, Record<string, string>> = {
    documentation: {
        subject: 'Quy trình onboarding khách hàng mới và gửi báo giá',
        currentNotes: 'Khách vào form đăng ký → sales gọi lại trong 2h → nếu đủ điều kiện thì gửi báo giá trong ngày. Hay bị hỏi: bao lâu triển khai, cần chuẩn bị gì.',
        readerGoal: 'Nhân viên mới có thể xử lý lead đầu vào mà không phải hỏi lại team lead.',
        audience: 'Người mới tiếp nhận',
    },
    strategy_analysis: {
        topic: 'Mở rộng thị trường miền Trung cho dòng sản phẩm SaaS B2B',
        context: 'Công ty SaaS B2B, 200 nhân viên, doanh thu $5M/năm. Thị trường đang tăng trưởng 15%/năm. Hiện chỉ có văn phòng tại TP.HCM và Hà Nội.',
        options: '1. Mở chi nhánh trực tiếp tại Đà Nẵng\n2. Hợp tác với đối tác địa phương\n3. Chỉ bán online và hỗ trợ từ xa',
        priority: 'Growth',
    },
    seo_audit: {
        url: 'https://shopx.vn',
        industry: 'SaaS B2B — quản lý dự án',
        keywords: 'quản lý dự án online\nproject management tool',
        competitors: 'asana.com, monday.com',
    },
};

const WIZARD_MAP: Record<string, WorkflowState> = {
    app_builder_wizard: 'wizard',
    product_design_wizard: 'product-wizard',
    marketing_campaign_wizard: 'marketing-wizard',
    business_strategy_wizard: 'business-wizard',
    security_assessment_wizard: 'security-wizard',
    research_project_wizard: 'research-wizard',
    system_design_wizard: 'system-wizard',
    content_strategy_wizard: 'content-wizard',
    data_analysis_wizard: 'data-wizard',
};

export default function HomePage() {
    const { t, language } = useLanguage();
    const searchParams = useSearchParams();
    const handledLaunchParam = useRef('');
    const mockAiEnabled = process.env.NEXT_PUBLIC_CVF_MOCK_AI === '1';
    const { settings } = useSettings();
    const hasAnyApiKey = Object.values(settings.providers).some(p => p.apiKey && p.apiKey.trim().length > 0);
    const { providers, anyConfigured: serverAnyProviderConfigured, fetchProviders } = useProviders();

    const [workflowState, setWorkflowState] = useState<WorkflowState>('browse');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentOutput, setCurrentOutput] = useState('');
    const [currentEvidenceReceipt, setCurrentEvidenceReceipt] = useState<GovernanceEvidenceReceipt | undefined>(undefined);
    const [savedLocalHistory, setSavedLocalHistory] = useState(false);
    const receiptEpoch = useRef(0);
    const [currentInput, setCurrentInput] = useState<Record<string, string>>({});
    const [currentIntent, setCurrentIntent] = useState('');
    const [pilotGoal, setPilotGoal] = useState('');
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [starterHandoff, setStarterHandoff] = useState<GovernedStarterHandoff | null>(null);
    const [iterationContext, setIterationContext] = useState<string | null>(null);
    // Binding for the result view, local decisions and completion; never the ambient store selection.
    const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
    // Editable draft returned to the form after a local stop, retry or reject; never persisted.
    const [draftInput, setDraftInput] = useState<Record<string, string> | null>(null);
    const [stopNotice, setStopNotice] = useState(false);
    const [formRevision, setFormRevision] = useState(0);
    const attemptSequence = useRef(0);
    const [bannerDismissed, setBannerDismissed] = useState(
        () => typeof window !== 'undefined' && localStorage.getItem('cvf_setup_banner_dismissed') === '1',
    );

    const { addExecution, updateExecution, getExecutionById } = useExecutionStore();
    const activeExecution = activeExecutionId ? getExecutionById(activeExecutionId) ?? null : null;

    // Distinct id per attempt: the clock alone repeats within a millisecond, so a per-page
    // sequence is added and any id already present in the store is skipped.
    const newAttemptId = useCallback((prefix: string) => {
        let id: string;
        do {
            id = `${prefix}_${Date.now()}_${(attemptSequence.current++).toString(36)}`;
        } while (getExecutionById(id));
        return id;
    }, [getExecutionById]);

    // A fresh template choice must not inherit a previous attempt's draft, notice or context.
    const clearRecoveryContext = useCallback(() => {
        receiptEpoch.current++;
        setSavedLocalHistory(false);
        setFormRevision(revision => revision + 1);
        setDraftInput(null);
        setStopNotice(false);
        setIterationContext(null);
    }, []);

    useEffect(() => () => { receiptEpoch.current++; }, []);

    const allRunnableTemplates = useMemo(
        () => templates.filter(template => !template.isFolder),
        [],
    );

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: allRunnableTemplates.length };
        allRunnableTemplates.forEach((template) => {
            counts[template.category] = (counts[template.category] ?? 0) + 1;
        });
        return counts;
    }, [allRunnableTemplates]);

    const statCards = useMemo(() => ([
        {
            label: language === 'vi' ? 'Kết quả' : 'Outcomes',
            value: String(OUTCOME_WORKFLOW_REGISTRY.length),
            icon: Layers3,
            tone: 'accent' as const,
        },
        {
            label: language === 'vi' ? 'Luồng có hướng dẫn' : 'Guided Flows',
            value: String(Object.keys(WIZARD_MAP).length),
            icon: ShieldCheck,
            tone: 'emerald' as const,
        },
        {
            label: language === 'vi' ? 'Model live' : 'Live Models',
            value: '3',
            icon: Sparkles,
            tone: 'amber' as const,
        },
        {
            label: language === 'vi' ? 'Starter flows' : 'Starter Flows',
            value: starterHandoff ? '1' : '0',
            icon: Wand2,
            tone: 'violet' as const,
        },
    ]), [language, starterHandoff]);

    const liveReadyProviders = useMemo(
        () => providers.filter(provider => provider.configured),
        [providers],
    );

    const setupConfidence = useMemo(() => {
        if (mockAiEnabled) {
            return {
                liveTaskReady: false,
                workspaceReady: true,
                label: language === 'vi' ? 'Demo mode' : 'Demo mode',
                description: language === 'vi'
                    ? 'Mock AI đang bật; có thể xem luồng UI nhưng chưa phải bằng chứng governance live.'
                    : 'Mock AI is enabled; you can inspect UI flow but this is not live governance proof.',
                nextAction: language === 'vi' ? 'Tắt mock để chạy live' : 'Disable mock to run live',
                tone: 'amber',
            };
        }

        if (serverAnyProviderConfigured || hasAnyApiKey) {
            const primary = liveReadyProviders[0];
            const source = primary?.keySourceName || (hasAnyApiKey ? 'browser settings' : 'server env');
            return {
                liveTaskReady: true,
                workspaceReady: true,
                label: language === 'vi' ? 'Live task ready' : 'Live task ready',
                description: language === 'vi'
                    ? `Provider đã sẵn sàng qua ${source}. CVF chỉ hiển thị tên nguồn, không hiển thị key.`
                    : `Provider is ready via ${source}. CVF shows source name only, never the key value.`,
                nextAction: language === 'vi' ? 'Chọn template và chạy task' : 'Pick a template and run a task',
                tone: 'emerald',
            };
        }

        return {
            liveTaskReady: false,
            workspaceReady: true,
            label: language === 'vi' ? 'Cần provider key' : 'Provider key needed',
            description: language === 'vi'
                ? 'Workspace enforcement artifacts có thể sẵn sàng, nhưng live task cần key trong env hoặc settings.'
                : 'Workspace enforcement artifacts can be ready, but live tasks need a key in env or settings.',
            nextAction: language === 'vi' ? 'Mở Provider Keys' : 'Open Provider Keys',
            tone: 'amber',
        };
    }, [hasAnyApiKey, language, liveReadyProviders, mockAiEnabled, serverAnyProviderConfigured]);

    const filteredTemplates = useMemo(() => {
        let result = selectedCategory === 'all'
            ? templates
            : templates.filter(t => t.category === selectedCategory);

        if (currentFolder) {
            result = result.filter(t => t.parentFolder === currentFolder);
        } else {
            result = result.filter(t => !t.parentFolder);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q)
            );
        }

        return result;
    }, [selectedCategory, currentFolder, searchQuery]);

    const handleDemoRun = useCallback(() => {
        const demoTemplate = templates.find(t => !t.isFolder && !WIZARD_MAP[t.id] && t.fields.length > 0);
        if (!demoTemplate) return;

        trackEvent('demo_auto_run', { templateId: demoTemplate.id });

        const demoValues: Record<string, string> = {};
        demoTemplate.fields.forEach(field => {
            if (field.example) {
                demoValues[field.id] = field.example;
            } else if (field.default) {
                demoValues[field.id] = field.default;
            } else if (field.placeholder) {
                demoValues[field.id] = field.placeholder.replace(/^VD:\s*/i, '').replace(/^E\.g\.\s*/i, '');
            } else {
                demoValues[field.id] = `Demo ${field.label}`;
            }
        });

        clearRecoveryContext();
        setCurrentOutput('');
        setCurrentEvidenceReceipt(undefined);
        setSelectedTemplate(demoTemplate);
        setCurrentInput(demoValues);
        setCurrentIntent(`[DEMO] Auto-generated intent for ${demoTemplate.name}`);

        const execution: Execution = {
            id: newAttemptId('exec_demo'),
            templateId: demoTemplate.id,
            templateName: demoTemplate.name,
            category: demoTemplate.category,
            input: demoValues,
            intent: `[DEMO] Auto-generated intent for ${demoTemplate.name}`,
            status: 'processing',
            createdAt: new Date(),
        };
        addExecution(execution);
        setActiveExecutionId(execution.id);
        setWorkflowState('processing');
    }, [addExecution, clearRecoveryContext, newAttemptId]);

    const handleTryTemplate = useCallback((template: Template, prefilled: Record<string, string>) => {
        trackEvent('template_try_quick_path', { templateId: template.id });
        clearRecoveryContext();
        setSelectedTemplate(template);
        setCurrentInput(prefilled);
        setCurrentIntent(generateIntent(template, prefilled));
        setWorkflowState('form');
    }, [clearRecoveryContext]);

    const handleSelectTemplate = useCallback((template: Template) => {
        if (template.isFolder) {
            setCurrentFolder(template.id);
            return;
        }
        trackEvent('template_selected', {
            templateId: template.id,
            templateName: template.name,
            category: template.category,
        });
        const wizardState = WIZARD_MAP[template.id];
        if (wizardState) {
            setWorkflowState(wizardState);
            return;
        }
        clearRecoveryContext();
        setSelectedTemplate(template);
        setWorkflowState('form');
    }, [clearRecoveryContext]);

    const handleOutcomeQuickAction = useCallback((templateId: string) => {
        const template = templates.find((item) => item.id === templateId);
        if (!template) {
            return;
        }
        handleSelectTemplate(template);
    }, [handleSelectTemplate]);

    useEffect(() => {
        const templateId = searchParams.get('template')?.trim();
        const category = searchParams.get('category')?.trim();
        const launchKey = `${templateId || ''}|${category || ''}`;
        if ((!templateId && !category) || handledLaunchParam.current === launchKey) {
            return;
        }
        handledLaunchParam.current = launchKey;

        if (templateId) {
            const template = templates.find(item => item.id === templateId);
            if (!template) {
                return;
            }
            startTransition(() => {
                setCurrentFolder(null);
                clearRecoveryContext();
                setSelectedTemplate(template);
                trackEvent('template_selected', {
                    templateId: template.id,
                    templateName: template.name,
                    category: template.category,
                    source: 'skill_library',
                });

                if (template.isFolder) {
                    setCurrentFolder(template.id);
                    setWorkflowState('browse');
                    return;
                }

                const wizardState = WIZARD_MAP[template.id];
                setWorkflowState(wizardState ?? 'form');
            });
            return;
        }

        if (category) {
            startTransition(() => {
                setCurrentFolder(null);
                setSelectedCategory(category);
                setWorkflowState('browse');
            });
        }
    }, [searchParams, clearRecoveryContext]);

    // W123-T1: restore result state when navigating from history with ?continue=exec_id
    // (accepted runs only) or ?result=exec_id (any completed saved run, viewing only).
    // continue governs when both are present. The restored execution id is the binding;
    // the ambient currentExecution is not consulted and nothing is re-executed.
    useEffect(() => {
        const hasContinue = searchParams.has('continue');
        if (!hasContinue && !searchParams.has('result')) return;
        const restoreId = searchParams.get(hasContinue ? 'continue' : 'result')?.trim();
        const exec = restoreId ? getExecutionById(restoreId) : undefined;
        const tpl = exec ? templates.find((t) => t.id === exec.templateId) : undefined;
        startTransition(() => {
            clearRecoveryContext();
            const generation = receiptEpoch.current;
            if (!exec || exec.status !== 'completed' || !exec.output || !tpl
                || (hasContinue && exec.result !== 'accepted')) {
                // Invalid history query: drop any prior bound context and return to browse.
                setActiveExecutionId(null);
                setSelectedTemplate(null);
                setCurrentOutput('');
                setCurrentEvidenceReceipt(undefined);
                setWorkflowState('browse');
                return;
            }
            setActiveExecutionId(exec.id);
            setSelectedTemplate(tpl);
            setCurrentInput(exec.input);
            setCurrentIntent(exec.intent);
            setCurrentOutput(exec.output);
            setCurrentEvidenceReceipt(undefined);
            setWorkflowState('result');
            if (exec.savedReceiptArchive) {
                void restoreReceiptArchive(exec.savedReceiptArchive, exec.id, exec.output, exec.evidenceReceiptSnapshot)
                    .then(receipt => {
                        if (!receipt || receiptEpoch.current !== generation) return;
                        const selected = useExecutionStore.getState().getExecutionById(exec.id);
                        if (!selected || selected.status !== 'completed' || selected.output !== exec.output ||
                            selected.savedReceiptArchive !== exec.savedReceiptArchive ||
                            selected.evidenceReceiptSnapshot?.receiptId !== receipt.receiptId ||
                            selected.evidenceReceiptSnapshot?.provider !== receipt.provider ||
                            selected.evidenceReceiptSnapshot?.model !== receipt.model) return;
                        setCurrentEvidenceReceipt(receipt);
                        setSavedLocalHistory(true);
                    }).catch(() => { /* Saved output remains viewable without an archive. */ });
            }
        });
        const currentReceiptEpoch = receiptEpoch;
        return () => { currentReceiptEpoch.current++; };
    }, [searchParams, getExecutionById, clearRecoveryContext]);

    // An explicit submit starts a new attempt: no inherited result, receipt or continuation context.
    const handleFormSubmit = useCallback((values: Record<string, string>, intent: string) => {
        const pilot = selectedTemplate!.id === 'web_build_handoff' && searchParams.get('htmlPilot') === '1';
        const selectedIntent = pilot ? (values.websiteGoal?.trim() ?? '') : intent;
        clearRecoveryContext();
        setCurrentOutput('');
        setCurrentEvidenceReceipt(undefined);
        setCurrentInput(values);
        setCurrentIntent(selectedIntent);
        const execution: Execution = {
            id: newAttemptId('exec'),
            templateId: selectedTemplate!.id,
            templateName: selectedTemplate!.name,
            category: selectedTemplate!.category,
            input: values,
            intent: selectedIntent,
            status: 'processing',
            createdAt: new Date(),
            ...(pilot
                ? { htmlPilot: { operationKey: crypto.randomUUID() } } : {}),
        };
        addExecution(execution);
        setActiveExecutionId(execution.id);
        setWorkflowState('processing');
    }, [selectedTemplate, addExecution, clearRecoveryContext, newAttemptId, searchParams]);

    const handleProcessingComplete = useCallback((output: string, evidenceReceipt?: GovernanceEvidenceReceipt) => {
        // A stopped attempt has no binding left, so a late delivery can never reach a record.
        if (!activeExecutionId) return;
        receiptEpoch.current++;
        setCurrentOutput(output);
        setCurrentEvidenceReceipt(evidenceReceipt);
        setSavedLocalHistory(false);
        if (activeExecutionId) {
            // W123-T1: snapshot evidence receipt + knowledge collection into execution for continuity chain
            const snap = buildEvidenceSnapshot(evidenceReceipt as Record<string, unknown> | undefined);
            updateExecution(activeExecutionId, {
                status: 'completed',
                output,
                qualityScore: 8.2,
                completedAt: new Date(),
                ...(snap ? { evidenceReceiptSnapshot: snap } : {}),
                ...(snap?.knowledgeCollectionId ? { knowledgeCollectionId: snap.knowledgeCollectionId } : {}),
                ...(evidenceReceipt?.htmlPilotEvidence ? { htmlPilot: {
                    operationKey: evidenceReceipt.htmlPilotEvidence.operationKey,
                    runId: evidenceReceipt.htmlPilotEvidence.runId,
                    rootRunId: evidenceReceipt.htmlPilotEvidence.rootRunId,
                    parentRunId: evidenceReceipt.htmlPilotEvidence.parentRunId,
                    outputSha256: evidenceReceipt.htmlPilotEvidence.outputSha256,
                    jobId: evidenceReceipt.htmlPilotEvidence.htmlJobId ?? activeExecution?.htmlPilot?.jobId,
                    profileDigest: evidenceReceipt.htmlPilotEvidence.profileDigest,
                } } : {}),
            });
            if (evidenceReceipt) {
                const completedId = activeExecutionId;
                const receiptId = evidenceReceipt.receiptId;
                void createReceiptArchive(completedId, output, evidenceReceipt).then(archive => {
                    if (!archive) return;
                    const selected = useExecutionStore.getState().getExecutionById(completedId);
                    if (!selected || selected.status !== 'completed' || selected.output !== output ||
                        selected.evidenceReceiptSnapshot?.receiptId !== receiptId ||
                        selected.evidenceReceiptSnapshot?.provider !== archive.receipt.provider ||
                        selected.evidenceReceiptSnapshot?.model !== archive.receipt.model) return;
                    useExecutionStore.getState().updateExecution(completedId, { savedReceiptArchive: archive });
                }).catch(() => { /* Missing WebCrypto leaves the ordinary result intact. */ });
            }
        }
        setWorkflowState('result');
    }, [activeExecutionId, activeExecution, updateExecution]);

    const handleBack = useCallback(() => {
        clearRecoveryContext();
        setSelectedTemplate(null);
        setActiveExecutionId(null);
        setCurrentOutput('');
        setCurrentEvidenceReceipt(undefined);
        setCurrentInput({});
        setCurrentIntent('');
        setWorkflowState('browse');
    }, [clearRecoveryContext]);

    // Return to the editable form with the exact submitted fields. Nothing is executed
    // here; only an explicit submit starts a new attempt.
    const returnToDraft = useCallback((stopped: boolean) => {
        receiptEpoch.current++;
        setSavedLocalHistory(false);
        setDraftInput({ ...currentInput });
        setStopNotice(stopped);
        setActiveExecutionId(null);
        setCurrentOutput('');
        setCurrentEvidenceReceipt(undefined);
        setIterationContext(null);
        setWorkflowState('form');
    }, [currentInput]);

    // Cancel is a local stop only: the bound pending/processing attempt is recorded as
    // unsuccessful (existing failed status), which does not prove the server stopped.
    const handleStopProcessing = useCallback(() => {
        const bound = activeExecutionId ? getExecutionById(activeExecutionId) : undefined;
        if (bound && (bound.status === 'processing' || bound.status === 'pending')) {
            updateExecution(bound.id, { status: 'failed' });
        }
        returnToDraft(true);
    }, [activeExecutionId, getExecutionById, updateExecution, returnToDraft]);

    const handleRetry = useCallback(() => returnToDraft(false), [returnToDraft]);

    const handleFollowUp = useCallback((refinement: string) => {
        if (!selectedTemplate || !currentOutput) return;
        if (activeExecution?.htmlPilot && !activeExecution.htmlPilot.jobId) return;
        receiptEpoch.current++;
        setSavedLocalHistory(false);
        const truncated = currentOutput.length > 600
            ? currentOutput.slice(0, 600) + '…'
            : currentOutput;
        setIterationContext(truncated);
        setCurrentIntent(refinement);
        // W123-T1: build durable continuation chain when a parent execution exists
        const execution: Execution = activeExecution
            ? buildContinuationExecution({
                templateId: selectedTemplate.id,
                templateName: selectedTemplate.name,
                category: selectedTemplate.category,
                input: { ...currentInput, _previousOutput: truncated },
                intent: refinement,
                parentExecution: activeExecution,
            })
            : {
                id: newAttemptId('exec_followup'),
                templateId: selectedTemplate.id,
                templateName: selectedTemplate.name,
                category: selectedTemplate.category,
                input: { ...currentInput, _previousOutput: truncated },
                intent: refinement,
                status: 'processing',
                createdAt: new Date(),
            };
        addExecution(execution);
        setActiveExecutionId(execution.id);
        setWorkflowState('processing');
    }, [selectedTemplate, currentOutput, currentInput, activeExecution, addExecution, newAttemptId]);

    const handleSendToAgent = useCallback((prompt: string) => {
        window.dispatchEvent(new CustomEvent('cvf:openAgent', {
            detail: {
                prompt,
            },
        }));
    }, []);

    useEffect(() => {
        const syncStarterHandoff = () => {
            setStarterHandoff(readGovernedStarterHandoff());
        };

        syncStarterHandoff();
        window.addEventListener('cvf:starterHandoffReady', syncStarterHandoff);
        return () => window.removeEventListener('cvf:starterHandoffReady', syncStarterHandoff);
    }, []);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    // W129-T1: rollout signal capture — fire once per session when rollout flag is active
    useEffect(() => {
        if (!isIntentFirstEnabled()) return;
        const sessionKey = 'cvf_w129_rollout_session_fired';
        if (typeof window === 'undefined') return;
        trackEvent('rollout_flag_enabled', { flag: 'NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR' });
        if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1');
            trackEvent('rollout_session_start', { flag: 'NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR' });
        }
    }, []);

    const handleDismissBanner = useCallback(() => {
        localStorage.setItem('cvf_setup_banner_dismissed', '1');
        setBannerDismissed(true);
    }, []);

    const handleAccept = useCallback(() => {
        if (activeExecutionId) {
            updateExecution(activeExecutionId, { result: 'accepted' });
        }
        handleBack();
    }, [activeExecutionId, updateExecution, handleBack]);

    const handleReject = useCallback(() => {
        if (activeExecutionId) {
            updateExecution(activeExecutionId, { result: 'rejected' });
        }
        returnToDraft(false);
    }, [activeExecutionId, updateExecution, returnToDraft]);

    const handleOpenGovernedStarter = useCallback(() => {
        if (!starterHandoff) {
            return;
        }

        clearGovernedStarterHandoff();
        setStarterHandoff(null);

        const wizardState = WIZARD_MAP[starterHandoff.recommendedTemplateId];
        if (wizardState) {
            setWorkflowState(wizardState);
            return;
        }

        const starterTemplate = templates.find(template => template.id === starterHandoff.recommendedTemplateId);
        if (starterTemplate) {
            setSelectedTemplate(starterTemplate);
            setCurrentIntent(starterHandoff.userInput);
            setWorkflowState('form');
        }
    }, [starterHandoff]);

    const handleDismissGovernedStarter = useCallback(() => {
        clearGovernedStarterHandoff();
        setStarterHandoff(null);
    }, []);

    const handleIntentRoute = useCallback((result: IntentRouteResult, userInput: string) => {
        // §8.A4 hard contract: refuse to route on weak confidence.
        // W126: form routes (routeType === 'form') have strong confidence with starterKey null.
        if (!result.recommendedTemplateId || (result.routeType === 'wizard' && !result.starterKey)) {
            return;
        }

        // Persist routed context into starter handoff so the wizard/form surface can
        // show userInput + rationale + phase/risk (Codex review M3 — preserve
        // routed context across the IntentEntry → wizard/form transition).
        const handoff: GovernedStarterHandoff = {
            recommendedTemplateId: result.recommendedTemplateId,
            recommendedTemplateLabel: result.recommendedTemplateLabel ?? '',
            userInput,
            provider: 'alibaba',
            phase: result.phase,
            riskLevel: result.riskLevel,
            friendlyPhase: result.friendlyPhase,
            friendlyRisk: result.friendlyRisk,
            suggestedTemplates: result.starterKey ? [result.starterKey] : [result.recommendedTemplateId],
        };
        saveGovernedStarterHandoff(handoff);
        setStarterHandoff(handoff);

        const wizardState = WIZARD_MAP[result.recommendedTemplateId];
        if (wizardState) {
            setWorkflowState(wizardState);
            return;
        }
        const starterTemplate = templates.find(t => t.id === result.recommendedTemplateId);
        if (starterTemplate) {
            setSelectedTemplate(starterTemplate);
            setCurrentIntent(userInput);
            setWorkflowState('form');
        }
    }, []);

    return (
        <div className="pb-10">
            {workflowState === 'browse' && (
                <HomeBrowseExperience
                    language={language as 'vi' | 'en'}
                    t={t}
                    currentFolder={currentFolder}
                    setCurrentFolder={setCurrentFolder}
                    templates={templates}
                    categoryCounts={categoryCounts}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    filteredTemplates={filteredTemplates}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleOutcomeQuickAction={handleOutcomeQuickAction}
                    handleSelectTemplate={handleSelectTemplate}
                    handleTryTemplate={handleTryTemplate}
                    QUICK_TRY_CONFIGS={QUICK_TRY_CONFIGS}
                    setPreviewTemplate={setPreviewTemplate}
                    statCards={statCards}
                    isIntentFirstEnabled={isIntentFirstEnabled}
                    handleIntentRoute={handleIntentRoute}
                    starterHandoff={starterHandoff}
                    handleOpenGovernedStarter={handleOpenGovernedStarter}
                    handleDismissGovernedStarter={handleDismissGovernedStarter}
                    mockAiEnabled={mockAiEnabled}
                    hasAnyApiKey={hasAnyApiKey}
                    bannerDismissed={bannerDismissed}
                    handleDismissBanner={handleDismissBanner}
                    handleDemoRun={handleDemoRun}
                    setupConfidence={setupConfidence}
                />
            )}

            {workflowState === 'form' && selectedTemplate && (
                <>
                    {stopNotice && (
                        <div
                            role="status"
                            data-testid="draft-stop-notice"
                            className="max-w-3xl mx-auto mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
                        >
                            {/* Text Encoding Exception: Vietnamese user-facing local-stop notice. */}
                            {selectedTemplate.id === 'web_build_handoff' && searchParams.get('htmlPilot') === '1'
                                ? pilotCopy(language).home.stoppedNotice
                                : (language === 'vi'
                                    ? 'Đã dừng trên thiết bị này. Nội dung bạn nhập được giữ lại; nhà cung cấp AI có thể chưa dừng yêu cầu này. Chỉnh sửa rồi gửi lại khi sẵn sàng.'
                                    : 'Stopped on this device. Your inputs are kept; the AI provider may not have stopped this request. Edit and resubmit when ready.')}
                        </div>
                    )}
                    {selectedTemplate.id === 'web_build_handoff' && searchParams.get('htmlPilot') === '1'
                      ? <form data-testid="html-pilot-goal-form" aria-labelledby="html-pilot-goal-heading" className="mx-auto max-w-2xl space-y-4 rounded-lg border p-5" onSubmit={event => {
                          event.preventDefault(); if (!stopNotice && pilotGoal.trim()) handleFormSubmit({ websiteGoal: pilotGoal.trim() }, pilotGoal.trim());
                        }}>
                          <h2 id="html-pilot-goal-heading" className="text-xl font-semibold">{pilotCopy(language).home.heading}</h2>
                          <p id="html-pilot-goal-intro">{pilotCopy(language).home.intro}</p>
                          <label className="block">{pilotCopy(language).home.goalLabel}<input name="websiteGoal" value={pilotGoal} onChange={event => setPilotGoal(event.target.value)}
                            required maxLength={2000} aria-describedby="html-pilot-goal-intro" className="mt-2 block min-h-11 w-full rounded border p-3 focus-visible:outline-2 focus-visible:outline-offset-2" /></label>
                          <button type="submit" disabled={stopNotice} aria-describedby={stopNotice ? 'html-pilot-goal-blocked' : undefined}
                            className="min-h-11 rounded bg-blue-700 px-5 py-3 text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">{pilotCopy(language).home.continueLabel}</button>
                          {stopNotice && <p id="html-pilot-goal-blocked" data-testid="html-pilot-goal-blocked">{pilotCopy(language).home.blockedHint}</p>}
                        </form>
                      : <DynamicForm
                        key={`${selectedTemplate.id}:${formRevision}`}
                        template={selectedTemplate}
                        initialValues={draftInput ?? undefined}
                        onSubmit={handleFormSubmit}
                        onBack={handleBack}
                        onSendToAgent={handleSendToAgent}
                    />}
                </>
            )}

            {workflowState === 'wizard' && <AppBuilderWizard onBack={handleBack} />}
            {workflowState === 'product-wizard' && <ProductDesignWizard onBack={handleBack} />}
            {workflowState === 'marketing-wizard' && <MarketingCampaignWizard onBack={handleBack} />}
            {workflowState === 'business-wizard' && <BusinessStrategyWizard onBack={handleBack} />}
            {workflowState === 'security-wizard' && <SecurityAssessmentWizard onBack={handleBack} />}
            {workflowState === 'research-wizard' && <ResearchProjectWizard onBack={handleBack} />}
            {workflowState === 'system-wizard' && <SystemDesignWizard onBack={handleBack} />}
            {workflowState === 'content-wizard' && <ContentStrategyWizard onBack={handleBack} />}
            {workflowState === 'data-wizard' && <DataAnalysisWizard onBack={handleBack} />}

            {workflowState === 'processing' && selectedTemplate && (
                <ProcessingScreen
                    templateName={selectedTemplate.name}
                    templateId={selectedTemplate.id}
                    inputs={iterationContext
                        ? { ...currentInput, _previousOutput: iterationContext }
                        : currentInput}
                    intent={currentIntent}
                    htmlPilotIntent={activeExecution?.htmlPilot ? {
                        operationKey: activeExecution.htmlPilot.operationKey,
                        ...(activeExecution.htmlPilot.parentRunId ? {
                            parentRunId: activeExecution.htmlPilot.parentRunId,
                            rootRunId: activeExecution.htmlPilot.rootRunId!,
                            parentOutputSha256: activeExecution.htmlPilot.outputSha256!,
                            htmlJobId: activeExecution.htmlPilot.jobId!,
                            ...(currentEvidenceReceipt ? { parentReceipt: currentEvidenceReceipt, parentOutput: currentOutput } : {}),
                        } : {}),
                    } : undefined}
                    onComplete={handleProcessingComplete}
                    onCancel={handleStopProcessing}
                />
            )}

            {workflowState === 'result' && activeExecution && (
                <ResultViewer
                    execution={activeExecution}
                    output={currentOutput}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onRetry={handleRetry}
                    onBack={handleBack}
                    onSendToAgent={handleSendToAgent}
                    onFollowUp={handleFollowUp}
                    evidenceReceipt={currentEvidenceReceipt}
                    savedLocalHistory={savedLocalHistory}
                />
            )}

            <TemplatePreviewModal
                isOpen={!!previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                templateName={previewTemplate?.name || ''}
                sampleOutput={previewTemplate?.sampleOutput}
            />

            {workflowState === 'browse' && <OnboardingTour />}
        </div>
    );
}
