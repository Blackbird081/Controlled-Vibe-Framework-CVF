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
import { trackEvent } from '@/lib/analytics';
import {
    clearGovernedStarterHandoff,
    readGovernedStarterHandoff,
    saveGovernedStarterHandoff,
    type GovernedStarterHandoff,
} from '@/lib/governed-starter-path';
import { isIntentFirstEnabled, type IntentRouteResult } from '@/lib/intent-router';
import { buildContinuationExecution, buildEvidenceSnapshot } from '@/lib/execution-continuity';
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
    const [currentInput, setCurrentInput] = useState<Record<string, string>>({});
    const [currentIntent, setCurrentIntent] = useState('');
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [starterHandoff, setStarterHandoff] = useState<GovernedStarterHandoff | null>(null);
    const [iterationContext, setIterationContext] = useState<string | null>(null);
    const [bannerDismissed, setBannerDismissed] = useState(
        () => typeof window !== 'undefined' && localStorage.getItem('cvf_setup_banner_dismissed') === '1',
    );

    const { addExecution, updateExecution, currentExecution, getExecutionById } = useExecutionStore();

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

        setSelectedTemplate(demoTemplate);
        setCurrentInput(demoValues);
        setCurrentIntent(`[DEMO] Auto-generated intent for ${demoTemplate.name}`);

        const execution: Execution = {
            id: `exec_demo_${Date.now()}`,
            templateId: demoTemplate.id,
            templateName: demoTemplate.name,
            category: demoTemplate.category,
            input: demoValues,
            intent: `[DEMO] Auto-generated intent for ${demoTemplate.name}`,
            status: 'processing',
            createdAt: new Date(),
        };
        addExecution(execution);
        setWorkflowState('processing');
    }, [addExecution]);

    const handleTryTemplate = useCallback((template: Template, prefilled: Record<string, string>) => {
        trackEvent('template_try_quick_path', { templateId: template.id });
        setSelectedTemplate(template);
        setCurrentInput(prefilled);
        setCurrentIntent(generateIntent(template, prefilled));
        setWorkflowState('form');
    }, []);

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
        setSelectedTemplate(template);
        setWorkflowState('form');
    }, []);

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
    }, [searchParams]);

    // W123-T1: restore result state when navigating from history with ?continue=exec_id
    useEffect(() => {
        const continueId = searchParams.get('continue')?.trim();
        if (!continueId) return;
        const exec = getExecutionById(continueId);
        if (!exec || exec.result !== 'accepted' || !exec.output) return;
        const output = exec.output;
        const tpl = templates.find((t) => t.id === exec.templateId);
        if (!tpl) return;
        startTransition(() => {
            setSelectedTemplate(tpl);
            setCurrentInput(exec.input);
            setCurrentIntent(exec.intent);
            setCurrentOutput(output);
            setCurrentEvidenceReceipt(undefined);
            setWorkflowState('result');
        });
    }, [searchParams, getExecutionById]);

    const handleFormSubmit = useCallback((values: Record<string, string>, intent: string) => {
        setCurrentInput(values);
        setCurrentIntent(intent);
        const execution: Execution = {
            id: `exec_${Date.now()}`,
            templateId: selectedTemplate!.id,
            templateName: selectedTemplate!.name,
            category: selectedTemplate!.category,
            input: values,
            intent,
            status: 'processing',
            createdAt: new Date(),
        };
        addExecution(execution);
        setWorkflowState('processing');
    }, [selectedTemplate, addExecution]);

    const handleProcessingComplete = useCallback((output: string, evidenceReceipt?: GovernanceEvidenceReceipt) => {
        setCurrentOutput(output);
        setCurrentEvidenceReceipt(evidenceReceipt);
        if (currentExecution) {
            // W123-T1: snapshot evidence receipt + knowledge collection into execution for continuity chain
            const snap = buildEvidenceSnapshot(evidenceReceipt as Record<string, unknown> | undefined);
            updateExecution(currentExecution.id, {
                status: 'completed',
                output,
                qualityScore: 8.2,
                completedAt: new Date(),
                ...(snap ? { evidenceReceiptSnapshot: snap } : {}),
                ...(snap?.knowledgeCollectionId ? { knowledgeCollectionId: snap.knowledgeCollectionId } : {}),
            });
        }
        setWorkflowState('result');
    }, [currentExecution, updateExecution]);

    const handleBack = useCallback(() => {
        setSelectedTemplate(null);
        setCurrentOutput('');
        setCurrentEvidenceReceipt(undefined);
        setIterationContext(null);
        setWorkflowState('browse');
    }, []);

    const handleFollowUp = useCallback((refinement: string) => {
        if (!selectedTemplate || !currentOutput) return;
        const truncated = currentOutput.length > 600
            ? currentOutput.slice(0, 600) + '…'
            : currentOutput;
        setIterationContext(truncated);
        setCurrentIntent(refinement);
        // W123-T1: build durable continuation chain when a parent execution exists
        const execution: Execution = currentExecution
            ? buildContinuationExecution({
                templateId: selectedTemplate.id,
                templateName: selectedTemplate.name,
                category: selectedTemplate.category,
                input: { ...currentInput, _previousOutput: truncated },
                intent: refinement,
                parentExecution: currentExecution,
            })
            : {
                id: `exec_followup_${Date.now()}`,
                templateId: selectedTemplate.id,
                templateName: selectedTemplate.name,
                category: selectedTemplate.category,
                input: { ...currentInput, _previousOutput: truncated },
                intent: refinement,
                status: 'processing',
                createdAt: new Date(),
            };
        addExecution(execution);
        setWorkflowState('processing');
    }, [selectedTemplate, currentOutput, currentInput, currentExecution, addExecution]);

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
        if (currentExecution) {
            updateExecution(currentExecution.id, { result: 'accepted' });
        }
        handleBack();
    }, [currentExecution, updateExecution, handleBack]);

    const handleReject = useCallback(() => {
        if (currentExecution) {
            updateExecution(currentExecution.id, { result: 'rejected' });
        }
        setWorkflowState('form');
    }, [currentExecution, updateExecution]);

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
                <DynamicForm
                    template={selectedTemplate}
                    onSubmit={handleFormSubmit}
                    onBack={handleBack}
                    onSendToAgent={handleSendToAgent}
                />
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
                    onComplete={handleProcessingComplete}
                    onCancel={handleBack}
                />
            )}

            {workflowState === 'result' && currentExecution && (
                <ResultViewer
                    execution={currentExecution}
                    output={currentOutput}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onRetry={() => setWorkflowState('form')}
                    onBack={handleBack}
                    onSendToAgent={handleSendToAgent}
                    onFollowUp={handleFollowUp}
                    evidenceReceipt={currentEvidenceReceipt}
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
