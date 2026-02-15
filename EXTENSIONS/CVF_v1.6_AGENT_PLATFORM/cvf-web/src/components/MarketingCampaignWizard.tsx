'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { WIZARD_COMMON, t as wt, type Lang } from '@/lib/wizard-i18n';
import { evaluateSpecGate } from '@/lib/spec-gate';

const DRAFT_STORAGE_KEY = 'cvf_marketing_campaign_wizard_draft';

interface WizardField {
    id: string;
    type: 'text' | 'textarea' | 'select';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    rows?: number;
    tip?: string;
}

interface WizardStep {
    id: number;
    name: string;
    icon: string;
    description: string;
    required: boolean;
    fields: WizardField[];
    isReview?: boolean;
}

interface WizardData {
    [key: string]: string;
}

interface MarketingCampaignWizardProps {
    onBack: () => void;
}

function getWizardSteps(lang: Lang): WizardStep[] {
    return [
    {
        id: 1,
        name: 'Campaign Goals',
        icon: '🎯',
        description: lang === 'vi' ? 'Xác định mục tiêu và KPIs' : 'Define objectives and KPIs',
        required: true,
        fields: [
            { id: 'campaignName', type: 'text', label: lang === 'vi' ? 'Tên Campaign' : 'Campaign Name', placeholder: lang === 'vi' ? 'VD: Q1 Product Launch' : 'e.g. Q1 Product Launch', required: true, tip: lang === 'vi' ? '💡 Tên ngắn gọn, dễ track' : '💡 Short, trackable name' },
            { id: 'campaignType', type: 'select', label: lang === 'vi' ? 'Loại Campaign' : 'Campaign Type', options: ['Brand Awareness', 'Lead Generation', 'Product Launch', 'Event Promotion', 'Sales Promotion', 'Content Marketing', 'Retention'], required: true, tip: lang === 'vi' ? '💡 Chọn loại phù hợp với mục tiêu' : '💡 Choose type matching your goals' },
            { id: 'objectives', type: 'textarea', label: 'Objectives (SMART)', placeholder: lang === 'vi' ? 'VD: Tăng 20% traffic trong 30 ngày, Generate 500 leads...' : 'e.g. Increase traffic 20% in 30 days, Generate 500 leads...', required: true, rows: 3, tip: '💡 Specific, Measurable, Achievable, Relevant, Time-bound' },
            { id: 'kpis', type: 'textarea', label: 'KPIs', placeholder: lang === 'vi' ? 'VD:\n- Traffic: +20%\n- Leads: 500\n- Conversion: 3%' : 'e.g.:\n- Traffic: +20%\n- Leads: 500\n- Conversion: 3%', required: true, rows: 3 - 2 },
            { id: 'timeline', type: 'text', label: 'Timeline', placeholder: lang === 'vi' ? 'VD: 01/02/2026 - 28/02/2026' : 'e.g. 01/02/2026 - 28/02/2026', required: true },
            { id: 'budget', type: 'text', label: 'Budget', placeholder: lang === 'vi' ? 'VD: $5,000 hoặc 50M VND' : 'e.g. $5,000 or 50M VND', required: false },
        ]
    },
    {
        id: 2,
        name: 'Target Audience',
        icon: '👥',
        description: lang === 'vi' ? 'Định nghĩa đối tượng mục tiêu' : 'Define target audience',
        required: true,
        fields: [
            { id: 'demographics', type: 'textarea', label: 'Demographics', placeholder: 'Age, gender, location, income, education...', required: true, rows: 2, tip: lang === 'vi' ? '💡 Các đặc điểm nhân khẩu học' : '💡 Demographic characteristics' },
            { id: 'psychographics', type: 'textarea', label: 'Psychographics', placeholder: 'Interests, values, lifestyle, pain points...', required: true, rows: 2, tip: lang === 'vi' ? '💡 Tâm lý, hành vi, sở thích' : '💡 Psychology, behavior, interests' },
            { id: 'segments', type: 'textarea', label: 'Audience Segments', placeholder: '1. Primary: ...\n2. Secondary: ...\n3. Lookalike: ...', required: true, rows: 3 },
            { id: 'customerJourney', type: 'textarea', label: 'Customer Journey Stage', placeholder: 'Awareness → Consideration → Decision → Loyalty', required: false, rows: 2 },
        ]
    },
    {
        id: 3,
        name: 'Channels & Tactics',
        icon: '📢',
        description: lang === 'vi' ? 'Chọn kênh và chiến thuật' : 'Choose channels and tactics',
        required: true,
        fields: [
            { id: 'channels', type: 'textarea', label: 'Marketing Channels', placeholder: lang === 'vi' ? 'VD:\n- Facebook/Instagram Ads\n- Google Ads\n- Email Marketing\n- Content/SEO' : 'e.g.:\n- Facebook/Instagram Ads\n- Google Ads\n- Email Marketing\n- Content/SEO', required: true, rows: 4, tip: lang === 'vi' ? '💡 Chọn channels phù hợp với audience' : '💡 Choose channels matching your audience' },
            { id: 'tactics', type: 'textarea', label: 'Tactics per Channel', placeholder: lang === 'vi' ? 'Facebook: Video ads, Carousel\nGoogle: Search, Display\nEmail: Nurture sequence' : 'Facebook: Video ads, Carousel\nGoogle: Search, Display\nEmail: Nurture sequence', required: true, rows: 4 },
            { id: 'budgetAllocation', type: 'textarea', label: 'Budget Allocation', placeholder: lang === 'vi' ? 'VD:\n- Facebook: 40%\n- Google: 30%\n- Content: 20%\n- Email: 10%' : 'e.g.:\n- Facebook: 40%\n- Google: 30%\n- Content: 20%\n- Email: 10%', required: false, rows: 3 },
        ]
    },
    {
        id: 4,
        name: 'Content Plan',
        icon: '📝',
        description: lang === 'vi' ? 'Lên kế hoạch nội dung' : 'Plan content',
        required: true,
        fields: [
            { id: 'messaging', type: 'textarea', label: 'Key Messages', placeholder: lang === 'vi' ? 'VD:\n- Headline: ...\n- Value prop: ...\n- CTA: ...' : 'e.g.:\n- Headline: ...\n- Value prop: ...\n- CTA: ...', required: true, rows: 3, tip: lang === 'vi' ? '💡 Messages nhất quán across channels' : '💡 Consistent messages across channels' },
            { id: 'creativeDirection', type: 'textarea', label: 'Creative Direction', placeholder: lang === 'vi' ? 'Visual style, tone of voice, brand guidelines...' : 'Visual style, tone of voice, brand guidelines...', required: true, rows: 2 },
            { id: 'contentTypes', type: 'textarea', label: 'Content Types', placeholder: lang === 'vi' ? 'VD:\n- 3 blog posts\n- 5 social posts\n- 1 landing page\n- 3 email templates' : 'e.g.:\n- 3 blog posts\n- 5 social posts\n- 1 landing page\n- 3 email templates', required: true, rows: 4 },
            { id: 'contentCalendar', type: 'textarea', label: 'Content Calendar Overview', placeholder: 'Week 1: Launch announcement\nWeek 2: Feature highlights\nWeek 3: Testimonials\nWeek 4: Last chance CTA', required: false, rows: 4 },
        ]
    },
    {
        id: 5,
        name: 'Review',
        icon: '✅',
        description: lang === 'vi' ? 'Xem lại và xuất Campaign Brief' : 'Review and export Campaign Brief',
        required: true,
        isReview: true,
        fields: []
    }
    ];
}

function generateConsolidatedSpec(data: WizardData): string {
    const spec = `
# 📣 MARKETING CAMPAIGN BRIEF

> Generated by CVF Marketing Campaign Wizard
> Campaign: ${data.campaignName || 'N/A'}
> Type: ${data.campaignType || 'N/A'}

---

## 1️⃣ CAMPAIGN GOALS

### Objectives (SMART)
${data.objectives || 'N/A'}

### Key Performance Indicators (KPIs)
${data.kpis || 'N/A'}

### Timeline
${data.timeline || 'N/A'}

### Budget
${data.budget || 'To be determined'}

---

## 2️⃣ TARGET AUDIENCE

### Demographics
${data.demographics || 'N/A'}

### Psychographics
${data.psychographics || 'N/A'}

### Audience Segments
${data.segments || 'N/A'}

### Customer Journey Stage
${data.customerJourney || 'Full funnel'}

---

## 3️⃣ CHANNELS & TACTICS

### Marketing Channels
${data.channels || 'N/A'}

### Tactics per Channel
${data.tactics || 'N/A'}

### Budget Allocation
${data.budgetAllocation || 'To be optimized based on performance'}

---

## 4️⃣ CONTENT PLAN

### Key Messages
${data.messaging || 'N/A'}

### Creative Direction
${data.creativeDirection || 'N/A'}

### Content Types
${data.contentTypes || 'N/A'}

### Content Calendar
${data.contentCalendar || 'To be detailed'}

---

## 📋 SUMMARY FOR AI

**INTENT:**
Create a ${data.campaignType || 'marketing'} campaign called "${data.campaignName}" with the following goals: ${data.objectives?.substring(0, 150) || 'N/A'}...

**TARGET AUDIENCE:** ${data.demographics?.substring(0, 100) || 'N/A'}

**CHANNELS:**
${data.channels || 'N/A'}

**KEY MESSAGES:**
${data.messaging || 'N/A'}

---

## 🎯 EXPECTED OUTPUTS

Based on this brief, AI should generate:
1. **Campaign Strategy Document** - Detailed execution plan
2. **Content Calendar** - Weekly breakdown
3. **Ad Copy Variations** - For each channel
4. **Landing Page Copy** - Headlines, CTAs, body
5. **Email Sequences** - Subject lines, body copy
6. **Social Media Posts** - Platform-specific content
7. **Reporting Dashboard Setup** - KPI tracking

**REMEMBER:** You are the marketer. Create compelling, conversion-focused copy. Don't ask for approval on every headline!
`;

    return spec.trim();
}

export function MarketingCampaignWizard({ onBack }: MarketingCampaignWizardProps) {
    const { language } = useLanguage();
    const WIZARD_STEPS = getWizardSteps(language);
    const [currentStep, setCurrentStep] = useState(1);
    const [wizardData, setWizardData] = useState<WizardData>({});
    const [showExport, setShowExport] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);

    // Load draft from localStorage on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.data && Object.keys(parsed.data).length > 0) {
                    setHasDraft(true);
                }
            } catch (e) {
                // Invalid draft, ignore
            }
        }
    }, []);

    // Save draft to localStorage whenever data changes
    useEffect(() => {
        if (Object.keys(wizardData).length > 0) {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
                data: wizardData,
                step: currentStep,
                savedAt: new Date().toISOString()
            }));
        }
    }, [wizardData, currentStep]);

    // Load saved draft
    const loadDraft = () => {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setWizardData(parsed.data || {});
                setCurrentStep(parsed.step || 1);
                setHasDraft(false);
            } catch (e) {
                // Invalid draft
            }
        }
    };

    // Clear draft
    const clearDraft = () => {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setWizardData({});
        setCurrentStep(1);
        setHasDraft(false);
    };

    const currentStepConfig = WIZARD_STEPS.find(s => s.id === currentStep)!;

    // Check if can jump to a specific step
    const canJumpToStep = (targetStep: number): boolean => {
        if (targetStep <= currentStep) return true;
        for (let i = 1; i < targetStep; i++) {
            const step = WIZARD_STEPS.find(s => s.id === i);
            if (!step || !step.required) continue;
            const requiredFields = step.fields.filter(f => f.required);
            const allFilled = requiredFields.every(f => wizardData[f.id]?.trim());
            if (!allFilled) return false;
        }
        return true;
    };

    // Handle step click
    const handleStepClick = (stepId: number) => {
        if (canJumpToStep(stepId)) {
            setCurrentStep(stepId);
        }
    };

    // Handle field change
    const handleFieldChange = (fieldId: string, value: string) => {
        setWizardData(prev => ({ ...prev, [fieldId]: value }));
    };

    // Validate current step
    const isStepValid = () => {
        if (!currentStepConfig.required) return true;
        const requiredFields = currentStepConfig.fields.filter(f => f.required);
        return requiredFields.every(f => wizardData[f.id]?.trim());
    };

    // Calculate progress
    const progress = Math.round((currentStep / WIZARD_STEPS.length) * 100);

    // Handle export
    const handleExport = () => {
        setShowExport(true);
    };

    // Generate spec for review
    const generatedSpec = generateConsolidatedSpec(wizardData);
    const specGate = evaluateSpecGate(WIZARD_STEPS.flatMap(step => step.fields), wizardData);
    const canExport = specGate.status === 'PASS';
    const specGateLabel = specGate.status === 'PASS'
        ? wt(WIZARD_COMMON.specGatePass, language)
        : specGate.status === 'CLARIFY'
            ? wt(WIZARD_COMMON.specGateClarify, language)
            : wt(WIZARD_COMMON.specGateFail, language);
    const specGateClass = specGate.status === 'PASS'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : specGate.status === 'CLARIFY'
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-rose-50 border-rose-200 text-rose-700';

    if (showExport) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            📣 Campaign Brief - {wizardData.campaignName || 'Untitled'}
                        </h2>
                        <button
                            onClick={() => setShowExport(false)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[60vh] overflow-y-auto mb-4">
                        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                            {generatedSpec}
                        </pre>
                    </div>
                    <div className={`mb-4 p-3 rounded-lg border text-sm ${specGateClass}`}>
                        <div className="font-semibold">{specGateLabel}</div>
                        {specGate.missing.length > 0 && (
                            <div className="text-xs mt-1">
                                {wt(WIZARD_COMMON.missingRequired, language)}: {specGate.missing.map(field => field.label).join(', ')}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(generatedSpec);
                                alert(wt(WIZARD_COMMON.copiedToClipboard, language));
                            }}
                            disabled={!canExport}
                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${canExport
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            📋 Copy to Clipboard
                        </button>
                        <button
                            onClick={() => {
                                const blob = new Blob([generatedSpec], { type: 'text/markdown' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `campaign-brief-${wizardData.campaignName || 'spec'}.md`;
                                a.click();
                            }}
                            disabled={!canExport}
                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${canExport
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            💾 Download .md
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                    title={language === 'vi' ? 'Quay lại trang chủ' : 'Back to home'}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        📣 Marketing Campaign Wizard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {language === 'vi' ? 'Tạo Campaign Brief qua 5 bước' : 'Create Campaign Brief in 5 steps'}
                    </p>
                </div>
            </div>

            {/* Draft Banner */}
            {hasDraft && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📝</span>
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">{wt(WIZARD_COMMON.draftFound, language)}</p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">{wt(WIZARD_COMMON.draftResume, language)}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadDraft}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                        >
                            {wt(WIZARD_COMMON.continue, language)}
                        </button>
                        <button
                            onClick={clearDraft}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            {wt(WIZARD_COMMON.startNew, language)}
                        </button>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Step {currentStep} / 5: {currentStepConfig.name}</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Step Indicators - Clickable */}
            <div className="flex justify-between mb-8 overflow-x-auto pb-2">
                {WIZARD_STEPS.map(step => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const canJump = canJumpToStep(step.id);

                    return (
                        <button
                            key={step.id}
                            onClick={() => handleStepClick(step.id)}
                            disabled={!canJump}
                            title={canJump ? (language === 'vi' ? `Nhấn để đến ${step.name}` : `Click to go to ${step.name}`) : (language === 'vi' ? 'Hoàn thành các step trước để mở khóa' : 'Complete previous steps to unlock')}
                            className={`flex flex-col items-center min-w-[70px] transition-all ${canJump ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isActive
                                    ? 'bg-orange-500 text-white ring-4 ring-orange-200 dark:ring-orange-800'
                                    : isCompleted
                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                        : canJump
                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                    }`}
                            >
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <span className={`text-xs mt-1 text-center ${isActive ? 'font-bold text-orange-600' : 'text-gray-500'}`}>
                                {step.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Current Step Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{currentStepConfig.icon}</span>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Step {currentStep}: {currentStepConfig.name}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {currentStepConfig.description}
                        </p>
                    </div>
                </div>

                {/* Review Step */}
                {currentStepConfig.isReview ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                            <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">{wt(WIZARD_COMMON.reviewReady, language)}</h3>
                            <p className="text-green-700 dark:text-green-300 text-sm">
                                {wt(WIZARD_COMMON.reviewDesc, language)}
                            </p>
                        </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                            {generatedSpec}
                        </pre>
                    </div>
                    <div className={`p-3 rounded-lg border text-sm ${specGateClass}`}>
                        <div className="font-semibold">{specGateLabel}</div>
                        {specGate.missing.length > 0 && (
                            <div className="text-xs mt-1">
                                {wt(WIZARD_COMMON.missingRequired, language)}: {specGate.missing.map(field => field.label).join(', ')}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={!canExport}
                        className={`w-full py-3 rounded-lg font-medium transition-all ${canExport
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {language === 'vi' ? '📣 Xuất Campaign Brief' : '📣 Export Campaign Brief'}
                    </button>
                    </div>
                ) : (
                    /* Form Fields */
                    <div className="space-y-4">
                        {currentStepConfig.fields.map(field => (
                            <div key={field.id}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        value={wizardData[field.id] || ''}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <textarea
                                        value={wizardData[field.id] || ''}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={field.rows || 3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                    />
                                )}

                                {field.type === 'select' && field.options && (
                                    <select
                                        value={wizardData[field.id] || ''}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="">{wt(WIZARD_COMMON.select, language)}</option>
                                        {field.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                )}

                                {/* Field Tip */}
                                {field.tip && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                                        {field.tip}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
                <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${currentStep === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                >
                    ← {wt(WIZARD_COMMON.previous, language)}
                </button>

                {currentStep < WIZARD_STEPS.length ? (
                    <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={currentStepConfig.required && !isStepValid()}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${currentStepConfig.required && !isStepValid()
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                    >
                        {wt(WIZARD_COMMON.next, language)} →
                    </button>
                ) : null}
            </div>
        </div>
    );
}
