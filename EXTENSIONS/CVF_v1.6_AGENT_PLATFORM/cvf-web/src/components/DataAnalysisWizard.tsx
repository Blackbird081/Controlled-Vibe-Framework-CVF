'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { WIZARD_COMMON, t as wt, type Lang } from '@/lib/wizard-i18n';
import { evaluateSpecGate } from '@/lib/spec-gate';

const DRAFT_STORAGE_KEY = 'cvf_data_analysis_wizard_draft';

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

interface DataAnalysisWizardProps {
    onBack: () => void;
}

function getWizardSteps(lang: Lang): WizardStep[] {
    return [
    {
        id: 1,
        name: 'Problem & Data',
        icon: '🎯',
        description: lang === 'vi' ? 'Định nghĩa vấn đề và nguồn dữ liệu' : 'Define problem and data sources',
        required: true,
        fields: [
            { id: 'analysisGoal', type: 'text', label: 'Analysis Goal', placeholder: lang === 'vi' ? 'VD: Identify factors affecting customer churn' : 'e.g. Identify factors affecting customer churn', required: true, tip: lang === 'vi' ? '💡 Mục tiêu chính của phân tích' : '💡 Main goal of the analysis' },
            { id: 'businessQuestion', type: 'textarea', label: 'Business Questions', placeholder: lang === 'vi' ? 'VD:\n- What drives customer churn?\n- Which segments are most at risk?\n- What early warning signs exist?' : 'e.g.:\n- What drives customer churn?\n- Which segments are most at risk?\n- What early warning signs exist?', required: true, rows: 3, tip: lang === 'vi' ? '💡 Câu hỏi kinh doanh cần trả lời' : '💡 Business questions to answer' },
            { id: 'dataSource', type: 'textarea', label: 'Data Sources', placeholder: lang === 'vi' ? 'VD:\n- Customer database (PostgreSQL)\n- Transaction logs (CSV)\n- Support tickets (API)\n- Survey responses (Excel)' : 'e.g.:\n- Customer database (PostgreSQL)\n- Transaction logs (CSV)\n- Support tickets (API)\n- Survey responses (Excel)', required: true, rows: 3 },
            { id: 'dataVolume', type: 'text', label: 'Data Volume', placeholder: lang === 'vi' ? 'VD: 500K records, 50 columns, 2 years history' : 'e.g. 500K records, 50 columns, 2 years history', required: false },
            { id: 'analysisType', type: 'select', label: 'Analysis Type', options: ['Descriptive', 'Diagnostic', 'Predictive', 'Prescriptive', 'Exploratory', 'Confirmatory'], required: true },
        ]
    },
    {
        id: 2,
        name: 'Data Understanding',
        icon: '🔍',
        description: lang === 'vi' ? 'Mô tả và khám phá dữ liệu' : 'Describe and explore data',
        required: true,
        fields: [
            { id: 'keyVariables', type: 'textarea', label: 'Key Variables', placeholder: lang === 'vi' ? 'VD:\n- churn (target): binary\n- tenure: months as customer\n- monthly_charges: numeric\n- contract_type: categorical' : 'e.g.:\n- churn (target): binary\n- tenure: months as customer\n- monthly_charges: numeric\n- contract_type: categorical', required: true, rows: 4, tip: lang === 'vi' ? '💡 Biến quan trọng trong phân tích' : '💡 Important variables in the analysis' },
            { id: 'dataQuality', type: 'textarea', label: 'Data Quality Issues', placeholder: lang === 'vi' ? 'VD:\n- Missing values: 15% in income field\n- Outliers: extreme values in charges\n- Inconsistencies: duplicate records' : 'e.g.:\n- Missing values: 15% in income field\n- Outliers: extreme values in charges\n- Inconsistencies: duplicate records', required: true, rows: 3 },
            { id: 'assumptions', type: 'textarea', label: 'Assumptions', placeholder: lang === 'vi' ? 'VD:\n- Data is representative of population\n- No significant data collection bias\n- Variables are correctly defined' : 'e.g.:\n- Data is representative of population\n- No significant data collection bias\n- Variables are correctly defined', required: false, rows: 2 },
        ]
    },
    {
        id: 3,
        name: 'Methodology',
        icon: '📊',
        description: lang === 'vi' ? 'Phương pháp phân tích' : 'Analysis methodology',
        required: true,
        fields: [
            { id: 'methodology', type: 'textarea', label: 'Analysis Methodology', placeholder: lang === 'vi' ? 'VD:\n1. EDA: Univariate and bivariate analysis\n2. Feature engineering\n3. Model: Logistic regression + Random Forest\n4. Validation: 80/20 split, cross-validation' : 'e.g.:\n1. EDA: Univariate and bivariate analysis\n2. Feature engineering\n3. Model: Logistic regression + Random Forest\n4. Validation: 80/20 split, cross-validation', required: true, rows: 4, tip: lang === 'vi' ? '💡 Các bước phân tích' : '💡 Analysis steps' },
            { id: 'tools', type: 'textarea', label: 'Tools & Libraries', placeholder: lang === 'vi' ? 'VD:\n- Python (pandas, scikit-learn)\n- SQL for data extraction\n- Tableau for visualization\n- Jupyter for documentation' : 'e.g.:\n- Python (pandas, scikit-learn)\n- SQL for data extraction\n- Tableau for visualization\n- Jupyter for documentation', required: true, rows: 3 },
            { id: 'metrics', type: 'textarea', label: 'Success Metrics', placeholder: lang === 'vi' ? 'VD:\n- Model accuracy > 85%\n- AUC-ROC > 0.8\n- Identify top 5 churn drivers\n- Actionable recommendations' : 'e.g.:\n- Model accuracy > 85%\n- AUC-ROC > 0.8\n- Identify top 5 churn drivers\n- Actionable recommendations', required: true, rows: 3 },
        ]
    },
    {
        id: 4,
        name: 'Deliverables',
        icon: '📈',
        description: lang === 'vi' ? 'Kết quả đầu ra mong đợi' : 'Expected deliverables',
        required: true,
        fields: [
            { id: 'deliverables', type: 'textarea', label: 'Expected Deliverables', placeholder: lang === 'vi' ? 'VD:\n- Executive summary (1 page)\n- Full analysis report\n- Interactive dashboard\n- Prediction API/model\n- Recommendations deck' : 'e.g.:\n- Executive summary (1 page)\n- Full analysis report\n- Interactive dashboard\n- Prediction API/model\n- Recommendations deck', required: true, rows: 4, tip: lang === 'vi' ? '💡 Sản phẩm đầu ra' : '💡 Output deliverables' },
            { id: 'audience', type: 'text', label: 'Target Audience', placeholder: lang === 'vi' ? 'VD: C-suite, Marketing team, Data science team' : 'e.g. C-suite, Marketing team, Data science team', required: true },
            { id: 'timeline', type: 'text', label: 'Timeline', placeholder: lang === 'vi' ? 'VD: 2 weeks for full analysis' : 'e.g. 2 weeks for full analysis', required: false },
            { id: 'constraints', type: 'textarea', label: 'Constraints & Limitations', placeholder: lang === 'vi' ? 'VD:\n- Limited historical data (2 years)\n- No access to competitor data\n- GDPR compliance required' : 'e.g.:\n- Limited historical data (2 years)\n- No access to competitor data\n- GDPR compliance required', required: false, rows: 2 },
        ]
    },
    {
        id: 5,
        name: 'Review',
        icon: '✅',
        description: lang === 'vi' ? 'Xem lại và xuất Analysis Plan' : 'Review and export Analysis Plan',
        required: true,
        isReview: true,
        fields: []
    }
    ];
}

function generateConsolidatedSpec(data: WizardData): string {
    const spec = `
# 📊 DATA ANALYSIS PLAN

> Generated by CVF Data Analysis Wizard
> Goal: ${data.analysisGoal || 'N/A'}
> Type: ${data.analysisType || 'N/A'}

---

## 1️⃣ PROBLEM & DATA

### Analysis Goal
${data.analysisGoal || 'N/A'}

### Business Questions
${data.businessQuestion || 'N/A'}

### Data Sources
${data.dataSource || 'N/A'}

### Data Volume
${data.dataVolume || 'To be determined'}

### Analysis Type
${data.analysisType || 'N/A'}

---

## 2️⃣ DATA UNDERSTANDING

### Key Variables
${data.keyVariables || 'N/A'}

### Data Quality Issues
${data.dataQuality || 'N/A'}

### Assumptions
${data.assumptions || 'Standard assumptions'}

---

## 3️⃣ METHODOLOGY

### Analysis Approach
${data.methodology || 'N/A'}

### Tools & Libraries
${data.tools || 'N/A'}

### Success Metrics
${data.metrics || 'N/A'}

---

## 4️⃣ DELIVERABLES

### Expected Outputs
${data.deliverables || 'N/A'}

### Target Audience
${data.audience || 'N/A'}

### Timeline
${data.timeline || 'To be planned'}

### Constraints & Limitations
${data.constraints || 'None specified'}

---

## 📋 SUMMARY FOR AI

**GOAL:** ${data.analysisGoal}
**TYPE:** ${data.analysisType}

**DATA:** ${data.dataSource?.substring(0, 150) || 'N/A'}

**METHODOLOGY:** ${data.methodology?.substring(0, 150) || 'N/A'}

---

## 🎯 EXPECTED OUTPUTS

Based on this plan, AI should generate:
1. **Data Profiling Report** - Summary statistics, distributions
2. **EDA Code** - Python/SQL for exploration
3. **Visualization Recommendations** - Charts per question
4. **Feature Engineering Ideas** - Based on domain
5. **Model Selection Guide** - Appropriate algorithms
6. **Analysis Template** - Jupyter notebook structure
7. **Presentation Outline** - For stakeholders

**REMEMBER:**
- Start with simple visualizations
- Check data quality first
- Document all assumptions
- Make insights actionable
`;

    return spec.trim();
}

export function DataAnalysisWizard({ onBack }: DataAnalysisWizardProps) {
    const { language } = useLanguage();
    const WIZARD_STEPS = getWizardSteps(language);
    const [currentStep, setCurrentStep] = useState(1);
    const [wizardData, setWizardData] = useState<WizardData>({});
    const [showExport, setShowExport] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.data && Object.keys(parsed.data).length > 0) setHasDraft(true);
            } catch { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        if (Object.keys(wizardData).length > 0) {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ data: wizardData, step: currentStep, savedAt: new Date().toISOString() }));
        }
    }, [wizardData, currentStep]);

    const loadDraft = () => {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
            try {
                const p = JSON.parse(saved);
                setWizardData(p.data || {});
                setCurrentStep(p.step || 1);
                setHasDraft(false);
            } catch { /* ignore */ }
        }
    };

    const clearDraft = () => {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setWizardData({});
        setCurrentStep(1);
        setHasDraft(false);
    };

    const currentStepConfig = WIZARD_STEPS.find(s => s.id === currentStep)!;

    const canJumpToStep = (targetStep: number): boolean => {
        if (targetStep <= currentStep) return true;
        for (let i = 1; i < targetStep; i++) {
            const step = WIZARD_STEPS.find(s => s.id === i);
            if (!step || !step.required) continue;
            if (!step.fields.filter(f => f.required).every(f => wizardData[f.id]?.trim())) return false;
        }
        return true;
    };

    const handleStepClick = (stepId: number) => { if (canJumpToStep(stepId)) setCurrentStep(stepId); };
    const handleFieldChange = (fieldId: string, value: string) => { setWizardData(prev => ({ ...prev, [fieldId]: value })); };
    const isStepValid = () => !currentStepConfig.required || currentStepConfig.fields.filter(f => f.required).every(f => wizardData[f.id]?.trim());

    const progress = Math.round((currentStep / WIZARD_STEPS.length) * 100);
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
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">📊 Analysis Plan - {wizardData.analysisGoal || 'Untitled'}</h2>
                        <button onClick={() => setShowExport(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">✕</button>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[60vh] overflow-y-auto mb-4">
                        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">{generatedSpec}</pre>
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
                        <button onClick={() => { navigator.clipboard.writeText(generatedSpec); alert(wt(WIZARD_COMMON.copiedToClipboard, language)); }}
                            disabled={!canExport}
                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${canExport
                                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:from-amber-700 hover:to-yellow-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}>📋 Copy to Clipboard</button>
                        <button onClick={() => {
                            const blob = new Blob([generatedSpec], { type: 'text/markdown' });
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = `analysis-plan-${wizardData.analysisGoal?.replace(/\s+/g, '-') || 'doc'}.md`;
                            a.click();
                        }} disabled={!canExport} className={`flex-1 py-3 rounded-lg font-medium transition-all ${canExport
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}>💾 Download .md</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Data Analysis Wizard</h1>
                    <p className="text-gray-600 dark:text-gray-400">{language === 'vi' ? 'Tạo Data Analysis Plan qua 5 bước' : 'Create Data Analysis Plan in 5 steps'}</p>
                </div>
            </div>

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
                        <button onClick={loadDraft} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium">{wt(WIZARD_COMMON.continue, language)}</button>
                        <button onClick={clearDraft} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">{wt(WIZARD_COMMON.startNew, language)}</button>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Step {currentStep} / 5: {currentStepConfig.name}</span><span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="flex justify-between mb-8 overflow-x-auto pb-2">
                {WIZARD_STEPS.map(step => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const canJump = canJumpToStep(step.id);
                    return (
                        <button key={step.id} onClick={() => handleStepClick(step.id)} disabled={!canJump}
                            className={`flex flex-col items-center min-w-[70px] transition-all ${canJump ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isActive ? 'bg-amber-600 text-white ring-4 ring-amber-200 dark:ring-amber-800' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <span className={`text-xs mt-1 text-center ${isActive ? 'font-bold text-amber-600' : 'text-gray-500'}`}>{step.name}</span>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{currentStepConfig.icon}</span>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Step {currentStep}: {currentStepConfig.name}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{currentStepConfig.description}</p>
                    </div>
                </div>

                {currentStepConfig.isReview ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                            <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">🎉 Analysis Plan {wt(WIZARD_COMMON.reviewReady, language)}</h3>
                            <p className="text-green-700 dark:text-green-300 text-sm">{wt(WIZARD_COMMON.reviewDesc, language)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">{generatedSpec}</pre>
                        </div>
                        <div className={`p-3 rounded-lg border text-sm ${specGateClass}`}>
                            <div className="font-semibold">{specGateLabel}</div>
                            {specGate.missing.length > 0 && (
                                <div className="text-xs mt-1">
                                    Thiếu input bắt buộc: {specGate.missing.map(field => field.label).join(', ')}
                                </div>
                            )}
                        </div>
                        <button onClick={() => setShowExport(true)} disabled={!canExport} className={`w-full py-3 rounded-lg font-medium transition-all ${canExport
                            ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:from-amber-700 hover:to-yellow-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}>
                            {language === 'vi' ? '📊 Xuất Data Analysis Plan' : '📊 Export Data Analysis Plan'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {currentStepConfig.fields.map(field => (
                            <div key={field.id}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.type === 'text' && (
                                    <input type="text" value={wizardData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500" />
                                )}
                                {field.type === 'textarea' && (
                                    <textarea value={wizardData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} rows={field.rows || 3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 resize-none" />
                                )}
                                {field.type === 'select' && field.options && (
                                    <select value={wizardData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500">
                                        <option value="">{wt(WIZARD_COMMON.select, language)}</option>
                                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                )}
                                {field.tip && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">{field.tip}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-6">
                <button onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 1}
                    className={`px-6 py-3 rounded-lg font-medium ${currentStep === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                    {wt(WIZARD_COMMON.previous, language)}
                </button>
                {currentStep < WIZARD_STEPS.length && (
                    <button onClick={() => setCurrentStep(currentStep + 1)} disabled={currentStepConfig.required && !isStepValid()}
                        className={`px-6 py-3 rounded-lg font-medium ${currentStepConfig.required && !isStepValid() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                        {wt(WIZARD_COMMON.next, language)}
                    </button>
                )}
            </div>
        </div>
    );
}

