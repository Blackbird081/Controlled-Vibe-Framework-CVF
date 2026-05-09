'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { WIZARD_COMMON, t as wt, type Lang } from '@/lib/wizard-i18n';
import { evaluateSpecGate } from '@/lib/spec-gate';
import { ProcessingScreen } from './ProcessingScreen';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import {
    buildNonCoderLiveExecutionRequest,
    buildNonCoderReferenceLoop,
    formatNonCoderReferenceLoopMarkdown,
} from '@/lib/non-coder-reference-loop';

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

function getWizardSteps(lang: Lang): WizardStep[] {
    return [
    {
        id: 1,
        name: 'Brand & Goals',
        icon: '🎯',
        description: lang === 'vi' ? 'Xác định brand voice và mục tiêu content' : 'Define brand voice and content goals',
        required: true,
        fields: [
            { id: 'brandName', type: 'text', label: lang === 'vi' ? 'Tên Brand/Project' : 'Brand/Project Name', placeholder: lang === 'vi' ? 'VD: TechStartup Blog' : 'e.g. TechStartup Blog', required: true, tip: lang === 'vi' ? '💡 Brand hoặc project cần chiến lược nội dung' : '💡 Brand or project needing content strategy' },
            { id: 'brandVoice', type: 'textarea', label: 'Brand Voice', placeholder: lang === 'vi' ? 'VD:\n- Tone: Professional but friendly\n- Style: Educational, data-driven\n- Personality: Innovative, trustworthy' : 'e.g.:\n- Tone: Professional but friendly\n- Style: Educational, data-driven\n- Personality: Innovative, trustworthy', required: true, rows: 3, tip: lang === 'vi' ? '💡 Giọng điệu và phong cách của brand' : '💡 Tone and style of the brand' },
            { id: 'contentGoals', type: 'textarea', label: 'Content Goals', placeholder: lang === 'vi' ? 'VD:\n- Increase organic traffic 50%\n- Generate 200 leads/month\n- Establish thought leadership' : 'e.g.:\n- Increase organic traffic 50%\n- Generate 200 leads/month\n- Establish thought leadership', required: true, rows: 3 },
            { id: 'kpis', type: 'textarea', label: 'Content KPIs', placeholder: lang === 'vi' ? 'VD:\n- Pageviews: 100K/month\n- Average time on page: 3+ mins\n- Newsletter signups: 500/month' : 'e.g.:\n- Pageviews: 100K/month\n- Average time on page: 3+ mins\n- Newsletter signups: 500/month', required: false, rows: 3 },
        ]
    },
    {
        id: 2,
        name: 'Audience',
        icon: '👥',
        description: lang === 'vi' ? 'Định nghĩa target audience' : 'Define target audience',
        required: true,
        fields: [
            { id: 'primaryAudience', type: 'textarea', label: 'Primary Audience', placeholder: lang === 'vi' ? 'VD:\n- Tech professionals 25-45\n- Decision makers at SMBs\n- Early adopters interested in AI' : 'e.g.:\n- Tech professionals 25-45\n- Decision makers at SMBs\n- Early adopters interested in AI', required: true, rows: 3, tip: lang === 'vi' ? '💡 Đối tượng chính tiêu thụ nội dung' : '💡 Primary audience consuming this content' },
            { id: 'audiencePains', type: 'textarea', label: 'Audience Pain Points', placeholder: lang === 'vi' ? 'VD:\n- Information overload\n- Lack of practical guides\n- Need for up-to-date trends' : 'e.g.:\n- Information overload\n- Lack of practical guides\n- Need for up-to-date trends', required: true, rows: 3 },
            { id: 'contentPrefs', type: 'textarea', label: 'Content Preferences', placeholder: lang === 'vi' ? 'VD:\n- Long-form tutorials\n- Video walkthroughs\n- Quick tips and checklists' : 'e.g.:\n- Long-form tutorials\n- Video walkthroughs\n- Quick tips and checklists', required: true, rows: 2 },
            { id: 'consumptionHabits', type: 'text', label: 'Consumption Habits', placeholder: lang === 'vi' ? 'VD: Mobile-first, evening readers, prefer visual content' : 'e.g. Mobile-first, evening readers, prefer visual content', required: false },
        ]
    },
    {
        id: 3,
        name: 'Content Pillars',
        icon: '📚',
        description: lang === 'vi' ? 'Xác định các chủ đề nội dung chính' : 'Define main content themes',
        required: true,
        fields: [
            { id: 'pillars', type: 'textarea', label: 'Content Pillars (3-5)', placeholder: lang === 'vi' ? 'VD:\n1. AI & Machine Learning tutorials\n2. Startup growth strategies\n3. Tech career development\n4. Industry trends & analysis' : 'e.g.:\n1. AI & Machine Learning tutorials\n2. Startup growth strategies\n3. Tech career development\n4. Industry trends & analysis', required: true, rows: 4, tip: lang === 'vi' ? '💡 Các chủ đề chính tạo nền tảng content' : '💡 Main themes forming content foundation' },
            { id: 'topicClusters', type: 'textarea', label: 'Topic Clusters', placeholder: 'Pillar 1:\n- Beginner ML guides\n- Python for AI\n- Real-world use cases\n\nPillar 2:\n- Funding strategies\n- GTM playbooks', required: true, rows: 5, tip: lang === 'vi' ? '💡 Chủ đề con thuộc mỗi pillar' : '💡 Sub-topics under each pillar' },
            { id: 'contentMix', type: 'textarea', label: 'Content Mix', placeholder: lang === 'vi' ? 'VD:\n- 40% Educational (how-to, guides)\n- 30% Thought leadership\n- 20% News/trends\n- 10% Entertainment' : 'e.g.:\n- 40% Educational (how-to, guides)\n- 30% Thought leadership\n- 20% News/trends\n- 10% Entertainment', required: false, rows: 3 },
        ]
    },
    {
        id: 4,
        name: 'Channels & Calendar',
        icon: '📅',
        description: lang === 'vi' ? 'Lên kế hoạch distribution' : 'Plan distribution strategy',
        required: true,
        fields: [
            { id: 'channels', type: 'textarea', label: 'Distribution Channels', placeholder: lang === 'vi' ? 'VD:\n- Blog (primary)\n- LinkedIn\n- Twitter/X\n- YouTube\n- Newsletter' : 'e.g.:\n- Blog (primary)\n- LinkedIn\n- Twitter/X\n- YouTube\n- Newsletter', required: true, rows: 4, tip: lang === 'vi' ? '💡 Nơi phân phối nội dung' : '💡 Where to distribute content' },
            { id: 'frequency', type: 'textarea', label: 'Publishing Frequency', placeholder: lang === 'vi' ? 'VD:\n- Blog: 2x/week (Tue, Thu)\n- LinkedIn: Daily\n- Newsletter: Weekly (Fri)\n- YouTube: 1x/month' : 'e.g.:\n- Blog: 2x/week (Tue, Thu)\n- LinkedIn: Daily\n- Newsletter: Weekly (Fri)\n- YouTube: 1x/month', required: true, rows: 3 },
            { id: 'contentTypes', type: 'textarea', label: 'Content Types', placeholder: lang === 'vi' ? 'VD:\n- Long-form articles (2000+ words)\n- Infographics\n- Short videos (5-10 mins)\n- Podcasts\n- Case studies' : 'e.g.:\n- Long-form articles (2000+ words)\n- Infographics\n- Short videos (5-10 mins)\n- Podcasts\n- Case studies', required: true, rows: 4 },
            { id: 'repurposing', type: 'textarea', label: 'Repurposing Strategy', placeholder: lang === 'vi' ? 'VD:\n- Blog → LinkedIn carousel\n- Podcast → Blog post\n- Video → Short clips' : 'e.g.:\n- Blog → LinkedIn carousel\n- Podcast → Blog post\n- Video → Short clips', required: false, rows: 2 },
        ]
    },
    {
        id: 5,
        name: 'Review',
        icon: '✅',
        description: lang === 'vi' ? 'Xem lại và xuất Content Strategy' : 'Review and export Content Strategy',
        required: true,
        isReview: true,
        fields: []
    }
    ];
}

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

function toContentSlug(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'content-strategy';
}

function buildContentStrategyGovernedPacket(data: WizardData) {
    const brandName = data.brandName?.trim() || 'Content Strategy';
    const slug = toContentSlug(brandName);
    const primaryAudience = data.primaryAudience?.trim() || 'content stakeholders';
    const strategySpec = generateConsolidatedSpec(data);

    return buildNonCoderReferenceLoop({
        appName: brandName,
        appType: 'Content Strategy',
        problem: data.contentGoals?.trim() || brandName,
        targetUsers: primaryAudience,
        coreFeatures: data.pillars?.trim() || data.channels?.trim() || 'Content pillars\nDistribution channels\nPublishing plan',
        outOfScope: data.repurposing?.trim() || 'Any production execution outside the governed content strategy packet',
        techPreference: 'Governed content-planning workflow',
        dataStorage: data.channels?.trim() || 'Content planning workspace',
        archType: 'Content strategy packet',
        apiStyle: 'None',
        distribution: data.channels?.trim() || 'Editorial review packet',
        spec: strategySpec,
        title: `${brandName} Governed Content Packet`,
        templateId: 'content_strategy_wizard',
        templateName: 'Content Strategy Wizard',
        intent: `Produce one governed content strategy packet for "${brandName}" for ${primaryAudience}.`,
        riskLevel: 'R1',
        fileScope: [
            `docs/content/${slug}.strategy.md`,
            `docs/content/${slug}.calendar.md`,
            `docs/content/${slug}.freeze.md`,
        ],
        baselineArtifact: `docs/baselines/${slug.toUpperCase().replace(/-/g, '_')}_CONTENT_FREEZE_RECEIPT.md`,
        acceptedOutput: `${brandName} governed content strategy packet`,
        followUps: [
            `Validate the content pillars and distribution plan for "${brandName}" with the content owner`,
            'Open a separate follow-up batch for content production work outside this strategy packet',
        ],
        skillPreflightDeclaration: `NONCODER_REFERENCE_PACKET:content-${slug}`,
        inputs: {
            brandName: data.brandName || '',
            brandVoice: data.brandVoice || '',
            contentGoals: data.contentGoals || '',
            kpis: data.kpis || '',
            primaryAudience: data.primaryAudience || '',
            audiencePains: data.audiencePains || '',
            contentPrefs: data.contentPrefs || '',
            consumptionHabits: data.consumptionHabits || '',
            pillars: data.pillars || '',
            topicClusters: data.topicClusters || '',
            contentMix: data.contentMix || '',
            channels: data.channels || '',
            frequency: data.frequency || '',
            contentTypes: data.contentTypes || '',
            repurposing: data.repurposing || '',
        },
    });
}

export function ContentStrategyWizard({ onBack }: ContentStrategyWizardProps) {
    const { language } = useLanguage();
    const WIZARD_STEPS = getWizardSteps(language);
    const [currentStep, setCurrentStep] = useState(1);
    const [wizardData, setWizardData] = useState<WizardData>({});
    const [showExport, setShowExport] = useState(false);
    const [showGovernedPacket, setShowGovernedPacket] = useState(false);
    const [showLiveRun, setShowLiveRun] = useState(false);
    const [liveRunOutput, setLiveRunOutput] = useState<string | null>(null);
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
    const governedPacket = buildContentStrategyGovernedPacket(wizardData);
    const governedPacketMarkdown = formatNonCoderReferenceLoopMarkdown(governedPacket);
    const governedLiveExecution = buildNonCoderLiveExecutionRequest(governedPacket);

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
                                {wt(WIZARD_COMMON.missingRequired, language)}: {specGate.missing.map(field => field.label).join(', ')}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => { navigator.clipboard.writeText(generatedSpec); alert(wt(WIZARD_COMMON.copiedToClipboard, language)); }}
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

    if (showLiveRun) {
        return (
            <div className="max-w-5xl mx-auto">
                {liveRunOutput ? (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 p-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                                        {language === 'vi' ? 'Live Governed Run đã hoàn tất' : 'Live governed run completed'}
                                    </h2>
                                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                                        {language === 'vi'
                                            ? 'Content strategy packet đã đi qua governed execute path và sẵn sàng cho bước freeze/đối soát.'
                                            : 'The content strategy packet completed the governed execute path and is ready for freeze/audit handoff.'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowLiveRun(false);
                                        setLiveRunOutput(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    {language === 'vi' ? 'Quay lại review' : 'Back to review'}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                {language === 'vi' ? 'Live output' : 'Live output'}
                            </h3>
                            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono max-h-[40vh] overflow-y-auto">
                                {liveRunOutput}
                            </pre>
                        </div>

                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 p-6">
                            <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-3">
                                Freeze receipt
                            </h3>
                            <div className="space-y-2 text-sm text-emerald-900 dark:text-emerald-100">
                                <div><strong>{language === 'vi' ? 'Accepted output' : 'Accepted output'}:</strong> {governedPacket.freezeReceipt.acceptedOutput}</div>
                                <div><strong>{language === 'vi' ? 'Baseline artifact' : 'Baseline artifact'}:</strong> {governedPacket.freezeReceipt.baselineArtifact}</div>
                                <div><strong>{language === 'vi' ? 'Locked scope' : 'Locked scope'}:</strong> {governedPacket.freezeReceipt.lockedScope.join(', ')}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <ProcessingScreen
                        templateName={governedLiveExecution.request.templateName}
                        templateId={governedLiveExecution.request.templateId}
                        inputs={governedLiveExecution.request.inputs}
                        intent={governedLiveExecution.request.intent}
                        executionOverrides={{
                            mode: governedLiveExecution.request.mode,
                            cvfPhase: governedLiveExecution.request.cvfPhase,
                            cvfRiskLevel: governedLiveExecution.request.cvfRiskLevel,
                            skillPreflightDeclaration: governedLiveExecution.request.skillPreflightDeclaration,
                            fileScope: governedLiveExecution.request.fileScope,
                        }}
                        onComplete={(output) => setLiveRunOutput(output)}
                        onCancel={() => {
                            setShowLiveRun(false);
                            setLiveRunOutput(null);
                        }}
                    />
                )}
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
                    <p className="text-gray-600 dark:text-gray-400">
                        {language === 'vi'
                            ? 'Thu thập content brief rồi review governed packet và live path'
                            : 'Capture the content brief, then review the governed packet and live path'}
                    </p>
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
                            <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">🎉 Strategy {wt(WIZARD_COMMON.reviewReady, language)}</h3>
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
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                                        {language === 'vi' ? 'Governed content packet cho non-coder' : 'Governed content packet for non-coders'}
                                    </h3>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                        {language === 'vi'
                                            ? 'Packet này gom canonical phases, approval checkpoints, execution handoff và freeze receipt cho content strategy.'
                                            : 'This packet bundles canonical phases, approval checkpoints, execution handoff, and the freeze receipt for the content strategy.'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowGovernedPacket(prev => !prev)}
                                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                                >
                                    {showGovernedPacket
                                        ? (language === 'vi' ? 'Ẩn packet' : 'Hide packet')
                                        : (language === 'vi' ? 'Xem governed packet' : 'View governed packet')}
                                </button>
                            </div>

                            {showGovernedPacket && (
                                <div className="mt-4 space-y-4">
                                    <WorkflowVisualizer mode="full" currentStep={4} />

                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-gray-900/40 p-4">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                Approval checkpoints
                                            </h4>
                                            <div className="space-y-3">
                                                {governedPacket.approvals.map(approval => (
                                                    <div key={approval.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                                        <div className="text-xs uppercase tracking-wide text-gray-500">
                                                            {approval.phase} → {approval.requiredFor}
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {approval.reason}
                                                        </div>
                                                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                            Owner: {approval.humanOwner}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-gray-900/40 p-4">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                Freeze receipt
                                            </h4>
                                            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                                <div><strong>{language === 'vi' ? 'Accepted output' : 'Accepted output'}:</strong> {governedPacket.freezeReceipt.acceptedOutput}</div>
                                                <div><strong>{language === 'vi' ? 'Baseline artifact' : 'Baseline artifact'}:</strong> {governedPacket.freezeReceipt.baselineArtifact}</div>
                                                <div><strong>{language === 'vi' ? 'Locked scope' : 'Locked scope'}:</strong> {governedPacket.freezeReceipt.lockedScope.join(', ')}</div>
                                                <div><strong>{language === 'vi' ? 'Risk' : 'Risk'}:</strong> {governedPacket.riskLevel}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-gray-900/40 p-4">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                            Execution handoff
                                        </h4>
                                        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                            <div><strong>Mode:</strong> {governedPacket.executionHandoff.mode}</div>
                                            <div><strong>Intent:</strong> {governedPacket.executionHandoff.intent}</div>
                                            <div><strong>File scope:</strong> {governedPacket.executionHandoff.fileScope.join(', ')}</div>
                                            <div><strong>Skill preflight:</strong> {governedPacket.executionHandoff.skillPreflightDeclaration}</div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                                                    {language === 'vi' ? 'Live governed run' : 'Live governed run'}
                                                </h4>
                                                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                                    {language === 'vi'
                                                        ? 'Chạy thật qua Web execute pipeline với content packet đã khóa BUILD phase, risk, file scope và skill preflight.'
                                                        : 'Run the real Web execute pipeline with the content packet pre-bound to BUILD phase, risk, file scope, and skill preflight.'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setLiveRunOutput(null);
                                                    setShowLiveRun(true);
                                                }}
                                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                                            >
                                                {language === 'vi' ? 'Chạy live governed path' : 'Run live governed path'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-gray-900/40 p-4">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                            {language === 'vi' ? 'Packet preview' : 'Packet preview'}
                                        </h4>
                                        <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono max-h-80 overflow-y-auto">
                                            {governedPacketMarkdown}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <button
                                onClick={() => setShowGovernedPacket(prev => !prev)}
                                className="py-3 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                            >
                                {showGovernedPacket
                                    ? (language === 'vi' ? 'Ẩn governed packet' : 'Hide governed packet')
                                    : (language === 'vi' ? 'Governed demo packet' : 'Governed demo packet')}
                            </button>
                            <button
                                onClick={() => {
                                    setLiveRunOutput(null);
                                    setShowLiveRun(true);
                                }}
                                className="py-3 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                            >
                                {language === 'vi' ? 'Chạy live governed path' : 'Run live governed path'}
                            </button>
                            <button onClick={() => setShowExport(true)} disabled={!canExport} className={`py-3 rounded-lg font-medium transition-all ${canExport
                                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}>
                                {language === 'vi' ? '✍️ Xuất Content Strategy' : '✍️ Export Content Strategy'}
                            </button>
                        </div>
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
                        className={`px-6 py-3 rounded-lg font-medium ${currentStepConfig.required && !isStepValid() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                        {wt(WIZARD_COMMON.next, language)}
                    </button>
                )}
            </div>
        </div>
    );
}
