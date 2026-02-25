'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { WIZARD_COMMON, t as wt, type Lang } from '@/lib/wizard-i18n';
import { evaluateSpecGate } from '@/lib/spec-gate';

const DRAFT_STORAGE_KEY = 'cvf_research_project_wizard_draft';

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

interface ResearchProjectWizardProps {
    onBack: () => void;
}

function getWizardSteps(lang: Lang): WizardStep[] {
    return [
    {
        id: 1,
        name: 'Research Question',
        icon: '❓',
        description: lang === 'vi' ? 'Định nghĩa câu hỏi nghiên cứu' : 'Define research question',
        required: true,
        fields: [
            { id: 'researchTopic', type: 'text', label: lang === 'vi' ? 'Chủ đề nghiên cứu' : 'Research Topic', placeholder: lang === 'vi' ? 'VD: Impact of AI on Software Development' : 'e.g. Impact of AI on Software Development', required: true, tip: lang === 'vi' ? '💡 Chủ đề rộng của nghiên cứu' : '💡 Broad topic of the research' },
            { id: 'researchQuestion', type: 'textarea', label: 'Research Question (RQ)', placeholder: lang === 'vi' ? 'RQ1: How does AI-assisted coding affect developer productivity?\nRQ2: What are the quality implications?' : 'RQ1: How does AI-assisted coding affect developer productivity?\nRQ2: What are the quality implications?', required: true, rows: 3, tip: lang === 'vi' ? '💡 Câu hỏi cụ thể, có thể đo lường' : '💡 Specific, measurable questions' },
            { id: 'researchType', type: 'select', label: lang === 'vi' ? 'Loại nghiên cứu' : 'Research Type', options: ['Literature Review', 'Empirical Study', 'Survey', 'Case Study', 'Experimental', 'Mixed Methods'], required: true },
            { id: 'hypothesis', type: 'textarea', label: lang === 'vi' ? 'Hypothesis (nếu có)' : 'Hypothesis (if any)', placeholder: lang === 'vi' ? 'VD: AI-assisted coding increases productivity by at least 20% while maintaining code quality' : 'e.g. AI-assisted coding increases productivity by at least 20% while maintaining code quality', required: false, rows: 2 },
            { id: 'significance', type: 'textarea', label: 'Research Significance', placeholder: lang === 'vi' ? 'Why is this research important? What gap does it fill?' : 'Why is this research important? What gap does it fill?', required: true, rows: 2, tip: lang === 'vi' ? '💡 Tầm quan trọng và đóng góp dự kiến' : '💡 Importance and expected contribution' },
        ]
    },
    {
        id: 2,
        name: 'Methodology',
        icon: '🔬',
        description: lang === 'vi' ? 'Phương pháp nghiên cứu' : 'Research methodology',
        required: true,
        fields: [
            { id: 'methodology', type: 'textarea', label: 'Research Methodology', placeholder: lang === 'vi' ? 'VD:\n1. Literature review (100+ papers)\n2. Survey (N=500 developers)\n3. Controlled experiment (50 participants)' : 'e.g.:\n1. Literature review (100+ papers)\n2. Survey (N=500 developers)\n3. Controlled experiment (50 participants)', required: true, rows: 4, tip: lang === 'vi' ? '💡 Chi tiết các bước thực hiện' : '💡 Detailed steps to implement' },
            { id: 'dataCollection', type: 'textarea', label: 'Data Collection Methods', placeholder: lang === 'vi' ? 'VD:\n- Online survey (Qualtrics)\n- Semi-structured interviews\n- Code repository analysis\n- Time tracking' : 'e.g.:\n- Online survey (Qualtrics)\n- Semi-structured interviews\n- Code repository analysis\n- Time tracking', required: true, rows: 3 },
            { id: 'analysisMethod', type: 'textarea', label: 'Data Analysis', placeholder: lang === 'vi' ? 'VD:\n- Quantitative: Statistical analysis (t-test, regression)\n- Qualitative: Thematic analysis' : 'e.g.:\n- Quantitative: Statistical analysis (t-test, regression)\n- Qualitative: Thematic analysis', required: true, rows: 3 },
            { id: 'limitations', type: 'textarea', label: 'Expected Limitations', placeholder: lang === 'vi' ? 'VD:\n- Selection bias\n- Self-reported data\n- Limited sample size' : 'e.g.:\n- Selection bias\n- Self-reported data\n- Limited sample size', required: false, rows: 2 },
        ]
    },
    {
        id: 3,
        name: 'Resources & Timeline',
        icon: '📅',
        description: lang === 'vi' ? 'Nguồn lực và timeline' : 'Resources and timeline',
        required: true,
        fields: [
            { id: 'timeline', type: 'textarea', label: 'Research Timeline', placeholder: lang === 'vi' ? 'VD:\n- Month 1-2: Literature review\n- Month 3-4: Data collection\n- Month 5: Analysis\n- Month 6: Writing' : 'e.g.:\n- Month 1-2: Literature review\n- Month 3-4: Data collection\n- Month 5: Analysis\n- Month 6: Writing', required: true, rows: 4, tip: lang === 'vi' ? '💡 Breakdown theo tháng hoặc phase' : '💡 Breakdown by month or phase' },
            { id: 'resources', type: 'textarea', label: 'Required Resources', placeholder: lang === 'vi' ? 'VD:\n- Access to ACM Digital Library\n- Survey tool license\n- Computing resources for analysis' : 'e.g.:\n- Access to ACM Digital Library\n- Survey tool license\n- Computing resources for analysis', required: true, rows: 3 },
            { id: 'budget', type: 'text', label: 'Estimated Budget', placeholder: lang === 'vi' ? 'VD: $2,000 for participant incentives' : 'e.g. $2,000 for participant incentives', required: false },
            { id: 'collaborators', type: 'text', label: 'Team/Collaborators', placeholder: lang === 'vi' ? 'VD: Prof. X (advisor), Y (co-researcher)' : 'e.g. Prof. X (advisor), Y (co-researcher)', required: false },
            { id: 'ethics', type: 'textarea', label: 'Ethical Considerations', placeholder: lang === 'vi' ? 'VD:\n- IRB approval required\n- Informed consent\n- Data anonymization' : 'e.g.:\n- IRB approval required\n- Informed consent\n- Data anonymization', required: false, rows: 2 },
        ]
    },
    {
        id: 4,
        name: 'Review',
        icon: '✅',
        description: lang === 'vi' ? 'Xem lại và xuất Research Proposal' : 'Review and export Research Proposal',
        required: true,
        isReview: true,
        fields: []
    }
    ];
}

function generateConsolidatedSpec(data: WizardData): string {
    const spec = `
# 🔬 RESEARCH PROJECT PROPOSAL

> Generated by CVF Research Project Wizard
> Topic: ${data.researchTopic || 'N/A'}
> Type: ${data.researchType || 'N/A'}

---

## 1️⃣ RESEARCH QUESTION

### Topic
${data.researchTopic || 'N/A'}

### Research Questions
${data.researchQuestion || 'N/A'}

### Research Type
${data.researchType || 'N/A'}

### Hypothesis
${data.hypothesis || 'Exploratory study (no specific hypothesis)'}

### Significance
${data.significance || 'N/A'}

---

## 2️⃣ METHODOLOGY

### Research Methodology
${data.methodology || 'N/A'}

### Data Collection Methods
${data.dataCollection || 'N/A'}

### Data Analysis
${data.analysisMethod || 'N/A'}

### Expected Limitations
${data.limitations || 'To be identified'}

---

## 3️⃣ RESOURCES & TIMELINE

### Timeline
${data.timeline || 'N/A'}

### Required Resources
${data.resources || 'N/A'}

### Budget
${data.budget || 'To be determined'}

### Team/Collaborators
${data.collaborators || 'Solo researcher'}

### Ethical Considerations
${data.ethics || 'None specified'}

---

## 📋 SUMMARY FOR AI

**RESEARCH QUESTION:**
${data.researchQuestion?.substring(0, 200) || 'N/A'}

**METHODOLOGY:**
${data.methodology?.substring(0, 200) || 'N/A'}

**TIMELINE:**
${data.timeline?.substring(0, 150) || 'N/A'}

---

## 🎯 EXPECTED OUTPUTS

Based on this proposal, AI should generate:
1. **Literature Review Outline** - Key areas to cover
2. **Reading List** - Suggested papers/sources by topic
3. **Survey Instrument** - If survey-based
4. **Interview Guide** - If qualitative
5. **Analysis Plan** - Step-by-step data analysis
6. **Gantt Chart Data** - For timeline visualization
7. **Threat to Validity Analysis** - Potential issues

**REMEMBER:**
- Be rigorous in methodology design
- Ensure research questions are answerable
- Consider both internal and external validity
- Plan for unexpected findings
`;

    return spec.trim();
}

export function ResearchProjectWizard({ onBack }: ResearchProjectWizardProps) {
    const { language } = useLanguage();
    const WIZARD_STEPS = getWizardSteps(language);
    const [currentStep, setCurrentStep] = useState(1);
    const [wizardData, setWizardData] = useState<WizardData>({});
    const [showExport, setShowExport] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);

    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
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
                const parsed = JSON.parse(saved);
                setWizardData(parsed.data || {});
                setCurrentStep(parsed.step || 1);
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
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">🔬 Research Proposal - {wizardData.researchTopic || 'Untitled'}</h2>
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
                                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}>📋 Copy to Clipboard</button>
                        <button onClick={() => {
                            const blob = new Blob([generatedSpec], { type: 'text/markdown' });
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = `research-proposal-${wizardData.researchTopic || 'project'}.md`;
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔬 Research Project Wizard</h1>
                    <p className="text-gray-600 dark:text-gray-400">{language === 'vi' ? 'Tạo Research Proposal qua 4 bước' : 'Create Research Proposal in 4 steps'}</p>
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
                    <span>Step {currentStep} / 4: {currentStepConfig.name}</span><span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-violet-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="flex justify-between mb-8 overflow-x-auto pb-2">
                {WIZARD_STEPS.map(step => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const canJump = canJumpToStep(step.id);
                    return (
                        <button key={step.id} onClick={() => handleStepClick(step.id)} disabled={!canJump}
                            className={`flex flex-col items-center min-w-[80px] transition-all ${canJump ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isActive ? 'bg-purple-600 text-white ring-4 ring-purple-200 dark:ring-purple-800' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <span className={`text-xs mt-1 text-center ${isActive ? 'font-bold text-purple-600' : 'text-gray-500'}`}>{step.name}</span>
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
                            <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">{wt(WIZARD_COMMON.reviewReady, language)}</h3>
                            <p className="text-green-700 dark:text-green-300 text-sm">{wt(WIZARD_COMMON.reviewDesc, language)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">{generatedSpec}</pre>
                        </div>
                        <div className={`p-3 rounded-lg border text-sm ${specGateClass}`}>
                            <div className="font-semibold">{specGateLabel}</div>
                            {specGate.missing.length > 0 && (
                                <div className="text-xs mt-1">
                                    {wt(WIZARD_COMMON.missingRequired, language)}: {specGate.missing.map(field => field.label).join(', ')}
                                </div>
                            )}
                        </div>
                        <button onClick={() => setShowExport(true)} disabled={!canExport} className={`w-full py-3 rounded-lg font-medium transition-all ${canExport
                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}>
                            {language === 'vi' ? '🔬 Xuất Research Proposal' : '🔬 Export Research Proposal'}
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
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
                                )}
                                {field.type === 'textarea' && (
                                    <textarea value={wizardData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} rows={field.rows || 3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none" />
                                )}
                                {field.type === 'select' && field.options && (
                                    <select value={wizardData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500">
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
                        className={`px-6 py-3 rounded-lg font-medium ${currentStepConfig.required && !isStepValid() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                        {wt(WIZARD_COMMON.next, language)}
                    </button>
                )}
            </div>
        </div>
    );
}

