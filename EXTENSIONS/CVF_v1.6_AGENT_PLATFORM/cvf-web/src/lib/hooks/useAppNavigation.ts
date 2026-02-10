'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { templates } from '@/lib/templates';
import { useExecutionStore } from '@/lib/store';
import { Template, Execution } from '@/types';
import { trackEvent } from '@/lib/analytics';

export type AppState = 'home' | 'form' | 'processing' | 'result' | 'history' | 'analytics' | 'marketplace' | 'wizard' | 'product-wizard' | 'marketing-wizard' | 'business-wizard' | 'security-wizard' | 'research-wizard' | 'system-wizard' | 'content-wizard' | 'data-wizard' | 'skills' | 'agent' | 'multi-agent' | 'tools';

const WIZARD_MAP: Record<string, AppState> = {
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

export function useAppNavigation() {
    const [appState, setAppState] = useState<AppState>('home');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentOutput, setCurrentOutput] = useState('');
    const [currentInput, setCurrentInput] = useState<Record<string, string>>({});
    const [currentIntent, setCurrentIntent] = useState('');
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [agentPrompt, setAgentPrompt] = useState<string | undefined>();
    const [isAgentMinimized, setIsAgentMinimized] = useState(false);

    const { executions, addExecution, updateExecution, currentExecution, setCurrentExecution } = useExecutionStore();

    // Filter templates
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
            setAppState(wizardState);
            return;
        }
        setSelectedTemplate(template);
        setAppState('form');
    }, []);

    const handlePreviewTemplate = useCallback((e: React.MouseEvent, template: Template) => {
        e.stopPropagation();
        setPreviewTemplate(template);
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
        setAppState('processing');
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
        setAppState('result');
    }, [currentExecution, updateExecution]);

    const handleAccept = useCallback(() => {
        if (currentExecution) {
            updateExecution(currentExecution.id, { result: 'accepted' });
        }
        setAppState('home');
        setSelectedTemplate(null);
        setCurrentOutput('');
    }, [currentExecution, updateExecution]);

    const handleReject = useCallback(() => {
        if (currentExecution) {
            updateExecution(currentExecution.id, { result: 'rejected' });
        }
        setAppState('form');
    }, [currentExecution, updateExecution]);

    const handleRetry = useCallback(() => {
        if (currentExecution) {
            trackEvent('execution_retry', {
                executionId: currentExecution.id,
                templateId: currentExecution.templateId,
                templateName: currentExecution.templateName,
            });
        }
        setAppState('form');
    }, [currentExecution]);

    const handleBack = useCallback(() => {
        if (appState === 'form') {
            setSelectedTemplate(null);
        }
        if (appState === 'result') {
            setSelectedTemplate(null);
            setCurrentOutput('');
        }
        setAppState('home');
    }, [appState]);

    const handleHistorySelect = useCallback((execution: Execution) => {
        setCurrentExecution(execution);
        setCurrentOutput(execution.output || '');
        setAppState('result');
    }, [setCurrentExecution]);

    const handleOpenAgent = useCallback((prompt?: string) => {
        setAgentPrompt(prompt);
        setAppState('agent');
        setIsAgentMinimized(false);
        trackEvent('agent_opened');
    }, []);

    const navigateTo = useCallback((state: string) => {
        if (state === 'agent') {
            handleOpenAgent();
        } else {
            setAppState(state as AppState);
        }
    }, [handleOpenAgent]);

    // Track page views
    useEffect(() => {
        if (appState === 'analytics') trackEvent('analytics_opened');
        if (appState === 'multi-agent') trackEvent('multi_agent_opened');
        if (appState === 'tools') trackEvent('tools_opened');
    }, [appState]);

    return {
        // State
        appState,
        setAppState,
        selectedTemplate,
        previewTemplate,
        setPreviewTemplate,
        selectedCategory,
        setSelectedCategory,
        currentOutput,
        currentInput,
        currentIntent,
        currentFolder,
        setCurrentFolder,
        sidebarOpen,
        setSidebarOpen,
        agentPrompt,
        setAgentPrompt,
        isAgentMinimized,
        setIsAgentMinimized,
        filteredTemplates,
        executions,
        currentExecution,

        // Handlers
        handleSelectTemplate,
        handlePreviewTemplate,
        handleFormSubmit,
        handleProcessingComplete,
        handleAccept,
        handleReject,
        handleRetry,
        handleBack,
        handleHistorySelect,
        handleOpenAgent,
        navigateTo,
    };
}
