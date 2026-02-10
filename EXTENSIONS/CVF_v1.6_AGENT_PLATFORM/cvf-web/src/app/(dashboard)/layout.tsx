'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useModals } from '@/lib/hooks/useModals';
import { useExecutionStore } from '@/lib/store';
import { useSettings } from '@/components/Settings';
import {
    Sidebar,
    OnboardingWizard,
    QuickReference,
    TourGuide,
    UserContextForm,
    SettingsPage,
    AIUsagePanel,
    ApiKeyWizard,
    AgentChatWithHistory,
    MultiAgentPanel,
    ToolsPage,
} from '@/components';
import CompactHeader from '@/components/CompactHeader';
import { useLanguage } from '@/lib/i18n';

/**
 * Shared layout for all dashboard pages (home, history, analytics, marketplace).
 * Provides Sidebar, CompactHeader, modals, and floating overlays.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useLanguage();
    const mockAiEnabled = process.env.NEXT_PUBLIC_CVF_MOCK_AI === '1';

    const { userRole, userName, permissions, handleLogout } = useAuth();
    const { settings, updateProvider, updatePreferences } = useSettings();
    const modals = useModals(permissions);
    const { executions } = useExecutionStore();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [agentPrompt, setAgentPrompt] = useState<string | undefined>();
    const [isAgentMinimized, setIsAgentMinimized] = useState(false);
    const [activeModal, setActiveModal] = useState<'agent' | 'multi-agent' | 'tools' | null>(null);

    // Map pathname to Sidebar's expected appState string
    const pathnameToAppState = (p: string): string => {
        if (p === '/') return 'home';
        if (p.startsWith('/history')) return 'history';
        if (p.startsWith('/analytics')) return 'analytics';
        if (p.startsWith('/marketplace')) return 'marketplace';
        if (p.startsWith('/skills')) return 'skills';
        return activeModal || 'home';
    };

    const appStateForSidebar = activeModal || pathnameToAppState(pathname);

    // Navigation handler — real pages use router, modals set state
    const handleNavigate = (state: string) => {
        switch (state) {
            case 'home': router.push('/'); setActiveModal(null); break;
            case 'history': router.push('/history'); setActiveModal(null); break;
            case 'analytics': router.push('/analytics'); setActiveModal(null); break;
            case 'marketplace': router.push('/marketplace'); setActiveModal(null); break;
            case 'skills': router.push('/skills'); setActiveModal(null); break;
            case 'agent':
                setActiveModal('agent');
                setIsAgentMinimized(false);
                break;
            case 'multi-agent': setActiveModal('multi-agent'); break;
            case 'tools': setActiveModal('tools'); break;
            default: router.push('/'); setActiveModal(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Onboarding */}
            {modals.showOnboarding && (
                <OnboardingWizard onComplete={modals.handleOnboardingComplete} />
            )}

            {/* Compact Header */}
            <CompactHeader
                onSidebarOpen={() => setSidebarOpen(true)}
                onLogoClick={() => { router.push('/'); setActiveModal(null); }}
                mockAiEnabled={mockAiEnabled}
            />

            {/* Sidebar */}
            <Sidebar
                appState={appStateForSidebar}
                onNavigate={handleNavigate}
                executionsCount={executions.length}
                userRole={userRole}
                permissions={permissions}
                onShowUserContext={() => modals.openModal('userContext')}
                onShowSettings={() => modals.openModal('settings')}
                onShowAIUsage={() => modals.openModal('aiUsage')}
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={userName}
                role={userRole}
            />

            {/* Main Content — children are the individual page routes */}
            <main className="md:ml-64 min-h-screen">
                {children}

                {/* Footer */}
                <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-800">
                    <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
                        <div className="space-y-1">
                            <div>{t('footer.tagline')}</div>
                            <div className="text-xs text-gray-400">{t('footer.author')}</div>
                        </div>
                    </div>
                </footer>
            </main>

            {/* Floating Quick Reference + Tour */}
            <QuickReference />
            <TourGuide />

            {/* ── MODALS ────────────────────────────────── */}

            {modals.showUserContext && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 md:p-4">
                    <div className="w-full h-full md:h-auto md:max-w-2xl overflow-y-auto safe-area-pt safe-area-pb">
                        <UserContextForm onClose={() => modals.closeModal('userContext')} />
                    </div>
                </div>
            )}

            {modals.showSettings && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 md:p-4">
                    <div className="w-full h-full md:h-auto md:max-w-2xl max-h-[90vh] overflow-y-auto safe-area-pt safe-area-pb">
                        <SettingsPage onClose={() => modals.closeModal('settings')} />
                    </div>
                </div>
            )}

            {modals.showAIUsage && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 md:p-4">
                    <div className="w-full h-full md:h-auto md:max-w-3xl overflow-y-auto safe-area-pt safe-area-pb">
                        <AIUsagePanel onClose={() => modals.closeModal('aiUsage')} />
                    </div>
                </div>
            )}

            {modals.showApiKeyWizard && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 md:p-4">
                    <div className="w-full md:max-w-3xl max-h-[90vh] overflow-y-auto safe-area-pt safe-area-pb">
                        <ApiKeyWizard
                            onComplete={() => modals.closeModal('apiKeyWizard')}
                            onClose={() => modals.closeModal('apiKeyWizard')}
                            settings={settings}
                            updateProvider={updateProvider}
                            updatePreferences={updatePreferences}
                        />
                    </div>
                </div>
            )}

            {/* Agent Chat */}
            {activeModal === 'agent' && !isAgentMinimized && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-0 md:p-4">
                    <div className="w-full h-full md:h-[85vh] md:max-w-5xl rounded-none md:rounded-xl overflow-hidden shadow-2xl">
                        <AgentChatWithHistory
                            initialPrompt={agentPrompt}
                            onClose={() => { setActiveModal(null); setAgentPrompt(undefined); setIsAgentMinimized(false); }}
                            onComplete={() => { setActiveModal(null); setAgentPrompt(undefined); setIsAgentMinimized(false); }}
                            onMinimize={() => setIsAgentMinimized(true)}
                        />
                    </div>
                </div>
            )}

            {activeModal === 'agent' && isAgentMinimized && (
                <div
                    className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-blue-600 
                     text-white px-5 py-3 rounded-xl shadow-2xl cursor-pointer
                     hover:from-purple-700 hover:to-blue-700 transition-all
                     flex items-center gap-3 animate-pulse"
                    onClick={() => setIsAgentMinimized(false)}
                >
                    <span className="text-xl">🤖</span>
                    <span className="font-medium">CVF Agent</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{t('agent.restoreHint')}</span>
                </div>
            )}

            {/* Multi-Agent */}
            {activeModal === 'multi-agent' && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-0 md:p-4">
                    <div className="w-full h-full md:h-[85vh] md:max-w-5xl rounded-none md:rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900">
                        <MultiAgentPanel
                            onClose={() => setActiveModal(null)}
                            onComplete={() => setActiveModal(null)}
                        />
                    </div>
                </div>
            )}

            {/* Tools */}
            {activeModal === 'tools' && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-0 md:p-4">
                    <div className="w-full h-full md:h-[85vh] md:max-w-5xl rounded-none md:rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900">
                        <ToolsPage onClose={() => setActiveModal(null)} />
                    </div>
                </div>
            )}
        </div>
    );
}
