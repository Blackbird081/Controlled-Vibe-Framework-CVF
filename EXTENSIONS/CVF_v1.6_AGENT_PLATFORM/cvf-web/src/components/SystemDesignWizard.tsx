'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { WIZARD_COMMON, t as wt, type Lang } from '@/lib/wizard-i18n';
import { evaluateSpecGate } from '@/lib/spec-gate';

const DRAFT_STORAGE_KEY = 'cvf_system_design_wizard_draft';

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

interface SystemDesignWizardProps {
    onBack: () => void;
}

function getWizardSteps(lang: Lang): WizardStep[] {
    return [
    {
        id: 1,
        name: 'Requirements',
        icon: '📋',
        description: lang === 'vi' ? 'Functional và Non-functional Requirements' : 'Functional and Non-functional Requirements',
        required: true,
        fields: [
            { id: 'systemName', type: 'text', label: lang === 'vi' ? 'Tên hệ thống' : 'System Name', placeholder: lang === 'vi' ? 'VD: URL Shortener Service' : 'e.g. URL Shortener Service', required: true, tip: lang === 'vi' ? '💡 Tên hệ thống cần thiết kế' : '💡 Name of the system to design' },
            { id: 'problemStatement', type: 'textarea', label: 'Problem Statement', placeholder: lang === 'vi' ? 'VD: Build a scalable URL shortening service like bit.ly' : 'e.g. Build a scalable URL shortening service like bit.ly', required: true, rows: 2 },
            { id: 'functionalReqs', type: 'textarea', label: 'Functional Requirements', placeholder: lang === 'vi' ? 'VD:\n- Shorten URL\n- Redirect to original\n- Custom alias\n- Analytics' : 'e.g.:\n- Shorten URL\n- Redirect to original\n- Custom alias\n- Analytics', required: true, rows: 4, tip: lang === 'vi' ? '💡 Các chức năng hệ thống cần có' : '💡 System functionalities needed' },
            { id: 'nonFunctionalReqs', type: 'textarea', label: 'Non-Functional Requirements', placeholder: lang === 'vi' ? 'VD:\n- 99.99% availability\n- <100ms latency\n- 100M DAU\n- 1B URLs/month' : 'e.g.:\n- 99.99% availability\n- <100ms latency\n- 100M DAU\n- 1B URLs/month', required: true, rows: 4, tip: lang === 'vi' ? '💡 Performance, scalability, reliability...' : '💡 Performance, scalability, reliability...' },
        ]
    },
    {
        id: 2,
        name: 'Estimations',
        icon: '🔢',
        description: lang === 'vi' ? 'Capacity estimation và constraints' : 'Capacity estimation and constraints',
        required: true,
        fields: [
            { id: 'traffic', type: 'textarea', label: 'Traffic Estimation', placeholder: lang === 'vi' ? 'VD:\n- 100M DAU\n- Read/Write ratio: 100:1\n- 1B URLs/month → 400 writes/sec\n- 40K reads/sec' : 'e.g.:\n- 100M DAU\n- Read/Write ratio: 100:1\n- 1B URLs/month → 400 writes/sec\n- 40K reads/sec', required: true, rows: 4, tip: lang === 'vi' ? '💡 Ước tính requests per second' : '💡 Estimate requests per second' },
            { id: 'storage', type: 'textarea', label: 'Storage Estimation', placeholder: lang === 'vi' ? 'VD:\n- 1B URLs × 500 bytes = 500GB/month\n- 5 years: 30TB\n- Include metadata, logs' : 'e.g.:\n- 1B URLs × 500 bytes = 500GB/month\n- 5 years: 30TB\n- Include metadata, logs', required: true, rows: 3 },
            { id: 'bandwidth', type: 'text', label: 'Bandwidth', placeholder: lang === 'vi' ? 'VD: 40K × 500 bytes = 20 MB/s read' : 'e.g. 40K × 500 bytes = 20 MB/s read', required: false },
            { id: 'constraints', type: 'textarea', label: 'Key Constraints', placeholder: lang === 'vi' ? 'VD:\n- No duplicate short URLs\n- URL length: 7 chars\n- Expiration support' : 'e.g.:\n- No duplicate short URLs\n- URL length: 7 chars\n- Expiration support', required: false, rows: 2 },
        ]
    },
    {
        id: 3,
        name: 'High-Level Design',
        icon: '🏗️',
        description: lang === 'vi' ? 'Architecture và components' : 'Architecture and components',
        required: true,
        fields: [
            { id: 'components', type: 'textarea', label: 'Core Components', placeholder: lang === 'vi' ? 'VD:\n- API Gateway\n- URL Service\n- Database\n- Cache\n- Analytics Service' : 'e.g.:\n- API Gateway\n- URL Service\n- Database\n- Cache\n- Analytics Service', required: true, rows: 4, tip: lang === 'vi' ? '💡 Các service/component chính' : '💡 Main services/components' },
            { id: 'dataFlow', type: 'textarea', label: 'Data Flow', placeholder: lang === 'vi' ? 'Write: Client → API → URL Service → DB\nRead: Client → API → Cache (miss) → DB' : 'Write: Client → API → URL Service → DB\nRead: Client → API → Cache (miss) → DB', required: true, rows: 3, tip: lang === 'vi' ? '💡 Mô tả flow cho các use cases chính' : '💡 Describe flow for main use cases' },
            { id: 'database', type: 'select', label: 'Database Choice', options: ['SQL (PostgreSQL/MySQL)', 'NoSQL (MongoDB)', 'Key-Value (Redis/DynamoDB)', 'Hybrid', 'Other'], required: true },
            { id: 'databaseReason', type: 'textarea', label: 'Database Justification', placeholder: 'Why this database? Consider: scale, query patterns, consistency...', required: true, rows: 2 },
        ]
    },
    {
        id: 4,
        name: 'Deep Dive',
        icon: '🔍',
        description: lang === 'vi' ? 'Chi tiết các component quan trọng' : 'Deep dive into key components',
        required: true,
        fields: [
            { id: 'keyAlgorithm', type: 'textarea', label: lang === 'vi' ? 'Key Generation Algorithm' : 'Key Generation Algorithm', placeholder: lang === 'vi' ? 'VD:\n- Base62 encoding\n- Counter-based\n- Hash-based (MD5/SHA)\n- KGS (Key Generation Service)' : 'e.g.:\n- Base62 encoding\n- Counter-based\n- Hash-based (MD5/SHA)\n- KGS (Key Generation Service)', required: true, rows: 3, tip: lang === 'vi' ? '💡 Thuật toán chính của hệ thống' : '💡 Core algorithm of the system' },
            { id: 'caching', type: 'textarea', label: 'Caching Strategy', placeholder: lang === 'vi' ? 'VD:\n- Redis for hot URLs\n- LRU eviction\n- 20% cache = 80% traffic\n- TTL: 24h' : 'e.g.:\n- Redis for hot URLs\n- LRU eviction\n- 20% cache = 80% traffic\n- TTL: 24h', required: false, rows: 3 },
            { id: 'scaling', type: 'textarea', label: 'Scaling Strategy', placeholder: lang === 'vi' ? 'VD:\n- Horizontal: Add more app servers\n- DB: Sharding by hash\n- CDN for static content' : 'e.g.:\n- Horizontal: Add more app servers\n- DB: Sharding by hash\n- CDN for static content', required: true, rows: 3, tip: lang === 'vi' ? '💡 Làm sao để scale?' : '💡 How to scale?' },
            { id: 'reliability', type: 'textarea', label: 'Reliability & Fault Tolerance', placeholder: lang === 'vi' ? 'VD:\n- DB replication (master-slave)\n- Load balancer failover\n- Rate limiting\n- Circuit breaker' : 'e.g.:\n- DB replication (master-slave)\n- Load balancer failover\n- Rate limiting\n- Circuit breaker', required: false, rows: 3 },
        ]
    },
    {
        id: 5,
        name: 'Review',
        icon: '✅',
        description: lang === 'vi' ? 'Xem lại và xuất System Design Doc' : 'Review and export System Design Doc',
        required: true,
        isReview: true,
        fields: []
    }
    ];
}

function generateConsolidatedSpec(data: WizardData): string {
    const spec = `
# 🔧 SYSTEM DESIGN DOCUMENT

> Generated by CVF System Design Wizard
> System: ${data.systemName || 'N/A'}

---

## 1️⃣ REQUIREMENTS

### Problem Statement
${data.problemStatement || 'N/A'}

### Functional Requirements
${data.functionalReqs || 'N/A'}

### Non-Functional Requirements
${data.nonFunctionalReqs || 'N/A'}

---

## 2️⃣ CAPACITY ESTIMATION

### Traffic Estimation
${data.traffic || 'N/A'}

### Storage Estimation
${data.storage || 'N/A'}

### Bandwidth
${data.bandwidth || 'To be calculated'}

### Key Constraints
${data.constraints || 'None specified'}

---

## 3️⃣ HIGH-LEVEL DESIGN

### Core Components
${data.components || 'N/A'}

### Data Flow
${data.dataFlow || 'N/A'}

### Database
**Choice:** ${data.database || 'N/A'}

**Justification:**
${data.databaseReason || 'N/A'}

---

## 4️⃣ DEEP DIVE

### Key Algorithm
${data.keyAlgorithm || 'N/A'}

### Caching Strategy
${data.caching || 'No caching specified'}

### Scaling Strategy
${data.scaling || 'N/A'}

### Reliability & Fault Tolerance
${data.reliability || 'To be designed'}

---

## 📋 SUMMARY FOR AI

**SYSTEM:** ${data.systemName}

**PROBLEM:** ${data.problemStatement?.substring(0, 100) || 'N/A'}

**SCALE:**
${data.traffic?.substring(0, 150) || 'N/A'}

**KEY COMPONENTS:**
${data.components?.substring(0, 200) || 'N/A'}

---

## 🎯 EXPECTED OUTPUTS

Based on this design, AI should generate:
1. **Architecture Diagram** - Mermaid/ASCII for components
2. **API Design** - RESTful endpoints, request/response
3. **Database Schema** - Tables, indexes, partitioning
4. **Sequence Diagrams** - For key flows
5. **Trade-off Analysis** - Pros/cons of design decisions
6. **Failure Scenarios** - What if X fails?
7. **Monitoring Plan** - Key metrics to track

**REMEMBER:**
- Start simple, then add complexity
- Justify every component
- Consider CAP theorem trade-offs
- Think about operational concerns
`;

    return spec.trim();
}

export function SystemDesignWizard({ onBack }: SystemDesignWizardProps) {
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
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">🔧 System Design - {wizardData.systemName || 'Untitled'}</h2>
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
                                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}>📋 Copy to Clipboard</button>
                        <button onClick={() => {
                            const blob = new Blob([generatedSpec], { type: 'text/markdown' });
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = `system-design-${wizardData.systemName || 'doc'}.md`;
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔧 System Design Wizard</h1>
                    <p className="text-gray-600 dark:text-gray-400">{language === 'vi' ? 'Tạo System Design Document qua 5 bước' : 'Create System Design Document in 5 steps'}</p>
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
                    <div className="h-full bg-gradient-to-r from-teal-600 to-cyan-600 transition-all duration-300" style={{ width: `${progress}%` }} />
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
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isActive ? 'bg-teal-600 text-white ring-4 ring-teal-200 dark:ring-teal-800' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <span className={`text-xs mt-1 text-center ${isActive ? 'font-bold text-teal-600' : 'text-gray-500'}`}>{step.name}</span>
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
                            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}>
                            {language === 'vi' ? '🔧 Xuất System Design Document' : '🔧 Export System Design Document'}
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
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500" />
                                )}
                                {field.type === 'textarea' && (
                                    <textarea value={wizardData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} rows={field.rows || 3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-none" />
                                )}
                                {field.type === 'select' && field.options && (
                                    <select value={wizardData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500">
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
                        className={`px-6 py-3 rounded-lg font-medium ${currentStepConfig.required && !isStepValid() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700'}`}>
                        {wt(WIZARD_COMMON.next, language)}
                    </button>
                )}
            </div>
        </div>
    );
}

