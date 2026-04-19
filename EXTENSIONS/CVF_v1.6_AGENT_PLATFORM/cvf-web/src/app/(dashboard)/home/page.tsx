'use client';

import Link from 'next/link';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Layers3, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { templates } from '@/lib/templates';
import { useExecutionStore } from '@/lib/store';
import { useSettings } from '@/components/Settings';
import { Template, Execution } from '@/types';
import { useLanguage } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import {
    clearGovernedStarterHandoff,
    readGovernedStarterHandoff,
    type GovernedStarterHandoff,
} from '@/lib/governed-starter-path';
import {
    TemplateCard,
    CategoryTabs,
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
    SurfaceStatCard,
    SurfaceTopBar,
} from '@/components';

type WorkflowState = 'browse' | 'form' | 'processing' | 'result' |
    'wizard' | 'product-wizard' | 'marketing-wizard' | 'business-wizard' |
    'security-wizard' | 'research-wizard' | 'system-wizard' | 'content-wizard' | 'data-wizard';

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
    const mockAiEnabled = process.env.NEXT_PUBLIC_CVF_MOCK_AI === '1';
    const { settings } = useSettings();
    const hasAnyApiKey = Object.values(settings.providers).some(p => p.apiKey && p.apiKey.trim().length > 0);

    const [workflowState, setWorkflowState] = useState<WorkflowState>('browse');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentOutput, setCurrentOutput] = useState('');
    const [currentInput, setCurrentInput] = useState<Record<string, string>>({});
    const [currentIntent, setCurrentIntent] = useState('');
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [starterHandoff, setStarterHandoff] = useState<GovernedStarterHandoff | null>(null);
    const [iterationContext, setIterationContext] = useState<string | null>(null);

    const { addExecution, updateExecution, currentExecution } = useExecutionStore();

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
            label: language === 'vi' ? 'Templates' : 'Templates',
            value: String(allRunnableTemplates.length),
            icon: Layers3,
            tone: 'accent' as const,
        },
        {
            label: language === 'vi' ? 'Luồng govern' : 'Governed Paths',
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
    ]), [allRunnableTemplates.length, language, starterHandoff]);

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

    const handleProcessingComplete = useCallback((output: string) => {
        setCurrentOutput(output);
        if (currentExecution) {
            updateExecution(currentExecution.id, {
                status: 'completed',
                output,
                qualityScore: 8.2,
                completedAt: new Date(),
            });
        }
        setWorkflowState('result');
    }, [currentExecution, updateExecution]);

    const handleBack = useCallback(() => {
        setSelectedTemplate(null);
        setCurrentOutput('');
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
        const execution: Execution = {
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
    }, [selectedTemplate, currentOutput, currentInput, addExecution]);

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

    return (
        <div className="pb-10">
            {workflowState === 'browse' && (
                <>
                    <SurfaceTopBar
                        title={language === 'vi' ? 'Templates' : 'Templates'}
                        subtitle={language === 'vi'
                            ? 'Chọn template, điền form, nhận kết quả mà không cần viết prompt.'
                            : 'Pick a template, fill the form, and get results without writing prompts.'}
                        actions={(
                            <>
                                <Link
                                    href="/landing"
                                    className="cvf-control inline-flex items-center rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                                >
                                    {language === 'vi' ? 'Xem landing page' : 'View landing'}
                                </Link>
                                <Link
                                    href="/docs"
                                    className="cvf-control inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/75 dark:hover:bg-white/[0.07]"
                                >
                                    {language === 'vi' ? 'Mở Docs' : 'Open Docs'}
                                </Link>
                            </>
                        )}
                    />

                    <div className="space-y-8 px-4 py-6 sm:px-6">
                        <section
                            id="tour-welcome"
                            className="cvf-surface cvf-density-section overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_45%),linear-gradient(135deg,_#f8fafc,_#ffffff)] p-7 shadow-[0_20px_60px_-45px_rgba(79,70,229,0.35)] dark:border-white/[0.07] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.22),_transparent_40%),linear-gradient(135deg,_#141927,_#0f1320)] dark:shadow-none sm:p-8"
                        >
                            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-center">
                                <div>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                                        <Sparkles size={14} />
                                        {language === 'vi' ? 'Workspace CVF' : 'CVF Workspace'}
                                    </span>
                                    <h2 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white sm:text-5xl">
                                        {t('main.heroLine1')}{' '}
                                        <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                                            {t('main.heroLine2')}
                                        </span>
                                    </h2>
                                    <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-white/55">
                                        {currentFolder
                                            ? `📂 ${templates.find(t => t.id === currentFolder)?.name || (language === 'vi' ? 'Thư mục' : 'Folder')}`
                                            : t('main.heroDesc')}
                                    </p>

                                    <div className="mt-8 flex flex-wrap gap-3">
                                        <Link
                                            href="/landing"
                                            className="cvf-control inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_-18px_rgba(79,70,229,0.7)] transition hover:brightness-110"
                                        >
                                            {language === 'vi' ? 'Khám phá CVF' : 'Explore CVF'}
                                        </Link>
                                        <Link
                                            href="/help"
                                            className="cvf-control inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/75 dark:hover:bg-white/[0.07]"
                                        >
                                            {language === 'vi' ? 'Xem hướng dẫn' : 'See the guide'}
                                        </Link>
                                        {currentFolder && (
                                            <button
                                                onClick={() => setCurrentFolder(null)}
                                                className="cvf-control inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/75 dark:hover:bg-white/[0.07]"
                                            >
                                                {t('main.backToAll')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                                    {statCards.map((card) => (
                                        <SurfaceStatCard
                                            key={card.label}
                                            label={card.label}
                                            value={card.value}
                                            icon={card.icon}
                                            tone={card.tone}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>

                        {starterHandoff && !currentFolder && (
                            <div className="cvf-surface cvf-density-section rounded-[28px] border border-indigo-200/80 bg-white p-6 shadow-[0_10px_30px_-24px_rgba(79,70,229,0.45)] dark:border-indigo-500/20 dark:bg-[#171b29] dark:shadow-none">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-3">
                                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                                            {language === 'vi' ? 'Bản giao starter' : 'Starter handoff'}
                                        </div>
                                        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                                            {language === 'vi'
                                                ? 'Starter path đã sẵn sàng từ onboarding'
                                                : 'Your starter path is ready from onboarding'}
                                        </h3>
                                        <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-white/58">
                                            {starterHandoff.userInput}
                                        </p>
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.07] dark:bg-white/[0.04]">
                                                <div className="text-xs uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">
                                                    {language === 'vi' ? 'Luồng khởi đầu' : 'Starter path'}
                                                </div>
                                                <div className="mt-2 font-semibold text-slate-950 dark:text-white">
                                                    {starterHandoff.recommendedTemplateLabel}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.07] dark:bg-white/[0.04]">
                                                <div className="text-xs uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">
                                                    {language === 'vi' ? 'Pha đã route' : 'Routed phase'}
                                                </div>
                                                <div className="mt-2 font-semibold text-slate-950 dark:text-white">
                                                    {starterHandoff.friendlyPhase}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.07] dark:bg-white/[0.04]">
                                                <div className="text-xs uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">
                                                    {language === 'vi' ? 'Mức rủi ro' : 'Risk'}
                                                </div>
                                                <div className="mt-2 font-semibold text-slate-950 dark:text-white">
                                                    {starterHandoff.friendlyRisk}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex w-full flex-col gap-3 lg:w-60">
                                        <button
                                            onClick={handleOpenGovernedStarter}
                                            className="cvf-control rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                        >
                                            {language === 'vi' ? 'Mở starter path' : 'Open starter path'}
                                        </button>
                                        <button
                                            onClick={handleDismissGovernedStarter}
                                            className="cvf-control rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/75 dark:hover:bg-white/[0.07]"
                                        >
                                            {language === 'vi' ? 'Ẩn handoff' : 'Dismiss handoff'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!mockAiEnabled && !hasAnyApiKey && (
                            <div className="cvf-surface cvf-density-section rounded-[28px] border border-amber-200 bg-amber-50/90 p-5 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-100">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <div className="text-lg font-semibold">{t('main.apiKeyTitle')}</div>
                                        <div className="mt-1 text-sm text-amber-700 dark:text-amber-200/80">{t('main.apiKeyDesc')}</div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={handleDemoRun}
                                            className="cvf-control rounded-2xl border border-amber-400/70 bg-white px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15"
                                        >
                                            {language === 'vi' ? 'Chạy demo ngay' : 'Run demo now'}
                                        </button>
                                        <button
                                            onClick={() => window.dispatchEvent(new CustomEvent('cvf:openApiKeyWizard'))}
                                            className="cvf-control rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
                                        >
                                            {t('main.apiKeyCta')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <section className="cvf-surface cvf-density-section rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#171b29] dark:shadow-none">
                            <div className="flex flex-col gap-6">
                                {!currentFolder && (
                                    <div id="tour-category-tabs" className="space-y-4">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                            <div>
                                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-white/35">
                                                    {language === 'vi' ? 'Duyệt theo nhóm' : 'Browse by category'}
                                                </div>
                                                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                                                    {language === 'vi' ? 'Mọi template trong cùng một front door' : 'Every template in one governed front door'}
                                                </h3>
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-white/45">
                                                {language === 'vi'
                                                    ? `${filteredTemplates.length} items hiển thị`
                                                    : `${filteredTemplates.length} items showing`}
                                            </div>
                                        </div>
                                        <CategoryTabs
                                            activeCategory={selectedCategory}
                                            onCategoryChange={setSelectedCategory}
                                            counts={categoryCounts}
                                        />
                                    </div>
                                )}

                                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-center">
                                    <div className="relative">
                                        <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={language === 'en' ? 'Search templates...' : 'Tìm kiếm template...'}
                                            className="cvf-control cvf-density-input w-full rounded-[22px] border border-slate-200 bg-slate-50 py-4 pl-12 pr-12 text-sm text-slate-900 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-white/[0.08] dark:bg-[#10131d] dark:text-white dark:placeholder:text-white/30 dark:focus:border-indigo-400"
                                            aria-label={language === 'en' ? 'Search templates' : 'Tìm kiếm template'}
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-white/80"
                                                aria-label={language === 'en' ? 'Clear search' : 'Xóa tìm kiếm'}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500 dark:border-white/[0.08] dark:bg-[#10131d] dark:text-white/45">
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {language === 'vi' ? `${categoryCounts.all} templates sẵn sàng` : `${categoryCounts.all} templates ready`}
                                        </div>
                                        <div className="mt-1 leading-6">
                                            {language === 'vi'
                                                ? 'Giữ nguyên flow, chỉ chọn đúng template và để CVF dẫn đường.'
                                                : 'Keep the flow intact, just pick the right template and let CVF guide the path.'}
                                        </div>
                                    </div>
                                </div>

                                <div id="tour-template-grid" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                    {filteredTemplates.map((template, index) => (
                                        <div key={template.id} id={index === 0 ? 'tour-template-card' : undefined}>
                                            <TemplateCard
                                                template={template}
                                                onClick={() => handleSelectTemplate(template)}
                                                onPreview={(e) => { e.stopPropagation(); setPreviewTemplate(template); }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                </>
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
                />
            )}

            <TemplatePreviewModal
                isOpen={!!previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                templateName={previewTemplate?.name || ''}
                sampleOutput={previewTemplate?.sampleOutput}
            />
        </div>
    );
}
