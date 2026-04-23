'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useModals } from '@/lib/hooks/useModals';
import { useExecutionStore } from '@/lib/store';
import { useSettings } from '@/components/Settings';
import {
    Sidebar,
    OnboardingWizard,
    QuickStart,
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
import {
    buildGovernedStarterHandoff,
    saveGovernedStarterHandoff,
    type QuickStartResult,
} from '@/lib/governed-starter-path';

/**
 * Inner layout component — uses useSearchParams which requires Suspense.
 */
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useLanguage();
    const mockAiEnabled = process.env.NEXT_PUBLIC_CVF_MOCK_AI === '1';

    const { userRole, userName, permissions, handleLogout, impersonation, endImpersonation } = useAuth();
    const { settings, updateProvider, updatePreferences } = useSettings();
    const modals = useModals(permissions);
    const { executions } = useExecutionStore();
    const openParam = searchParams.get('open');

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [agentPrompt, setAgentPrompt] = useState<string | undefined>();
    const [isAgentMinimized, setIsAgentMinimized] = useState(false);
    const [activeModal, setActiveModal] = useState<'agent' | 'multi-agent' | 'tools' | null>(() => {
        if (openParam === 'agent') return 'agent';
        if (openParam === 'multi-agent') return 'multi-agent';
        return null;
    });

    // Listen for API Key Wizard open event from child pages
    useEffect(() => {
        const handler = () => modals.openModal('apiKeyWizard');
        window.addEventListener('cvf:openApiKeyWizard', handler);
        return () => window.removeEventListener('cvf:openApiKeyWizard', handler);
    }, [modals]);

    useEffect(() => {
        const handleOpenAgent = (event: Event) => {
            const detail = (event as CustomEvent<{ prompt?: string }>).detail;
            modals.closeAllModals();
            setAgentPrompt(detail?.prompt);
            setActiveModal('agent');
            setIsAgentMinimized(false);
        };
        const handleOpenMultiAgent = () => {
            modals.closeAllModals();
            setActiveModal('multi-agent');
        };

        window.addEventListener('cvf:openAgent', handleOpenAgent as EventListener);
        window.addEventListener('cvf:openMultiAgent', handleOpenMultiAgent);
        return () => {
            window.removeEventListener('cvf:openAgent', handleOpenAgent as EventListener);
            window.removeEventListener('cvf:openMultiAgent', handleOpenMultiAgent);
        };
    }, [modals]);

    // Map pathname to Sidebar's expected appState string
    const pathnameToAppState = (p: string): string => {
        if (p === '/' || p.startsWith('/home')) return 'home';
        if (p.startsWith('/landing')) return 'landing';
        if (p.startsWith('/skills/search')) return 'skill-search';
        if (p.startsWith('/history')) return 'history';
        if (p.startsWith('/analytics')) return 'analytics';
        if (p.startsWith('/marketplace')) return 'marketplace';
        if (p.startsWith('/skills')) return 'skills';
        if (p.startsWith('/help')) return 'help';
        if (p.startsWith('/docs')) return 'docs';
        if (p.startsWith('/governance')) return 'governance';
        if (p.startsWith('/simulation')) return 'simulation';
        if (p.startsWith('/safety')) return 'safety';
        return activeModal || 'home';
    };

    const appStateForSidebar = activeModal || pathnameToAppState(pathname);

    const hasBlockingOverlay = Boolean(
        modals.showOnboarding
        || modals.showQuickStart
        || modals.showUserContext
        || modals.showSettings
        || modals.showAIUsage
        || modals.showApiKeyWizard
        || activeModal
    );

    useEffect(() => {
        document.body.style.overflow = hasBlockingOverlay ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [hasBlockingOverlay]);

    const openShellModal = (name: 'userContext' | 'settings' | 'aiUsage' | 'apiKeyWizard' | 'onboarding' | 'quickStart') => {
        setActiveModal(null);
        setAgentPrompt(undefined);
        setIsAgentMinimized(false);
        modals.openModal(name);
    };

    // Navigation handler — real pages use router, modals set state
    const handleNavigate = (state: string) => {
        modals.closeAllModals();
        switch (state) {
            case 'home': router.push('/home'); setActiveModal(null); break;
            case 'landing': router.push('/landing'); setActiveModal(null); break;
            case 'history': router.push('/history'); setActiveModal(null); break;
            case 'analytics': router.push('/analytics'); setActiveModal(null); break;
            case 'marketplace': router.push('/marketplace'); setActiveModal(null); break;
            case 'skills': router.push('/skills'); setActiveModal(null); break;
            case 'skill-search': router.push('/skills/search'); setActiveModal(null); break;
            case 'help': router.push('/help'); setActiveModal(null); break;
            case 'docs': router.push('/docs'); setActiveModal(null); break;
            case 'governance': router.push('/governance'); setActiveModal(null); break;
            case 'simulation': router.push('/simulation'); setActiveModal(null); break;
            case 'safety': router.push('/safety'); setActiveModal(null); break;
            case 'agent':
                setActiveModal('agent');
                setIsAgentMinimized(false);
                break;
            case 'multi-agent': setActiveModal('multi-agent'); break;
            case 'tools': setActiveModal('tools'); break;
            default: router.push('/home'); setActiveModal(null);
        }
    };

    const handleQuickStartComplete = (result: QuickStartResult) => {
        saveGovernedStarterHandoff(buildGovernedStarterHandoff(result));
        modals.closeModal('quickStart');

        if (!pathname.startsWith('/home')) {
            router.push('/home');
            return;
        }

        window.dispatchEvent(new CustomEvent('cvf:starterHandoffReady'));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Onboarding */}
            {modals.showOnboarding && (
                <OnboardingWizard onComplete={modals.handleOnboardingComplete} />
            )}

            {modals.showQuickStart && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 md:p-4">
                    <div className="w-full md:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 safe-area-pt safe-area-pb">
                        <QuickStart
                            language={language}
                            onComplete={handleQuickStartComplete}
                            onSkip={() => modals.closeModal('quickStart')}
                        />
                    </div>
                </div>
            )}

            {/* Compact Header */}
            <CompactHeader
                onSidebarOpen={() => setSidebarOpen(true)}
                onLogoClick={() => { router.push('/home'); setActiveModal(null); }}
                mockAiEnabled={mockAiEnabled}
            />

            {/* Sidebar */}
            <Sidebar
                appState={appStateForSidebar}
                onNavigate={handleNavigate}
                executionsCount={executions.length}
                userRole={userRole}
                permissions={permissions}
                onShowUserContext={() => openShellModal('userContext')}
                onShowSettings={() => openShellModal('settings')}
                onShowAIUsage={() => openShellModal('aiUsage')}
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={userName}
                role={userRole}
            />

            {/* Main Content — children are the individual page routes */}
            <main className="md:ml-[220px] min-h-screen">
                {impersonation && (
                    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
                        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="font-semibold">Impersonation active</div>
                                <div className="text-xs md:text-sm">
                                    Acting as <span className="font-semibold">{userName ?? userRole}</span> until{' '}
                                    {new Date(impersonation.expiresAt).toLocaleString()}.
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => void endImpersonation()}
                                className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
                            >
                                End Impersonation
                            </button>
                        </div>
                    </div>
                )}
                {children}

                {/* Footer */}
                <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-800">
                    <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
                        <div className="space-y-1">
                            <div>{t('footer.tagline')}</div>
                            <div className="text-xs text-gray-400">{t('footer.author')}</div>
                            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                                <span>🛡️</span>
                                <span>{t('safety.badge') || 'AI đang được kiểm soát bởi CVF'}</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>

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

/**
 * Shared layout for all dashboard pages.
 * Wrapped in Suspense to support useSearchParams in static generation.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </Suspense>
    );
}
