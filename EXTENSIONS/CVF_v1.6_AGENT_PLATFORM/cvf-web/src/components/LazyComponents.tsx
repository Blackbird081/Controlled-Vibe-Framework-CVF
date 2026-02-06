'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/lib/error-handling';

// Loading fallback component
function ModalLoading() {
    return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <LoadingSpinner size="lg" message="Loading..." />
        </div>
    );
}

// Lazy load heavy modal components
export const LazyAgentChatWithHistory = dynamic(
    () => import('./AgentChatWithHistory').then(mod => ({ default: mod.AgentChatWithHistory })),
    { loading: () => <ModalLoading />, ssr: false }
);

export const LazyMultiAgentPanel = dynamic(
    () => import('./MultiAgentPanel').then(mod => ({ default: mod.MultiAgentPanel })),
    { loading: () => <ModalLoading />, ssr: false }
);

export const LazyToolsPage = dynamic(
    () => import('./ToolsPage').then(mod => ({ default: mod.ToolsPage })),
    { loading: () => <ModalLoading />, ssr: false }
);

export const LazySettingsPage = dynamic(
    () => import('./Settings').then(mod => ({ default: mod.SettingsPage })),
    { loading: () => <ModalLoading />, ssr: false }
);

export const LazySkillLibrary = dynamic(
    () => import('./SkillLibrary').then(mod => ({ default: mod.SkillLibrary })),
    { loading: () => <ModalLoading />, ssr: false }
);

export const LazyTemplateMarketplace = dynamic(
    () => import('./TemplateMarketplace').then(mod => ({ default: mod.TemplateMarketplace })),
    { loading: () => <ModalLoading />, ssr: false }
);

export const LazyAnalyticsDashboard = dynamic(
    () => import('./AnalyticsDashboard').then(mod => ({ default: mod.AnalyticsDashboard })),
    { loading: () => <ModalLoading />, ssr: false }
);

// Wizard components
export const LazyOnboardingWizard = dynamic(
    () => import('./OnboardingWizard').then(mod => ({ default: mod.OnboardingWizard })),
    { loading: () => <ModalLoading />, ssr: false }
);

export const LazyAppBuilderWizard = dynamic(
    () => import('./AppBuilderWizard').then(mod => ({ default: mod.AppBuilderWizard })),
    { loading: () => <ModalLoading />, ssr: false }
);

// Re-export for easy access
export { ModalLoading };
