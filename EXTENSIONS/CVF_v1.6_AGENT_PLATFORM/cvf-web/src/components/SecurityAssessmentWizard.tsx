'use client';

import { useState, useEffect } from 'react';
import { evaluateSpecGate } from '@/lib/spec-gate';

const DRAFT_STORAGE_KEY = 'cvf_security_assessment_wizard_draft';

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

interface SecurityAssessmentWizardProps {
    onBack: () => void;
}

const WIZARD_STEPS: WizardStep[] = [
    {
        id: 1,
        name: 'Scope & Assets',
        icon: '🎯',
        description: 'Xác định phạm vi và tài sản cần bảo vệ',
        required: true,
        fields: [
            { id: 'systemName', type: 'text', label: 'Tên hệ thống', placeholder: 'VD: Customer Portal v2.0', required: true, tip: '💡 Hệ thống hoặc application cần assess' },
            { id: 'systemType', type: 'select', label: 'Loại hệ thống', options: ['Web Application', 'Mobile App', 'API Service', 'Infrastructure', 'Cloud Environment', 'Enterprise System'], required: true },
            { id: 'assets', type: 'textarea', label: 'Critical Assets', placeholder: 'VD:\n- User database (PII)\n- Payment processing\n- Authentication system\n- Admin panel', required: true, rows: 4, tip: '💡 Liệt kê tài sản quan trọng cần bảo vệ' },
            { id: 'boundaries', type: 'textarea', label: 'System Boundaries', placeholder: 'In scope: Web app, API, Database\nOut of scope: Third-party services, CDN', required: true, rows: 3 },
            { id: 'regulations', type: 'text', label: 'Compliance Requirements', placeholder: 'VD: GDPR, PCI-DSS, SOC2, HIPAA', required: false },
        ]
    },
    {
        id: 2,
        name: 'Threat Modeling',
        icon: '⚠️',
        description: 'Xác định các mối đe dọa tiềm ẩn',
        required: true,
        fields: [
            { id: 'threatActors', type: 'textarea', label: 'Threat Actors', placeholder: 'VD:\n- External hackers\n- Malicious insiders\n- Competitors\n- Script kiddies', required: true, rows: 3, tip: '💡 Ai có thể tấn công hệ thống?' },
            { id: 'attackVectors', type: 'textarea', label: 'Attack Vectors', placeholder: 'VD:\n- SQL Injection\n- XSS\n- CSRF\n- Brute force\n- Social engineering', required: true, rows: 4, tip: '💡 Các phương thức tấn công có thể' },
            { id: 'dataFlow', type: 'textarea', label: 'Data Flow Description', placeholder: 'User → Frontend → API → Database\nDescribe trust boundaries and data paths', required: true, rows: 3 },
            { id: 'existingControls', type: 'textarea', label: 'Existing Security Controls', placeholder: 'VD:\n- WAF configured\n- MFA enabled\n- Encryption at rest', required: false, rows: 3 },
        ]
    },
    {
        id: 3,
        name: 'Vulnerability Assessment',
        icon: '🔍',
        description: 'Đánh giá lỗ hổng bảo mật',
        required: true,
        fields: [
            { id: 'knownVulns', type: 'textarea', label: 'Known Vulnerabilities', placeholder: 'VD:\n- Outdated dependencies\n- Weak password policy\n- Missing rate limiting', required: true, rows: 4, tip: '💡 Lỗ hổng đã biết hoặc nghi ngờ' },
            { id: 'techStack', type: 'textarea', label: 'Technology Stack', placeholder: 'VD:\n- Frontend: React 18\n- Backend: Node.js 18\n- Database: PostgreSQL 15\n- Cloud: AWS', required: true, rows: 3 },
            { id: 'authMechanism', type: 'select', label: 'Authentication', options: ['Username/Password', 'OAuth2/OIDC', 'SAML', 'API Keys', 'JWT', 'Multi-factor'], required: true },
            { id: 'dataClassification', type: 'textarea', label: 'Data Classification', placeholder: 'VD:\n- Public: Product catalog\n- Internal: User emails\n- Confidential: Passwords, tokens\n- Restricted: Payment data', required: false, rows: 3 },
        ]
    },
    {
        id: 4,
        name: 'Risk Analysis',
        icon: '📊',
        description: 'Phân tích và đánh giá rủi ro',
        required: true,
        fields: [
            { id: 'riskMatrix', type: 'textarea', label: 'Risk Assessment', placeholder: 'Risk 1: SQL Injection\n  Impact: High, Likelihood: Medium\n\nRisk 2: Session hijacking\n  Impact: High, Likelihood: Low', required: true, rows: 5, tip: '💡 Đánh giá Impact × Likelihood cho mỗi risk' },
            { id: 'riskAppetite', type: 'select', label: 'Risk Appetite', options: ['Conservative (minimize all risks)', 'Moderate (accept controlled risks)', 'Aggressive (focus on critical only)'], required: true },
            { id: 'businessImpact', type: 'textarea', label: 'Business Impact Analysis', placeholder: 'VD:\n- Data breach: Revenue loss $X, reputation damage\n- Service outage: $Y/hour\n- Compliance violation: Fines up to $Z', required: true, rows: 3 },
        ]
    },
    {
        id: 5,
        name: 'Review',
        icon: '✅',
        description: 'Xem lại và xuất Security Assessment',
        required: true,
        isReview: true,
        fields: []
    }
];

function generateConsolidatedSpec(data: WizardData): string {
    const spec = `
# 🔐 SECURITY ASSESSMENT REPORT

> Generated by CVF Security Assessment Wizard
> System: ${data.systemName || 'N/A'}
> Type: ${data.systemType || 'N/A'}

---

## 1️⃣ SCOPE & ASSETS

### System Under Assessment
${data.systemName || 'N/A'} (${data.systemType || 'N/A'})

### Critical Assets
${data.assets || 'N/A'}

### System Boundaries
${data.boundaries || 'N/A'}

### Compliance Requirements
${data.regulations || 'None specified'}

---

## 2️⃣ THREAT MODELING

### Threat Actors
${data.threatActors || 'N/A'}

### Attack Vectors
${data.attackVectors || 'N/A'}

### Data Flow
${data.dataFlow || 'N/A'}

### Existing Security Controls
${data.existingControls || 'None documented'}

---

## 3️⃣ VULNERABILITY ASSESSMENT

### Known Vulnerabilities
${data.knownVulns || 'N/A'}

### Technology Stack
${data.techStack || 'N/A'}

### Authentication Mechanism
${data.authMechanism || 'N/A'}

### Data Classification
${data.dataClassification || 'Not classified'}

---

## 4️⃣ RISK ANALYSIS

### Risk Assessment Matrix
${data.riskMatrix || 'N/A'}

### Risk Appetite
${data.riskAppetite || 'N/A'}

### Business Impact Analysis
${data.businessImpact || 'N/A'}

---

## 📋 SUMMARY FOR AI

**SYSTEM:** ${data.systemName} (${data.systemType})

**CRITICAL ASSETS:**
${data.assets?.substring(0, 200) || 'N/A'}

**TOP THREATS:**
${data.attackVectors?.substring(0, 200) || 'N/A'}

**KNOWN VULNERABILITIES:**
${data.knownVulns?.substring(0, 200) || 'N/A'}

---

## 🎯 EXPECTED OUTPUTS

Based on this assessment, AI should generate:
1. **Threat Model Diagram** - STRIDE-based analysis
2. **Vulnerability Priority List** - CVSS-scored findings
3. **Risk Matrix Visualization** - Impact × Likelihood grid
4. **Remediation Roadmap** - Prioritized by risk score
5. **Security Controls Recommendations** - Specific to tech stack
6. **Compliance Gap Analysis** - If regulations specified
7. **Penetration Test Scope** - Areas to focus testing

**REMEMBER:**
- Use industry standards (OWASP, NIST, CIS)
- Prioritize by risk, not just severity
- Include both quick wins and long-term fixes
- Consider defense-in-depth strategy
`;

    return spec.trim();
}

export function SecurityAssessmentWizard({ onBack }: SecurityAssessmentWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [wizardData, setWizardData] = useState<WizardData>({});
    const [showExport, setShowExport] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);

    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.data && Object.keys(parsed.data).length > 0) {
                    setHasDraft(true);
                }
            } catch (e) { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        if (Object.keys(wizardData).length > 0) {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
                data: wizardData,
                step: currentStep,
                savedAt: new Date().toISOString()
            }));
        }
    }, [wizardData, currentStep]);

    const loadDraft = () => {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setWizardData(parsed.data || {});
                setCurrentStep(parsed.step || 1);
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
            const requiredFields = step.fields.filter(f => f.required);
            const allFilled = requiredFields.every(f => wizardData[f.id]?.trim());
            if (!allFilled) return false;
        }
        return true;
    };

    const handleStepClick = (stepId: number) => {
        if (canJumpToStep(stepId)) setCurrentStep(stepId);
    };

    const handleFieldChange = (fieldId: string, value: string) => {
        setWizardData(prev => ({ ...prev, [fieldId]: value }));
    };

    const isStepValid = () => {
        if (!currentStepConfig.required) return true;
        const requiredFields = currentStepConfig.fields.filter(f => f.required);
        return requiredFields.every(f => wizardData[f.id]?.trim());
    };

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
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            🔐 Security Assessment - {wizardData.systemName || 'Untitled'}
                        </h2>
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
                        <button
                            onClick={() => { navigator.clipboard.writeText(generatedSpec); alert('Đã copy vào clipboard!'); }}
                            disabled={!canExport}
                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${canExport
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >📋 Copy to Clipboard</button>
                        <button
                            onClick={() => {
                                const blob = new Blob([generatedSpec], { type: 'text/markdown' });
                                const a = document.createElement('a');
                                a.href = URL.createObjectURL(blob);
                                a.download = `security-assessment-${wizardData.systemName || 'report'}.md`;
                                a.click();
                            }}
                            disabled={!canExport}
                            className={`flex-1 py-3 rounded-lg font-medium transition-all ${canExport
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >💾 Download .md</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔐 Security Assessment Wizard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Tạo Security Assessment Report qua 5 bước</p>
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
                    <span>Step {currentStep} / 5: {currentStepConfig.name}</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 to-rose-600 transition-all duration-300" style={{ width: `${progress}%` }} />
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
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isActive ? 'bg-red-600 text-white ring-4 ring-red-200 dark:ring-red-800' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <span className={`text-xs mt-1 text-center ${isActive ? 'font-bold text-red-600' : 'text-gray-500'}`}>{step.name}</span>
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
                            <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">🎉 Assessment sẵn sàng!</h3>
                            <p className="text-green-700 dark:text-green-300 text-sm">Review report bên dưới và xuất khi sẵn sàng.</p>
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
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}>
                            🔐 Xuất Security Assessment Report
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
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500" />
                                )}
                                {field.type === 'textarea' && (
                                    <textarea value={wizardData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} rows={field.rows || 3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 resize-none" />
                                )}
                                {field.type === 'select' && field.options && (
                                    <select value={wizardData[field.id] || ''} onChange={e => handleFieldChange(field.id, e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500">
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
                        className={`px-6 py-3 rounded-lg font-medium ${currentStepConfig.required && !isStepValid() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                        Tiếp tục →
                    </button>
                )}
            </div>
        </div>
    );
}
