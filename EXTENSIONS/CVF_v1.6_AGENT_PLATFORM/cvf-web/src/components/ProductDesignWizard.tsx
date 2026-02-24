'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { WIZARD_COMMON, t as wt, type Lang } from '@/lib/wizard-i18n';
import { evaluateSpecGate } from '@/lib/spec-gate';

const DRAFT_STORAGE_KEY = 'cvf_product_design_wizard_draft';

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

interface ProductDesignWizardProps {
    onBack: () => void;
}

function getWizardSteps(lang: Lang): WizardStep[] {
    return [
    {
        id: 1,
        name: 'Problem Definition',
        icon: '🎯',
        description: lang === 'vi' ? 'Xác định vấn đề và context' : 'Define problem and context',
        required: true,
        fields: [
            { id: 'productName', type: 'text', label: lang === 'vi' ? 'Tên sản phẩm' : 'Product Name', placeholder: lang === 'vi' ? 'VD: TaskFlow Mobile' : 'e.g. TaskFlow Mobile', required: true, tip: lang === 'vi' ? '💡 Tên ngắn gọn, dễ nhớ' : '💡 Short, memorable name' },
            { id: 'productType', type: 'select', label: lang === 'vi' ? 'Loại sản phẩm' : 'Product Type', options: ['Mobile App', 'Web App', 'Desktop App', 'SaaS Platform', 'Physical Product', 'Service'], required: true, tip: lang === 'vi' ? '💡 Chọn loại phù hợp nhất' : '💡 Choose the most suitable type' },
            { id: 'problemStatement', type: 'textarea', label: lang === 'vi' ? 'Vấn đề cần giải quyết' : 'Problem Statement', placeholder: lang === 'vi' ? 'Người dùng gặp khó khăn gì? Tại sao existing solutions không đủ?' : 'What difficulties do users face? Why are existing solutions insufficient?', required: true, rows: 4, tip: lang === 'vi' ? '💡 Mô tả rõ PAIN POINT thực sự' : '💡 Clearly describe the real PAIN POINT' },
            { id: 'currentSolution', type: 'textarea', label: lang === 'vi' ? 'Giải pháp hiện tại' : 'Current Solution', placeholder: lang === 'vi' ? 'Người dùng đang làm gì để giải quyết vấn đề này?' : 'What are users doing now to solve this problem?', required: true, rows: 2, tip: lang === 'vi' ? '💡 Hiểu competitor/alternatives' : '💡 Understand competitor/alternatives' },
            { id: 'opportunity', type: 'textarea', label: lang === 'vi' ? 'Cơ hội' : 'Opportunity', placeholder: lang === 'vi' ? 'Tại sao bây giờ là thời điểm tốt? Market gap là gì?' : 'Why is now the right time? What is the market gap?', required: false, rows: 2 },
        ]
    },
    {
        id: 2,
        name: 'User Research',
        icon: '👥',
        description: lang === 'vi' ? 'Hiểu sâu về người dùng mục tiêu' : 'Deep understanding of target users',
        required: true,
        fields: [
            { id: 'targetUser', type: 'textarea', label: 'Target User', placeholder: lang === 'vi' ? 'VD: Marketing managers at SMBs, 25-40, tech-savvy...' : 'e.g. Marketing managers at SMBs, 25-40, tech-savvy...', required: true, rows: 2, tip: lang === 'vi' ? '💡 Cụ thể về demographics & psychographics' : '💡 Be specific about demographics & psychographics' },
            { id: 'userPersonas', type: 'textarea', label: 'User Personas (2-3)', placeholder: '1. Primary: ...\n2. Secondary: ...\n3. Edge case: ...', required: true, rows: 4, tip: lang === 'vi' ? '💡 Mô tả name, role, goals, frustrations' : '💡 Describe name, role, goals, frustrations' },
            { id: 'userJourney', type: 'textarea', label: lang === 'vi' ? 'User Journey hiện tại' : 'Current User Journey', placeholder: lang === 'vi' ? 'Các bước user thực hiện để hoàn thành task (before your product)' : 'Steps users take to complete the task (before your product)', required: true, rows: 3, tip: lang === 'vi' ? '💡 Identify pain points trong journey' : '💡 Identify pain points in the journey' },
            { id: 'needsWants', type: 'textarea', label: 'Needs vs Wants', placeholder: 'NEEDS (must have): ...\nWANTS (nice to have): ...', required: true, rows: 3 },
        ]
    },
    {
        id: 3,
        name: 'Solution Design',
        icon: '💡',
        description: lang === 'vi' ? 'Thiết kế giải pháp' : 'Design the solution',
        required: true,
        fields: [
            { id: 'valueProposition', type: 'textarea', label: 'Value Proposition', placeholder: lang === 'vi' ? 'Sản phẩm giúp [target user] đạt được [goal] bằng cách [how]' : 'Product helps [target user] achieve [goal] by [how]', required: true, rows: 2, tip: lang === 'vi' ? '💡 Một câu súc tích, memorable' : '💡 One concise, memorable sentence' },
            { id: 'coreFeatures', type: 'textarea', label: 'Core Features (3-5)', placeholder: '1. Feature A: ...\n2. Feature B: ...\n3. Feature C: ...', required: true, rows: 4, tip: lang === 'vi' ? '💡 Chỉ những feature QUAN TRỌNG NHẤT' : '💡 Only the MOST IMPORTANT features' },
            { id: 'differentiation', type: 'textarea', label: 'Differentiation', placeholder: lang === 'vi' ? 'Điều gì làm sản phẩm này khác biệt so với alternatives?' : 'What makes this product different from alternatives?', required: true, rows: 2, tip: lang === 'vi' ? '💡 Unique selling points' : '💡 Unique selling points' },
            { id: 'outOfScope', type: 'textarea', label: 'Out of Scope (v1)', placeholder: lang === 'vi' ? 'Những gì KHÔNG làm trong phiên bản đầu' : 'What will NOT be done in the first version', required: false, rows: 2 },
        ]
    },
    {
        id: 4,
        name: 'UX Design',
        icon: '🎨',
        description: lang === 'vi' ? 'Thiết kế trải nghiệm người dùng' : 'User experience design',
        required: true,
        fields: [
            { id: 'infoArchitecture', type: 'textarea', label: 'Information Architecture', placeholder: 'Main sections/screens:\n- Home\n- Feature A\n- Settings\n...', required: true, rows: 4, tip: lang === 'vi' ? '💡 Cấu trúc navigation chính' : '💡 Main navigation structure' },
            { id: 'keyFlows', type: 'textarea', label: 'Key User Flows (2-3)', placeholder: 'Flow 1: Onboarding\n  Step 1 → Step 2 → ...\n\nFlow 2: Core Action\n  ...', required: true, rows: 5, tip: lang === 'vi' ? '💡 Các flow quan trọng nhất' : '💡 Most important flows' },
            { id: 'interactions', type: 'textarea', label: 'Key Interactions', placeholder: lang === 'vi' ? 'VD: Swipe to delete, Long press to edit, Pull to refresh...' : 'e.g. Swipe to delete, Long press to edit, Pull to refresh...', required: false, rows: 2 },
            { id: 'accessibility', type: 'select', label: 'Accessibility Level', options: ['Basic (contrast, font size)', 'WCAG AA', 'WCAG AAA'], required: false },
        ]
    },
    {
        id: 5,
        name: 'Visual Design',
        icon: '🖼️',
        description: lang === 'vi' ? 'Thiết kế giao diện (Optional)' : 'Visual design (Optional)',
        required: false,
        fields: [
            { id: 'designStyle', type: 'select', label: 'Design Style', options: ['Modern Minimal', 'Bold & Colorful', 'Corporate Professional', 'Playful & Fun', 'Dark Mode First', 'Custom'], required: false },
            { id: 'colorScheme', type: 'textarea', label: 'Color Scheme', placeholder: 'Primary: #...\nSecondary: #...\nAccent: #...', required: false, rows: 2, tip: lang === 'vi' ? '💡 Hoặc mô tả mood: warm, cool, vibrant...' : '💡 Or describe mood: warm, cool, vibrant...' },
            { id: 'typography', type: 'text', label: 'Typography', placeholder: lang === 'vi' ? 'VD: Inter for body, Poppins for headings' : 'e.g. Inter for body, Poppins for headings', required: false },
            { id: 'brandGuidelines', type: 'textarea', label: 'Brand Guidelines (if any)', placeholder: 'Logo usage, do/don\'t, existing brand assets...', required: false, rows: 2 },
        ]
    },
    {
        id: 6,
        name: 'Review',
        icon: '✅',
        description: lang === 'vi' ? 'Xem lại và xuất spec' : 'Review and export spec',
        required: true,
        isReview: true,
        fields: []
    }
    ];
}

function generateConsolidatedSpec(data: WizardData): string {
    const spec = `
# 🎨 PRODUCT DESIGN SPECIFICATION

> Generated by CVF Product Design Wizard
> Product: ${data.productName || 'N/A'}
> Type: ${data.productType || 'N/A'}

---

## 1️⃣ PROBLEM DEFINITION

### Problem Statement
${data.problemStatement || 'N/A'}

### Current Solution (Alternatives)
${data.currentSolution || 'N/A'}

### Opportunity
${data.opportunity || 'Not specified'}

---

## 2️⃣ USER RESEARCH

### Target User
${data.targetUser || 'N/A'}

### User Personas
${data.userPersonas || 'N/A'}

### Current User Journey
${data.userJourney || 'N/A'}

### Needs vs Wants
${data.needsWants || 'N/A'}

---

## 3️⃣ SOLUTION DESIGN

### Value Proposition
> ${data.valueProposition || 'N/A'}

### Core Features
${data.coreFeatures || 'N/A'}

### Differentiation
${data.differentiation || 'N/A'}

### Out of Scope (v1)
${data.outOfScope || 'Not specified'}

---

## 4️⃣ UX DESIGN

### Information Architecture
${data.infoArchitecture || 'N/A'}

### Key User Flows
${data.keyFlows || 'N/A'}

### Key Interactions
${data.interactions || 'Standard platform conventions'}

### Accessibility
${data.accessibility || 'Basic'}

---

## 5️⃣ VISUAL DESIGN

### Design Style
${data.designStyle || 'Modern Minimal'}

### Color Scheme
${data.colorScheme || 'To be determined by designer'}

### Typography
${data.typography || 'System defaults'}

### Brand Guidelines
${data.brandGuidelines || 'No existing guidelines'}

---

## 📋 SUMMARY FOR AI

**INTENT:**
Design a ${data.productType || 'product'} called "${data.productName}" that solves: ${data.problemStatement?.substring(0, 200) || 'N/A'}...

**TARGET USER:** ${data.targetUser?.substring(0, 150) || 'N/A'}

**CORE FEATURES:**
${data.coreFeatures || 'N/A'}

**KEY FLOWS:**
${data.keyFlows || 'N/A'}

---

## 🎯 EXPECTED OUTPUTS

Based on this spec, AI should generate:
1. **Product Requirements Document (PRD)** - Detailed feature specs
2. **Wireframe Descriptions** - Low-fidelity screen layouts
3. **User Flow Diagrams** - Mermaid or text-based flows
4. **Design System Brief** - Colors, typography, components
5. **Prototype Plan** - What to build for testing

**REMEMBER:** You are the designer. Make aesthetic decisions, don't ask user to choose colors or layouts!
`;

    return spec.trim();
}

export function ProductDesignWizard({ onBack }: ProductDesignWizardProps) {
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
            } catch {
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
            } catch {
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
                            🎨 Product Design Spec - {wizardData.productName || 'Untitled'}
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
                                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
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
                                a.download = `product-design-${wizardData.productName || 'spec'}.md`;
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
                        🎨 Product Design Wizard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {language === 'vi' ? 'Tạo Product Design Spec qua 6 bước' : 'Create Product Design Spec in 6 steps'}
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
                    <span>Step {currentStep} / 6: {currentStepConfig.name}</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
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
                            className={`flex flex-col items-center min-w-[60px] transition-all ${canJump ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isActive
                                    ? 'bg-pink-500 text-white ring-4 ring-pink-200 dark:ring-pink-800'
                                    : isCompleted
                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                        : canJump
                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                    }`}
                            >
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <span className={`text-xs mt-1 text-center ${isActive ? 'font-bold text-pink-600' : 'text-gray-500'}`}>
                                {step.name}
                            </span>
                            {!step.required && (
                                <span className="text-[10px] text-gray-400">({language === 'vi' ? 'optional' : 'optional'})</span>
                            )}
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
                            <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">{wt(WIZARD_COMMON.allStepsComplete, language)}</h3>
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
                                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {language === 'vi' ? '🎨 Xuất Product Design Spec' : '🎨 Export Product Design Spec'}
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
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <textarea
                                        value={wizardData[field.id] || ''}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={field.rows || 3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                                    />
                                )}

                                {field.type === 'select' && field.options && (
                                    <select
                                        value={wizardData[field.id] || ''}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                    {wt(WIZARD_COMMON.previous, language)}
                </button>

                {currentStep < WIZARD_STEPS.length ? (
                    <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={currentStepConfig.required && !isStepValid()}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${currentStepConfig.required && !isStepValid()
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-pink-500 text-white hover:bg-pink-600'
                            }`}
                    >
                        {currentStepConfig.required ? wt(WIZARD_COMMON.next, language) : wt(WIZARD_COMMON.skipContinue, language)}
                    </button>
                ) : null}
            </div>
        </div>
    );
}

