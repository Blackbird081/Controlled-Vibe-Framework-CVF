'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { templates } from '@/lib/templates';
import { useExecutionStore } from '@/lib/store';
import { useSettings } from '@/components/Settings';
import { Template, Execution } from '@/types';
import { useLanguage } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
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
    const { t } = useLanguage();
    const router = useRouter();
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

    const { addExecution, updateExecution, currentExecution, setCurrentExecution } = useExecutionStore();

    const filteredTemplates = useMemo(() => {
        let result = selectedCategory === 'all'
            ? templates
            : templates.filter(t => t.category === selectedCategory);

        if (currentFolder) {
            result = result.filter(t => t.parentFolder === currentFolder);
        } else {
            result = result.filter(t => !t.parentFolder);
        }
        return result;
    }, [selectedCategory, currentFolder]);

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
        setWorkflowState('browse');
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

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">

            {/* BROWSE STATE */}
            {workflowState === 'browse' && (
                <>
                    <div id="tour-welcome" className="text-center mb-12">
                        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                                {t('main.heroLine1')}
                            </span>
                            <br />
                            {t('main.heroLine2')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            {currentFolder
                                ? `📂 ${templates.find(t => t.id === currentFolder)?.name || 'Folder'}`
                                : t('main.heroDesc')
                            }
                        </p>
                        {currentFolder && (
                            <button
                                onClick={() => setCurrentFolder(null)}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                {t('main.backToAll')}
                            </button>
                        )}
                    </div>

                    {!mockAiEnabled && !hasAnyApiKey && (
                        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="font-semibold text-lg">{t('main.apiKeyTitle')}</div>
                                <div className="text-sm text-amber-700">{t('main.apiKeyDesc')}</div>
                            </div>
                            <button className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700">
                                {t('main.apiKeyCta')}
                            </button>
                        </div>
                    )}

                    {!currentFolder && (
                        <div id="tour-category-tabs">
                            <CategoryTabs
                                activeCategory={selectedCategory}
                                onCategoryChange={setSelectedCategory}
                            />
                        </div>
                    )}

                    <div id="tour-template-grid" className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template, index) => (
                            <div key={template.id} id={index === 0 ? "tour-template-card" : undefined}>
                                <TemplateCard
                                    template={template}
                                    onClick={() => handleSelectTemplate(template)}
                                    onPreview={(e) => { e.stopPropagation(); setPreviewTemplate(template); }}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* FORM */}
            {workflowState === 'form' && selectedTemplate && (
                <DynamicForm
                    template={selectedTemplate}
                    onSubmit={handleFormSubmit}
                    onBack={handleBack}
                    onSendToAgent={() => { }}
                />
            )}

            {/* WIZARDS */}
            {workflowState === 'wizard' && <AppBuilderWizard onBack={handleBack} />}
            {workflowState === 'product-wizard' && <ProductDesignWizard onBack={handleBack} />}
            {workflowState === 'marketing-wizard' && <MarketingCampaignWizard onBack={handleBack} />}
            {workflowState === 'business-wizard' && <BusinessStrategyWizard onBack={handleBack} />}
            {workflowState === 'security-wizard' && <SecurityAssessmentWizard onBack={handleBack} />}
            {workflowState === 'research-wizard' && <ResearchProjectWizard onBack={handleBack} />}
            {workflowState === 'system-wizard' && <SystemDesignWizard onBack={handleBack} />}
            {workflowState === 'content-wizard' && <ContentStrategyWizard onBack={handleBack} />}
            {workflowState === 'data-wizard' && <DataAnalysisWizard onBack={handleBack} />}

            {/* PROCESSING */}
            {workflowState === 'processing' && selectedTemplate && (
                <ProcessingScreen
                    templateName={selectedTemplate.name}
                    templateId={selectedTemplate.id}
                    inputs={currentInput}
                    intent={currentIntent}
                    onComplete={handleProcessingComplete}
                    onCancel={handleBack}
                />
            )}

            {/* RESULT */}
            {workflowState === 'result' && currentExecution && (
                <ResultViewer
                    execution={currentExecution}
                    output={currentOutput}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onRetry={() => setWorkflowState('form')}
                    onBack={handleBack}
                    onSendToAgent={() => { }}
                />
            )}

            {/* Preview Modal */}
            <TemplatePreviewModal
                isOpen={!!previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                templateName={previewTemplate?.name || ''}
                sampleOutput={previewTemplate?.sampleOutput}
            />
        </div>
    );
}
