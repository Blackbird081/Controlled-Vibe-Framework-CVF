'use client';

import { useState, useEffect } from 'react';
import { evaluateSpecGate } from '@/lib/spec-gate';

const DRAFT_STORAGE_KEY = 'cvf_content_strategy_wizard_draft';

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

interface ContentStrategyWizardProps {
    onBack: () => void;
}

const WIZARD_STEPS: WizardStep[] = [
    {
        id: 1,
        name: 'Brand & Goals',
        icon: '🎯',
        description: 'Xác định brand voice và mục tiêu content',
        required: true,
        fields: [
            { id: 'brandName', type: 'text', label: 'Tên Brand/Project', placeholder: 'VD: TechStartup Blog', required: true, tip: '💡 Brand hoặc project cần chiến lược nội dung' },
            { id: 'brandVoice', type: 'textarea', label: 'Brand Voice', placeholder: 'VD:\n- Tone: Professional but friendly\n- Style: Educational, data-driven\n- Personality: Innovative, trustworthy', required: true, rows: 3, tip: '💡 Giọng điệu và phong cách của brand' },
            { id: 'contentGoals', type: 'textarea', label: 'Content Goals', placeholder: 'VD:\n- Increase organic traffic 50%\n- Generate 200 leads/month\n- Establish thought leadership', required: true, rows: 3 },
            { id: 'kpis', type: 'textarea', label: 'Content KPIs', placeholder: 'VD:\n- Pageviews: 100K/month\n- Average time on page: 3+ mins\n- Newsletter signups: 500/month', required: false, rows: 3 },
        ]
    },
    {
        id: 2,
        name: 'Audience',
        icon: '👥',
        description: 'Định nghĩa target audience',
        required: true,
        fields: [
            { id: 'primaryAudience', type: 'textarea', label: 'Primary Audience', placeholder: 'VD:\n- Tech professionals 25-45\n- Decision makers at SMBs\n- Early adopters interested in AI', required: true, rows: 3, tip: '💡 Đối tượng chính tiêu thụ nội dung' },
            { id: 'audiencePains', type: 'textarea', label: 'Audience Pain Points', placeholder: 'VD:\n- Information overload\n- Lack of practical guides\n- Need for up-to-date trends', required: true, rows: 3 },
            { id: 'contentPrefs', type: 'textarea', label: 'Content Preferences', placeholder: 'VD:\n- Long-form tutorials\n- Video walkthroughs\n- Quick tips and checklists', required: true, rows: 2 },
            { id: 'consumptionHabits', type: 'text', label: 'Consumption Habits', placeholder: 'VD: Mobile-first, evening readers, prefer visual content', required: false },
        ]
    },
    {
        id: 3,
        name: 'Content Pillars',
        icon: '📚',
        description: 'Xác định các chủ đề nội dung chính',
        required: true,
        fields: [
            { id: 'pillars', type: 'textarea', label: 'Content Pillars (3-5)', placeholder: 'VD:\n1. AI & Machine Learning tutorials\n2. Startup growth strategies\n3. Tech career development\n4. Industry trends & analysis', required: true, rows: 4, tip: '💡 Các chủ đề chính tạo nền tảng content' },
            { id: 'topicClusters', type: 'textarea', label: 'Topic Clusters', placeholder: 'Pillar 1:\n- Beginner ML guides\n- Python for AI\n- Real-world use cases\n\nPillar 2:\n- Funding strategies\n- GTM playbooks', required: true, rows: 5, tip: '💡 Chủ đề con thuộc mỗi pillar' },
            { id: 'contentMix', type: 'textarea', label: 'Content Mix', placeholder: 'VD:\n- 40% Educational (how-to, guides)\n- 30% Thought leadership\n- 20% News/trends\n- 10% Entertainment', required: false, rows: 3 },
        ]
    },
    {
        id: 4,
        name: 'Channels & Calendar',
        icon: '📅',
        description: 'Lên kế hoạch distribution',
        required: true,
        fields: [
            { id: 'channels', type: 'textarea', label: 'Distribution Channels', placeholder: 'VD:\n- Blog (primary)\n- LinkedIn\n- Twitter/X\n- YouTube\n- Newsletter', required: true, rows: 4, tip: '💡 Nơi phân phối nội dung' },
            { id: 'frequency', type: 'textarea', label: 'Publishing Frequency', placeholder: 'VD:\n- Blog: 2x/week (Tue, Thu)\n- LinkedIn: Daily\n- Newsletter: Weekly (Fri)\n- YouTube: 1x/month', required: true, rows: 3 },
            { id: 'contentTypes', type: 'textarea', label: 'Content Types', placeholder: 'VD:\n- Long-form articles (2000+ words)\n- Infographics\n- Short videos (5-10 mins)\n- Podcasts\n- Case studies', required: true, rows: 4 },
            { id: 'repurposing', type: 'textarea', label: 'Repurposing Strategy', placeholder: 'VD:\n- Blog → LinkedIn carousel\n- Podcast → Blog post\n- Video → Short clips', required: false, rows: 2 },
        ]
    },
    {
        id: 5,
        name: 'Review',
        icon: '✅',
        description: 'Xem lại và xuất Content Strategy',
        required: true,
        isReview: true,
        fields: []
    }
];

function generateConsolidatedSpec(data: WizardData): string {
    const spec = `
# ✍️ CONTENT STRATEGY DOCUMENT

> Generated by CVF Content Strategy Wizard
> Brand: ${data.brandName || 'N/A'}

---

## 1️⃣ BRAND & GOALS

### Brand Voice
${data.brandVoice || 'N/A'}

### Content Goals
${data.contentGoals || 'N/A'}

### KPIs
${data.kpis || 'To be defined'}

---

## 2️⃣ AUDIENCE

### Primary Audience
${data.primaryAudience || 'N/A'}

### Pain Points
${data.audiencePains || 'N/A'}

### Content Preferences
${data.contentPrefs || 'N/A'}

### Consumption Habits
${data.consumptionHabits || 'To be researched'}

---

## 3️⃣ CONTENT PILLARS

### Main Pillars
${data.pillars || 'N/A'}

### Topic Clusters
${data.topicClusters || 'N/A'}

### Content Mix
${data.contentMix || 'Balanced mix'}

---

## 4️⃣ CHANNELS & CALENDAR

### Distribution Channels
${data.channels || 'N/A'}

### Publishing Frequency
${data.frequency || 'N/A'}

### Content Types
${data.contentTypes || 'N/A'}

### Repurposing Strategy
${data.repurposing || 'To be defined'}

---

## 📋 SUMMARY FOR AI

**BRAND:** ${data.brandName}
**VOICE:** ${data.brandVoice?.substring(0, 100) || 'N/A'}

**AUDIENCE:** ${data.primaryAudience?.substring(0, 100) || 'N/A'}

**PILLARS:**
${data.pillars || 'N/A'}

---

## 🎯 EXPECTED OUTPUTS

Based on this strategy, AI should generate:
1. **Content Calendar Template** - 3-month editorial calendar
2. **Topic Ideas** - 20+ article/post ideas per pillar
3. **SEO Keywords** - Target keywords per topic cluster
4. **Content Templates** - Outlines for each content type
5. **Distribution Checklist** - Per-channel optimization
6. **Measurement Dashboard** - KPI tracking setup

**REMEMBER:**
- Consistency > Volume
- Quality over quantity
- Audience value first
- Data-driven optimization
`;

    return spec.trim();
}

export function ContentStrategyWizard({ onBack }: ContentStrategyWizardProps) {
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
            } catch (e) { /* ignore */ }
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
            } catch (e) { /* ignore */ }
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
        ? 'Spec Gate: PASS — Đủ input để xuất'
        : specGate.status === 'CLARIFY'
            ? 'Spec Gate: CLARIFY — Thiếu input bắt buộc'
            : 'Spec Gate: FAIL — Không đủ dữ liệu để tạo spec';
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
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">✍️ Content Strategy - {wizardData.brandName || 'Untitled'}</h2>
                        <button onClick={() => setShowExport(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">✕</button>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[60vh] overflow-y-auto mb-4">
                        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">{generatedSpec}</pre>
                    </div>
                    <div className={`mb-4 p-3 rounded-lg border text-sm ${specGateClass}`}>
                        <div className="font-semibold">{specGateLabel}</div>
                        {specGate.missing.length > 0 && (
                            <div className="text-xs mt-1">
                                Thiếu input bắt buộc: {specGate.missing.map(field => field.label).join(', ')}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => { navigator.clipboard.writeText(generatedSpec); alert('Đã copy vào clipboard!'); }}
                            disabled={!canExport}
                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${canExport
                                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}>📋 Copy to Clipboard</button>
                        <button onClick={() => {
                            const blob = new Blob([generatedSpec], { type: 'text/markdown' });
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = `content-strategy-${wizardData.brandName || 'doc'}.md`;
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">✍️ Content Strategy Wizard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Tạo Content Strategy Document qua 5 bước</p>
                </div>
            </div>

            {hasDraft && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📝</span>
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">Bạn có bản nháp chưa hoàn thành</p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">Tiếp tục từ lần trước hoặc bắt đầu mới</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={loadDraft} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium">Tiếp tục</button>
                        <button onClick={clearDraft} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Bắt đầu mới</button>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Step {currentStep} / 5: {currentStepConfig.name}</span><span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-600 to-green-600 transition-all duration-300" style={{ width: `${progress}%` }} />
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
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isActive ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 dark:ring-emerald-800' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <span className={`text-xs mt-1 text-center ${isActive ? 'font-bold text-emerald-600' : 'text-gray-500'}`}>{step.name}</span>
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
                            <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">🎉 Strategy sẵn sàng!</h3>
                            <p className="text-green-700 dark:text-green-300 text-sm">Review strategy bên dưới và xuất khi sẵn sàng.</p>
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
                            ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}>
                            ✍️ Xuất Content Strategy
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
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500" />
                                )}
                                {field.type === 'textarea' && (
                                    <textarea value={wizardData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} rows={field.rows || 3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 resize-none" />
                                )}
                                {field.type === 'select' && field.options && (
                                    <select value={wizardData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500">
                                        <option value="">-- Chọn --</option>
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
                    ← Trước
                </button>
                {currentStep < WIZARD_STEPS.length && (
                    <button onClick={() => setCurrentStep(currentStep + 1)} disabled={currentStepConfig.required && !isStepValid()}
                        className={`px-6 py-3 rounded-lg font-medium ${currentStepConfig.required && !isStepValid() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                        Tiếp tục →
                    </button>
                )}
            </div>
        </div>
    );
}
