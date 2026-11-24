import type { DetectedIntent } from '@/lib/intent-detector';

export interface QuickStartResult {
    provider: string;
    apiKey: string;
    userInput: string;
    detectedIntent: DetectedIntent;
}

export interface GovernedStarterHandoff {
    recommendedTemplateId: string;
    recommendedTemplateLabel: string;
    userInput: string;
    provider: string;
    phase: DetectedIntent['phase'];
    riskLevel: DetectedIntent['riskLevel'];
    friendlyPhase: string;
    friendlyRisk: string;
    suggestedTemplates: string[];
}

const STARTER_STORAGE_KEY = 'cvf_governed_starter_handoff';

const STARTER_TEMPLATE_MAP: Record<string, { id: string; label: string }> = {
    'app-builder': { id: 'app_builder_wizard', label: '🧙 App Builder Wizard' },
    'business-strategy': { id: 'business_strategy_wizard', label: '📈 Business Strategy Wizard' },
    'marketing-campaign': { id: 'marketing_campaign_wizard', label: '📣 Marketing Campaign Wizard' },
    'content-strategy': { id: 'content_strategy_wizard', label: '✍️ Content Strategy Wizard' },
    'data-analysis': { id: 'data_analysis_wizard', label: '📊 Data Analysis Wizard' },
    'system-design': { id: 'system_design_wizard', label: '🏗️ System Design Wizard' },
    'security-assessment': { id: 'security_assessment_wizard', label: '🔐 Security Assessment Wizard' },
    'product-design': { id: 'product_design_wizard', label: '🎨 Product Design Wizard' },
    'research-project': { id: 'research_project_wizard', label: '🔬 Research Project Wizard' },
};

const DEFAULT_STARTER = STARTER_TEMPLATE_MAP['app-builder'];

export function resolveGovernedStarterTemplate(suggestedTemplates: string[]) {
    for (const suggestedTemplate of suggestedTemplates) {
        const mapped = STARTER_TEMPLATE_MAP[suggestedTemplate];
        if (mapped) {
            return mapped;
        }
    }

    return DEFAULT_STARTER;
}

export function buildGovernedStarterHandoff(result: QuickStartResult): GovernedStarterHandoff {
    const starterTemplate = resolveGovernedStarterTemplate(result.detectedIntent.suggestedTemplates);

    return {
        recommendedTemplateId: starterTemplate.id,
        recommendedTemplateLabel: starterTemplate.label,
        userInput: result.userInput,
        provider: result.provider,
        phase: result.detectedIntent.phase,
        riskLevel: result.detectedIntent.riskLevel,
        friendlyPhase: result.detectedIntent.friendlyPhase,
        friendlyRisk: result.detectedIntent.friendlyRisk,
        suggestedTemplates: result.detectedIntent.suggestedTemplates,
    };
}

function storageKey(accountScope?: string): string {
    return accountScope ? `${STARTER_STORAGE_KEY}:${accountScope}` : STARTER_STORAGE_KEY;
}

export function saveGovernedStarterHandoff(handoff: GovernedStarterHandoff, accountScope?: string) {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.setItem(storageKey(accountScope), JSON.stringify(handoff));
}

export function readGovernedStarterHandoff(accountScope?: string): GovernedStarterHandoff | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(storageKey(accountScope));
        return raw ? JSON.parse(raw) as GovernedStarterHandoff : null;
    } catch {
        return null;
    }
}

export function clearGovernedStarterHandoff(accountScope?: string) {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.removeItem(storageKey(accountScope));
}
