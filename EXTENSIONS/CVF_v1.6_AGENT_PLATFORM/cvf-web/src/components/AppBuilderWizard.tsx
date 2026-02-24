'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { WIZARD_COMMON, t as wt, type Lang } from '@/lib/wizard-i18n';
import { SpecExport } from './SpecExport';
import { Template } from '@/types';

// Local storage key for draft
const DRAFT_STORAGE_KEY = 'cvf_wizard_draft';

// Field type for wizard steps
interface WizardField {
    id: string;
    type: 'text' | 'textarea' | 'select';
    label: string;
    placeholder?: string;
    required: boolean;
    rows?: number;
    options?: string[];
    showFor?: string[]; // Only show for specific appType values
    tip?: string; // Helpful tip for the field
}

// Step type
interface WizardStep {
    id: number;
    name: string;
    icon: string;
    description: string;
    required: boolean;
    fields: WizardField[];
    skipCondition?: string;
    skipValue?: string;
    dynamicTitle?: boolean;
    isReview?: boolean;
}

// Define the 8 steps for App Builder Wizard
function getWizardSteps(lang: Lang): WizardStep[] {
    return [
    {
        id: 1,
        name: 'Requirements',
        icon: '📋',
        description: lang === 'vi' ? 'Định nghĩa yêu cầu và scope của app' : 'Define requirements and scope of the app',
        required: true,
        fields: [
            { id: 'appName', type: 'text', label: lang === 'vi' ? 'Tên App' : 'App Name', placeholder: lang === 'vi' ? 'VD: TaskFlow' : 'e.g. TaskFlow', required: true, tip: lang === 'vi' ? '💡 Tên ngắn gọn, dễ nhớ' : '💡 Short, memorable name' },
            { id: 'appType', type: 'select', label: lang === 'vi' ? 'Loại App' : 'App Type', options: ['Desktop App', 'CLI Tool', 'Web App', 'Mobile App', 'API Service'], required: true, tip: lang === 'vi' ? '💡 Desktop nếu cần GUI, CLI nếu dùng terminal' : '💡 Desktop if GUI needed, CLI for terminal' },
            { id: 'problem', type: 'textarea', label: lang === 'vi' ? 'Vấn đề cần giải quyết' : 'Problem Statement', placeholder: lang === 'vi' ? 'Mô tả vấn đề user đang gặp phải...' : 'Describe the problem users are facing...', required: true, rows: 3, tip: lang === 'vi' ? '💡 Mô tả rõ PAIN POINT của người dùng' : '💡 Clearly describe user PAIN POINTS' },
            { id: 'targetUsers', type: 'text', label: 'Target Users', placeholder: lang === 'vi' ? 'Ai sẽ dùng app này?' : 'Who will use this app?', required: true, tip: lang === 'vi' ? '💡 Cụ thể hơn = tốt hơn' : '💡 More specific = better' },
            { id: 'coreFeatures', type: 'textarea', label: 'Core Features (3-5)', placeholder: '1. Feature A\n2. Feature B\n3. Feature C', required: true, rows: 4, tip: lang === 'vi' ? '💡 Chỉ 3-5 features QUAN TRỌNG NHẤT' : '💡 Only 3-5 MOST IMPORTANT features' },
            { id: 'outOfScope', type: 'textarea', label: lang === 'vi' ? 'Out of Scope (Không làm)' : 'Out of Scope', placeholder: lang === 'vi' ? 'Những gì KHÔNG làm trong v1' : 'What will NOT be included in v1', required: false, rows: 2, tip: lang === 'vi' ? '💡 Giúp AI hiểu ranh giới dự án' : '💡 Helps AI understand project boundaries' },
        ]
    },
    {
        id: 2,
        name: 'Tech Stack',
        icon: '🔧',
        description: lang === 'vi' ? 'Chọn công nghệ phù hợp' : 'Choose the right technology',
        required: true,
        fields: [
            { id: 'platforms', type: 'text', label: 'Target Platforms', placeholder: 'Windows, macOS, Linux...', required: true },
            { id: 'performancePriority', type: 'select', label: 'Priority Performance', options: ['Low', 'Medium', 'High', 'Critical'], required: true },
            { id: 'devSpeed', type: 'select', label: lang === 'vi' ? 'Tốc độ phát triển' : 'Development Speed', options: ['Nhanh (1-2 tuần)', 'Trung bình (1 tháng)', 'Dài hạn'], required: false },
            { id: 'techPreference', type: 'text', label: lang === 'vi' ? 'Tech Preference (nếu có)' : 'Tech Preference (if any)', placeholder: lang === 'vi' ? 'VD: Tauri, Electron, Python...' : 'e.g. Tauri, Electron, Python...', required: false },
            { id: 'dataStorage', type: 'select', label: 'Data Storage', options: ['Không cần', 'Local Files (JSON/YAML)', 'Local Database (SQLite)', 'Cloud Database'], required: true },
            { id: 'offlineRequired', type: 'select', label: lang === 'vi' ? 'Cần Offline?' : 'Offline Required?', options: ['Bắt buộc', 'Nice to have', 'Không cần'], required: false },
        ]
    },
    {
        id: 3,
        name: 'Architecture',
        icon: '🏗️',
        description: lang === 'vi' ? 'Thiết kế kiến trúc hệ thống' : 'Design system architecture',
        required: true,
        fields: [
            { id: 'archType', type: 'select', label: 'Architecture Type', options: ['Monolithic', 'Layered (UI/Logic/Data)', 'Component-based', 'Event-driven'], required: true },
            { id: 'stateManagement', type: 'select', label: 'State Management', options: ['Simple (local state)', 'Medium (global state)', 'Complex (state machine)'], required: false },
            { id: 'components', type: 'textarea', label: 'Main Components', placeholder: lang === 'vi' ? 'VD: UI Layer, Business Logic, Data Access...' : 'e.g. UI Layer, Business Logic, Data Access...', required: false, rows: 3 },
            { id: 'dataFlow', type: 'textarea', label: 'Data Flow', placeholder: lang === 'vi' ? 'VD: User → UI → Logic → DB → UI' : 'e.g. User → UI → Logic → DB → UI', required: false, rows: 2 },
        ]
    },
    {
        id: 4,
        name: 'Database',
        icon: '🗄️',
        description: lang === 'vi' ? 'Thiết kế database schema (nếu cần)' : 'Design database schema (if needed)',
        required: false,
        skipCondition: 'dataStorage',
        skipValue: 'Không cần',
        fields: [
            { id: 'dbType', type: 'select', label: 'Database Type', options: ['SQLite', 'PostgreSQL', 'MySQL', 'MongoDB', 'JSON Files'], required: true },
            { id: 'entities', type: 'textarea', label: 'Main Entities', placeholder: lang === 'vi' ? 'VD: User, Task, Category, Tag' : 'e.g. User, Task, Category, Tag', required: true, rows: 2 },
            { id: 'relationships', type: 'textarea', label: 'Relationships', placeholder: lang === 'vi' ? 'VD: User has many Tasks\nTask belongs to Category' : 'e.g. User has many Tasks\nTask belongs to Category', required: false, rows: 3 },
            { id: 'keyFields', type: 'textarea', label: 'Key Fields per Entity', placeholder: lang === 'vi' ? 'VD: Task: title, description, due_date, status' : 'e.g. Task: title, description, due_date, status', required: false, rows: 3 },
        ]
    },
    {
        id: 5,
        name: 'API Design',
        icon: '🔌',
        description: lang === 'vi' ? 'Thiết kế API/Commands (nếu cần)' : 'Design API/Commands (if needed)',
        required: false,
        fields: [
            { id: 'apiStyle', type: 'select', label: 'API Style', options: ['REST API', 'GraphQL', 'IPC Commands (Desktop)', 'CLI Commands', 'None'], required: true },
            { id: 'resources', type: 'textarea', label: 'Resources/Endpoints', placeholder: lang === 'vi' ? 'VD: /tasks, /users, /categories' : 'e.g. /tasks, /users, /categories', required: false, rows: 2 },
            { id: 'operations', type: 'textarea', label: 'Operations per Resource', placeholder: lang === 'vi' ? 'VD: Tasks: CRUD + complete, archive' : 'e.g. Tasks: CRUD + complete, archive', required: false, rows: 3 },
            { id: 'auth', type: 'select', label: 'Authentication', options: ['None', 'JWT Bearer', 'API Key', 'OAuth2'], required: false },
        ]
    },
    {
        id: 6,
        name: 'App Spec',
        icon: '🖥️',
        description: 'Desktop/CLI specific specs',
        required: true,
        dynamicTitle: true, // Title changes based on appType
        fields: [
            // Desktop fields
            { id: 'windowType', type: 'select', label: 'Window Type', options: ['Single Window', 'Multi-Window', 'Frameless'], required: false, showFor: ['Desktop App'] },
            { id: 'defaultSize', type: 'text', label: 'Default Size', placeholder: 'VD: 1200x800', required: false, showFor: ['Desktop App'] },
            { id: 'menuBar', type: 'textarea', label: 'Menu Bar', placeholder: 'VD: File (New, Save, Exit), Edit, Help', required: false, rows: 2, showFor: ['Desktop App'] },
            { id: 'trayIcon', type: 'select', label: 'System Tray', options: ['Không', 'Có - Basic', 'Có - With Quick Actions'], required: false, showFor: ['Desktop App'] },
            { id: 'shortcuts', type: 'textarea', label: 'Keyboard Shortcuts', placeholder: 'VD: Ctrl+N new, Ctrl+S save', required: false, rows: 2, showFor: ['Desktop App'] },
            // CLI fields  
            { id: 'cliCommands', type: 'textarea', label: 'CLI Commands', placeholder: 'VD: add, list, done, delete, search', required: false, rows: 3, showFor: ['CLI Tool'] },
            { id: 'outputFormats', type: 'text', label: 'Output Formats', placeholder: 'VD: text, json, table', required: false, showFor: ['CLI Tool'] },
            // Common
            { id: 'uiStyle', type: 'select', label: 'UI Style', options: ['Modern Dark', 'Clean Light', 'Minimal', 'No UI (CLI only)'], required: false },
            { id: 'nativeFeatures', type: 'text', label: 'Native Features', placeholder: lang === 'vi' ? 'VD: Notifications, File dialogs, Clipboard' : 'e.g. Notifications, File dialogs, Clipboard', required: false },
        ]
    },
    {
        id: 7,
        name: 'Deployment',
        icon: '📦',
        description: lang === 'vi' ? 'Packaging và distribution' : 'Packaging and distribution',
        required: true,
        fields: [
            { id: 'distribution', type: 'select', label: 'Distribution Method', options: ['GitHub Releases', 'Website Download', 'Package Manager (npm/pip)', 'Internal Only'], required: true },
            { id: 'autoUpdate', type: 'select', label: 'Auto-Update', options: ['Không', 'Có - Hỏi user', 'Có - Silent'], required: false },
            { id: 'signing', type: 'select', label: 'Code Signing', options: ['Không', 'Windows Only', 'macOS Only', 'Cả hai'], required: false },
            { id: 'installer', type: 'select', label: 'Installer Type', options: ['Portable (no install)', 'MSI/PKG', 'NSIS', 'AppImage'], required: false },
        ]
    },
    {
        id: 8,
        name: 'Review',
        icon: '✅',
        description: lang === 'vi' ? 'Xem lại và xuất spec' : 'Review and export spec',
        required: true,
        isReview: true,
        fields: [] // No fields, just review
    }
]; }

interface WizardData {
    [key: string]: string;
}

interface AppBuilderWizardProps {
    onBack: () => void;
}

// Generate consolidated spec from wizard data
function generateConsolidatedSpec(data: WizardData): string {
    const spec = `
# 📦 COMPLETE APP SPECIFICATION

> Generated by CVF App Builder Wizard
> This is a consolidated specification covering all aspects of the application.

---

## 1️⃣ REQUIREMENTS

**App Name:** ${data.appName || 'N/A'}
**App Type:** ${data.appType || 'N/A'}
**Target Users:** ${data.targetUsers || 'N/A'}

### Problem Statement
${data.problem || 'N/A'}

### Core Features
${data.coreFeatures || 'N/A'}

### Out of Scope
${data.outOfScope || 'Not specified'}

---

## 2️⃣ TECH STACK

**Target Platforms:** ${data.platforms || 'N/A'}
**Performance Priority:** ${data.performancePriority || 'N/A'}
**Development Speed:** ${data.devSpeed || 'N/A'}
**Tech Preference:** ${data.techPreference || 'AI decides'}
**Data Storage:** ${data.dataStorage || 'N/A'}
**Offline Required:** ${data.offlineRequired || 'N/A'}

---

## 3️⃣ ARCHITECTURE

**Architecture Type:** ${data.archType || 'N/A'}
**State Management:** ${data.stateManagement || 'N/A'}

### Main Components
${data.components || 'AI will design'}

### Data Flow
${data.dataFlow || 'AI will design'}

---

${data.dataStorage !== 'Không cần' ? `
## 4️⃣ DATABASE SCHEMA

**Database Type:** ${data.dbType || 'N/A'}

### Entities
${data.entities || 'N/A'}

### Relationships
${data.relationships || 'AI will design'}

### Key Fields
${data.keyFields || 'AI will design'}

---
` : ''}

${data.apiStyle && data.apiStyle !== 'None' ? `
## 5️⃣ API DESIGN

**API Style:** ${data.apiStyle || 'N/A'}
**Authentication:** ${data.auth || 'None'}

### Resources/Endpoints
${data.resources || 'AI will design'}

### Operations
${data.operations || 'AI will design'}

---
` : ''}

## 6️⃣ APP SPECIFICATION

${data.appType === 'Desktop App' ? `
### Desktop App Config
**Window Type:** ${data.windowType || 'Single Window'}
**Default Size:** ${data.defaultSize || '1200x800'}
**System Tray:** ${data.trayIcon || 'No'}

### Menu Bar
${data.menuBar || 'Standard menus'}

### Keyboard Shortcuts
${data.shortcuts || 'Standard shortcuts'}
` : ''}

${data.appType === 'CLI Tool' ? `
### CLI Tool Config

### Commands
${data.cliCommands || 'AI will design'}

**Output Formats:** ${data.outputFormats || 'text, json'}
` : ''}

**UI Style:** ${data.uiStyle || 'Modern Dark'}
**Native Features:** ${data.nativeFeatures || 'Standard'}

---

## 7️⃣ DEPLOYMENT

**Distribution:** ${data.distribution || 'N/A'}
**Auto-Update:** ${data.autoUpdate || 'No'}
**Code Signing:** ${data.signing || 'No'}
**Installer Type:** ${data.installer || 'Portable'}

---

## 📋 AI INSTRUCTIONS

Based on this complete specification, please:

1. **Phase A - Discovery:** Confirm you understand all requirements correctly.

2. **Phase B - Design:**
   - Finalize tech stack (if not specified, YOU choose)
   - Create architecture diagram
   - Design database schema (if needed)
   - Design API/commands (if needed)

3. **Phase C - Build:**
   - Build all components
   - Create complete source code
   - Create configuration files

4. **Phase D - Review:**
   - Summarize what was built
   - Provide setup & run instructions
   - Include packaging/distribution guide

**REMEMBER:** You are the EXECUTOR. Make decisions, don't ask user to choose!
`;

    return spec.trim();
}

export function AppBuilderWizard({ onBack }: AppBuilderWizardProps) {
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

    // Check if step should be skipped
    const shouldSkipStep = (step: typeof WIZARD_STEPS[0]) => {
        if (!step.skipCondition) return false;
        return wizardData[step.skipCondition] === step.skipValue;
    };

    // Check if can jump to a specific step (only if previous steps are complete)
    const canJumpToStep = (targetStep: number): boolean => {
        if (targetStep <= currentStep) return true; // Can always go back
        // Check if all previous required steps are complete
        for (let i = 1; i < targetStep; i++) {
            const step = WIZARD_STEPS.find(s => s.id === i);
            if (!step) continue;
            if (shouldSkipStep(step)) continue;
            // Check required fields
            const requiredFields = step.fields.filter(f => f.required);
            const allFilled = requiredFields.every(f => wizardData[f.id]?.trim());
            if (!allFilled) return false;
        }
        return true;
    };

    // Handle step click (jump to step)
    const handleStepClick = (stepId: number) => {
        if (canJumpToStep(stepId) && !shouldSkipStep(WIZARD_STEPS.find(s => s.id === stepId)!)) {
            setCurrentStep(stepId);
        }
    };

    // Get next valid step
    const getNextStep = (from: number): number => {
        for (let i = from + 1; i <= 8; i++) {
            const step = WIZARD_STEPS.find(s => s.id === i);
            if (step && !shouldSkipStep(step)) return i;
        }
        return 8; // Final step
    };

    // Get previous valid step
    const getPrevStep = (from: number): number => {
        for (let i = from - 1; i >= 1; i--) {
            const step = WIZARD_STEPS.find(s => s.id === i);
            if (step && !shouldSkipStep(step)) return i;
        }
        return 1;
    };

    // Handle field change
    const handleFieldChange = (fieldId: string, value: string) => {
        setWizardData(prev => ({ ...prev, [fieldId]: value }));
    };

    // Validate current step
    const isStepValid = () => {
        if (currentStepConfig.isReview) return true;
        return currentStepConfig.fields
            .filter(f => f.required)
            .every(f => wizardData[f.id]?.trim());
    };

    // Get fields to show based on appType
    const getVisibleFields = () => {
        return currentStepConfig.fields.filter(field => {
            if (!field.showFor) return true;
            return field.showFor.includes(wizardData.appType);
        });
    };

    // Calculate progress
    const progress = Math.round((currentStep / 8) * 100);

    // Create a fake template for SpecExport
    const createWizardTemplate = (): Template => ({
        id: 'app_builder_wizard',
        name: 'App Builder Wizard',
        icon: '🧙',
        description: 'Complete App Specification',
        category: 'development',
        fields: [],
        intentPattern: generateConsolidatedSpec(wizardData),
        outputExpected: ['Complete Working App', 'Setup Instructions', 'User Guide'],
    });

    if (showExport) {
        return (
            <div className="max-w-4xl mx-auto">
                <SpecExport
                    template={createWizardTemplate()}
                    values={{}}
                    onClose={() => setShowExport(false)}
                />
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
                    title="Back to home"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        🧙 App Builder Wizard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Create a complete spec in 8 steps
                    </p>
                </div>
            </div>

            {/* Draft Banner */}
            {hasDraft && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📝</span>
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">You have an unfinished draft</p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">Continue from where you left off or start fresh</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadDraft}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                        >
                            Continue
                        </button>
                        <button
                            onClick={clearDraft}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Start New
                        </button>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Step {currentStep} / 8: {currentStepConfig.name}</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Step Indicators - Clickable */}
            <div className="flex justify-between mb-8 overflow-x-auto pb-2">
                {WIZARD_STEPS.map(step => {
                    const isSkipped = shouldSkipStep(step);
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const canJump = canJumpToStep(step.id) && !isSkipped;

                    return (
                        <button
                            key={step.id}
                            onClick={() => handleStepClick(step.id)}
                            disabled={!canJump}
                            title={isSkipped ? 'Step skipped' : canJump ? `Go to ${step.name}` : 'Complete previous steps to unlock'}
                            className={`flex flex-col items-center min-w-[60px] transition-all ${isSkipped ? 'opacity-30 cursor-not-allowed' : canJump ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isActive
                                    ? 'bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-800'
                                    : isCompleted
                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                        : canJump
                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                    }`}
                            >
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <span className={`text-xs mt-1 text-center ${isActive ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
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
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                                {generateConsolidatedSpec(wizardData)}
                            </pre>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-700 dark:text-green-300">
                                {language === 'vi' ? '✅ Spec đã sẵn sàng! Nhấn "Xuất Spec" để copy và paste vào AI Agent.' : '✅ Spec is ready! Click "Export Spec" to copy and paste into AI Agent.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Form Fields */
                    <div className="space-y-4">
                        {getVisibleFields().map(field => (
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
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <textarea
                                        value={wizardData[field.id] || ''}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={field.rows || 3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                )}

                                {field.type === 'select' && field.options && (
                                    <select
                                        value={wizardData[field.id] || ''}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    onClick={() => setCurrentStep(getPrevStep(currentStep))}
                    disabled={currentStep === 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${currentStep === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                >
                    ← Back
                </button>

                <div className="flex gap-3">
                    {currentStepConfig.isReview ? (
                        <button
                            onClick={() => setShowExport(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
                        >
                            {wt(WIZARD_COMMON.exportSpec, language)}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentStep(getNextStep(currentStep))}
                            disabled={!isStepValid()}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${isStepValid()
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>

            {/* Skip Info */}
            {currentStepConfig.required === false && (
                <p className="text-center text-sm text-gray-500 mt-3">
                    {wt(WIZARD_COMMON.optionalStep, language)}
                </p>
            )}
        </div>
    );
}

