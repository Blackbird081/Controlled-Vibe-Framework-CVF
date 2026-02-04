'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { templates } from '@/lib/templates';
import { useExecutionStore } from '@/lib/store';
import { Template, Execution } from '@/types';
import {
  TemplateCard,
  CategoryTabs,
  DynamicForm,
  ProcessingScreen,
  ResultViewer,
  HistoryList,
  QuickReference,
  OnboardingWizard,
  AppBuilderWizard,
  ProductDesignWizard,
  MarketingCampaignWizard,
  BusinessStrategyWizard,
  SecurityAssessmentWizard,
  ResearchProjectWizard,
  SystemDesignWizard,
} from '@/components';
import { ThemeToggle } from '@/lib/theme';

type AppState = 'home' | 'form' | 'processing' | 'result' | 'history' | 'wizard' | 'product-wizard' | 'marketing-wizard' | 'business-wizard' | 'security-wizard' | 'research-wizard' | 'system-wizard';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentOutput, setCurrentOutput] = useState('');
  const [currentInput, setCurrentInput] = useState<Record<string, string>>({});
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { executions, addExecution, updateExecution, currentExecution, setCurrentExecution } = useExecutionStore();

  // Check if first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('cvf_onboarding_complete');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('cvf_onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  // State for folder navigation
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  // Filter templates - hide those in folders unless viewing that folder
  const filteredTemplates = (() => {
    let result = selectedCategory === 'all'
      ? templates
      : templates.filter(t => t.category === selectedCategory);

    if (currentFolder) {
      // Show only templates in the current folder
      result = result.filter(t => t.parentFolder === currentFolder);
    } else {
      // Hide templates that are inside folders
      result = result.filter(t => !t.parentFolder);
    }

    return result;
  })();

  const handleSelectTemplate = useCallback((template: Template) => {
    // Check if this is a folder
    if (template.isFolder) {
      setCurrentFolder(template.id);
      return;
    }
    // Check if this is the app builder wizard template
    if (template.id === 'app_builder_wizard') {
      setAppState('wizard');
      return;
    }
    // Check if this is the product design wizard template
    if (template.id === 'product_design_wizard') {
      setAppState('product-wizard');
      return;
    }
    // Check if this is the marketing campaign wizard template
    if (template.id === 'marketing_campaign_wizard') {
      setAppState('marketing-wizard');
      return;
    }
    // Check if this is the business strategy wizard template
    if (template.id === 'business_strategy_wizard') {
      setAppState('business-wizard');
      return;
    }
    // Check if this is the security assessment wizard template
    if (template.id === 'security_assessment_wizard') {
      setAppState('security-wizard');
      return;
    }
    // Check if this is the research project wizard template
    if (template.id === 'research_project_wizard') {
      setAppState('research-wizard');
      return;
    }
    // Check if this is the system design wizard template
    if (template.id === 'system_design_wizard') {
      setAppState('system-wizard');
      return;
    }
    setSelectedTemplate(template);
    setAppState('form');
  }, []);

  const handleFormSubmit = useCallback((values: Record<string, string>, intent: string) => {
    setCurrentInput(values);

    // Create new execution
    const execution: Execution = {
      id: `exec_${Date.now()}`,
      templateId: selectedTemplate!.id,
      templateName: selectedTemplate!.name,
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
    setAppState('form'); // Go back to form to retry
  }, [currentExecution, updateExecution]);

  const handleRetry = useCallback(() => {
    setAppState('form');
  }, []);

  const handleBack = useCallback(() => {
    if (appState === 'form') {
      setSelectedTemplate(null);
      setAppState('home');
    } else if (appState === 'result') {
      setAppState('home');
      setSelectedTemplate(null);
      setCurrentOutput('');
    } else if (appState === 'history') {
      setAppState('home');
    }
  }, [appState]);

  const handleHistorySelect = useCallback((execution: Execution) => {
    setCurrentExecution(execution);
    setCurrentOutput(execution.output || '');
    setAppState('result');
  }, [setCurrentExecution]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => { setAppState('home'); setSelectedTemplate(null); }}>
              <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <span>🎯</span>
                <span>CVF v1.5</span>
              </h1>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/skills"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                📚 Skills
              </Link>
              <Link
                href="/help"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                📖 Hướng dẫn
              </Link>
              <button
                onClick={() => setAppState('history')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                           ${appState === 'history'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                📜 History ({executions.length})
              </button>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* HOME STATE */}
        {appState === 'home' && (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {currentFolder
                  ? `📂 ${templates.find(t => t.id === currentFolder)?.name || 'Folder'}`
                  : 'Chọn template để bắt đầu'
                }
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {currentFolder
                  ? templates.find(t => t.id === currentFolder)?.description
                  : 'CVF v1.5 giúp bạn sử dụng AI mà không cần viết prompt. Chỉ cần chọn template, điền form, và nhận kết quả.'
                }
              </p>
              {currentFolder && (
                <button
                  onClick={() => setCurrentFolder(null)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  ← Quay lại
                </button>
              )}
            </div>

            {!currentFolder && (
              <CategoryTabs
                activeCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleSelectTemplate(template)}
                />
              ))}
            </div>
          </>
        )}

        {/* FORM STATE */}
        {appState === 'form' && selectedTemplate && (
          <DynamicForm
            template={selectedTemplate}
            onSubmit={handleFormSubmit}
            onBack={handleBack}
          />
        )}

        {/* WIZARD STATE */}
        {appState === 'wizard' && (
          <AppBuilderWizard onBack={handleBack} />
        )}

        {/* PRODUCT DESIGN WIZARD STATE */}
        {appState === 'product-wizard' && (
          <ProductDesignWizard onBack={handleBack} />
        )}

        {/* MARKETING CAMPAIGN WIZARD STATE */}
        {appState === 'marketing-wizard' && (
          <MarketingCampaignWizard onBack={handleBack} />
        )}

        {/* BUSINESS STRATEGY WIZARD STATE */}
        {appState === 'business-wizard' && (
          <BusinessStrategyWizard onBack={handleBack} />
        )}

        {/* SECURITY ASSESSMENT WIZARD STATE */}
        {appState === 'security-wizard' && (
          <SecurityAssessmentWizard onBack={handleBack} />
        )}

        {/* RESEARCH PROJECT WIZARD STATE */}
        {appState === 'research-wizard' && (
          <ResearchProjectWizard onBack={handleBack} />
        )}

        {/* SYSTEM DESIGN WIZARD STATE */}
        {appState === 'system-wizard' && (
          <SystemDesignWizard onBack={handleBack} />
        )}

        {/* PROCESSING STATE */}
        {appState === 'processing' && selectedTemplate && (
          <ProcessingScreen
            templateName={selectedTemplate.name}
            onComplete={handleProcessingComplete}
            onCancel={handleBack}
          />
        )}

        {/* RESULT STATE */}
        {appState === 'result' && currentExecution && (
          <ResultViewer
            execution={currentExecution}
            output={currentOutput}
            onAccept={handleAccept}
            onReject={handleReject}
            onRetry={handleRetry}
            onBack={handleBack}
          />
        )}

        {/* HISTORY STATE */}
        {appState === 'history' && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold">📜 History</h2>
            </div>

            <HistoryList
              executions={executions}
              onSelect={handleHistorySelect}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          CVF v1.5 UX Platform — User không cần biết CVF để dùng CVF
        </div>
      </footer>

      {/* Floating Quick Reference Button */}
      <QuickReference />
    </div>
  );
}
