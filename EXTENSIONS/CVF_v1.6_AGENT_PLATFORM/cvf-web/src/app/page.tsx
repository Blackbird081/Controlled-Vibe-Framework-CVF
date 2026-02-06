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
  ContentStrategyWizard,
  DataAnalysisWizard,
  SkillLibrary,
  TemplatePreviewModal,
  AnalyticsDashboard,
  TemplateMarketplace,
  TourGuide,
  UserContextForm,
  UserContextBadge,
  SettingsButton,
  SettingsPage,
  AgentChatWithHistory,
  AgentChatButton,
  MultiAgentPanel,
  MultiAgentButton,
  ToolsPage,
  ToolsButton,
  AIUsagePanel,
  AIUsageBadge,
} from '@/components';
import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle } from '@/lib/i18n';
import { useSettings } from '@/components/Settings';

type AppState = 'home' | 'form' | 'processing' | 'result' | 'history' | 'analytics' | 'marketplace' | 'wizard' | 'product-wizard' | 'marketing-wizard' | 'business-wizard' | 'security-wizard' | 'research-wizard' | 'system-wizard' | 'content-wizard' | 'data-wizard' | 'skills' | 'agent' | 'multi-agent' | 'tools';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentOutput, setCurrentOutput] = useState('');
  const [currentInput, setCurrentInput] = useState<Record<string, string>>({});
  const [currentIntent, setCurrentIntent] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserContext, setShowUserContext] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIUsage, setShowAIUsage] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState<string | undefined>();
  const [isAgentMinimized, setIsAgentMinimized] = useState(false);

  const { executions, addExecution, updateExecution, currentExecution, setCurrentExecution } = useExecutionStore();
  const { settings } = useSettings();

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
    // If it's a folder, enter it
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
    // Check if this is the content strategy wizard template
    if (template.id === 'content_strategy_wizard') {
      setAppState('content-wizard');
      return;
    }
    // Check if this is the data analysis wizard template
    if (template.id === 'data_analysis_wizard') {
      setAppState('data-wizard');
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
    } else if (appState === 'skills') {
      setAppState('home');
    } else if (appState === 'analytics') {
      setAppState('home');
    } else if (appState === 'marketplace') {
      setAppState('home');
    } else if (
      appState === 'wizard' ||
      appState === 'product-wizard' ||
      appState === 'marketing-wizard' ||
      appState === 'business-wizard' ||
      appState === 'security-wizard' ||
      appState === 'research-wizard' ||
      appState === 'system-wizard' ||
      appState === 'content-wizard' ||
      appState === 'data-wizard'
    ) {
      // Return to home from any wizard
      setAppState('home');
    }
  }, [appState]);

  const handleHistorySelect = useCallback((execution: Execution) => {
    setCurrentExecution(execution);
    setCurrentOutput(execution.output || '');
    setAppState('result');
  }, [setCurrentExecution]);

  // Helper to open Agent with API key check
  const handleOpenAgent = useCallback((prompt?: string) => {
    // ALWAYS set the prompt first (even if no API key)
    setAgentPrompt(prompt);
    setAppState('agent');
    setIsAgentMinimized(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => { setAppState('home'); setSelectedTemplate(null); setMobileMenuOpen(false); }}>
              <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <span>🎯</span>
                <span>CVF v1.6</span>
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <button
                id="tour-nav-skills"
                onClick={() => setAppState('skills')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                           ${appState === 'skills'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                📚 Skills
              </button>
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
              <button
                id="tour-nav-analytics"
                onClick={() => setAppState('analytics')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                           ${appState === 'analytics'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                📊 Analytics
              </button>
              <button
                id="tour-nav-marketplace"
                onClick={() => setAppState('marketplace')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                           ${appState === 'marketplace'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                🏪 Marketplace
              </button>
              {/* AI Agent Button in Header */}
              <button
                onClick={() => handleOpenAgent()}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                           ${appState === 'agent'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-md hover:scale-105'}`}
              >
                🤖 AI Agent
              </button>
              {/* Multi-Agent Button */}
              <button
                onClick={() => setAppState('multi-agent')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                           ${appState === 'multi-agent'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-md hover:scale-105'}`}
              >
                🎯 Multi-Agent
              </button>
              {/* Tools Button */}
              <button
                onClick={() => setAppState('tools')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                           ${appState === 'tools'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-md hover:scale-105'}`}
              >
                🛠️ Tools
              </button>
              <UserContextBadge onClick={() => setShowUserContext(true)} />
              <AIUsageBadge onClick={() => setShowAIUsage(true)} />
              <SettingsButton onClick={() => setShowSettings(true)} />
              <div id="tour-lang-switch">
                <LanguageToggle />
              </div>
              <ThemeToggle />
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
              <button
                onClick={() => { setAppState('skills'); setMobileMenuOpen(false); }}
                className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors
                           ${appState === 'skills'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                📚 Skills
              </button>
              <Link
                href="/help"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full px-4 py-3 rounded-lg text-left font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                📖 Hướng dẫn
              </Link>
              <button
                onClick={() => { setAppState('history'); setMobileMenuOpen(false); }}
                className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors
                           ${appState === 'history'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                📜 History ({executions.length})
              </button>
              <button
                onClick={() => { setAppState('analytics'); setMobileMenuOpen(false); }}
                className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors
                           ${appState === 'analytics'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => { setAppState('marketplace'); setMobileMenuOpen(false); }}
                className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors
                           ${appState === 'marketplace'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                🏪 Marketplace
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* HOME STATE */}
        {appState === 'home' && (
          <>
            {/* Welcome Section */}
            <div id="tour-welcome" className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                  User không cần biết CVF
                </span>
                <br />
                để dùng CVF
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {currentFolder
                  ? `📂 ${templates.find(t => t.id === currentFolder)?.name || 'Folder'}`
                  : 'CVF v1.6 giúp bạn sử dụng AI mà không cần viết prompt. Chỉ cần chọn template, điền form, và nhận kết quả.'
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
                    onPreview={(e) => handlePreviewTemplate(e, template)}
                  />
                </div>
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
            onSendToAgent={(spec) => handleOpenAgent(spec)}
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

        {/* CONTENT STRATEGY WIZARD STATE */}
        {appState === 'content-wizard' && (
          <ContentStrategyWizard onBack={handleBack} />
        )}

        {/* DATA ANALYSIS WIZARD STATE */}
        {appState === 'data-wizard' && (
          <DataAnalysisWizard onBack={handleBack} />
        )}

        {/* PROCESSING STATE */}
        {appState === 'processing' && selectedTemplate && (
          <ProcessingScreen
            templateName={selectedTemplate.name}
            templateId={selectedTemplate.id}
            inputs={currentInput}
            intent={currentIntent}
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
            onSendToAgent={(content) => handleOpenAgent(content)}
          />
        )}

        {/* SKILL LIBRARY STATE */}
        {appState === 'skills' && (
          <SkillLibrary />
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
              onBrowse={handleBack}
            />
          </div>
        )}

        {/* ANALYTICS STATE */}
        {appState === 'analytics' && (
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
              <h2 className="text-2xl font-bold">📊 Analytics</h2>
            </div>
            <AnalyticsDashboard />
          </div>
        )}

        {/* MARKETPLACE STATE */}
        {appState === 'marketplace' && (
          <TemplateMarketplace onBack={handleBack} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          CVF v1.6 UX Platform — User không cần biết CVF để dùng CVF
        </div>
      </footer>

      {/* Floating Quick Reference Button */}
      <QuickReference />

      {/* Guided Tour */}
      <TourGuide />

      {/* Preview Modal */}
      <TemplatePreviewModal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        templateName={previewTemplate?.name || ''}
        sampleOutput={previewTemplate?.sampleOutput}
      />

      {/* User Context Modal */}
      {showUserContext && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <UserContextForm onClose={() => setShowUserContext(false)} />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <SettingsPage onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      {/* AI Usage Modal */}
      {showAIUsage && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <AIUsagePanel onClose={() => setShowAIUsage(false)} />
        </div>
      )}

      {/* Agent Chat Modal */}
      {appState === 'agent' && !isAgentMinimized && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[85vh] rounded-xl overflow-hidden shadow-2xl">
            <AgentChatWithHistory
              initialPrompt={agentPrompt}
              onClose={() => { setAppState('home'); setAgentPrompt(undefined); setIsAgentMinimized(false); }}
              onComplete={() => { setAppState('home'); setAgentPrompt(undefined); setIsAgentMinimized(false); }}
              onMinimize={() => setIsAgentMinimized(true)}
            />
          </div>
        </div>
      )}

      {/* Minimized Agent Floating Bar */}
      {appState === 'agent' && isAgentMinimized && (
        <div
          className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-blue-600 
                     text-white px-5 py-3 rounded-xl shadow-2xl cursor-pointer
                     hover:from-purple-700 hover:to-blue-700 transition-all
                     flex items-center gap-3 animate-pulse"
          onClick={() => setIsAgentMinimized(false)}
        >
          <span className="text-xl">🤖</span>
          <span className="font-medium">CVF Agent</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Click để mở lại</span>
        </div>
      )}

      {/* Multi-Agent Modal */}
      {appState === 'multi-agent' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[85vh] rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900">
            <MultiAgentPanel
              onClose={() => setAppState('home')}
              onComplete={() => setAppState('home')}
            />
          </div>
        </div>
      )}

      {/* Tools Modal */}
      {appState === 'tools' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[85vh] rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900">
            <ToolsPage onClose={() => setAppState('home')} />
          </div>
        </div>
      )}

      {/* Floating Agent Button - Removed, now in header */}
    </div>
  );
}
