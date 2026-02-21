'use client';

import { useLanguage } from '@/lib/i18n';
import Link from 'next/link';
import clsx from 'clsx';

interface SidebarProps {
    appState: string;
    onNavigate: (state: string) => void;
    executionsCount: number;
    userRole: string;
    permissions: {
        canUseAgent: boolean;
        canUseMultiAgent: boolean;
        canUseTools: boolean;
        canUseSettings: boolean;
        canUseAIUsage: boolean;
        canUseContext: boolean;
    };
    onShowUserContext: () => void;
    onShowSettings: () => void;
    onShowAIUsage: () => void;
    onLogout: () => void;
    isOpen: boolean;
    onClose: () => void;
    user?: string;
    role?: string;
}

const ROLE_BADGE_STYLES = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
    editor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
} as const;

interface NavItemProps {
    icon?: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
    badge?: string | number;
    gradient?: string;
}

function NavItem({ icon, label, isActive, onClick, badge, gradient }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                    ? gradient
                        ? `bg-gradient-to-r ${gradient} text-white shadow-md`
                        : 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            )}
        >
            {icon && <span className="text-lg">{icon}</span>}
            <span className="flex-1 text-left">{label}</span>
            {badge !== undefined && (
                <span className={clsx(
                    'px-2 py-0.5 rounded-full text-xs font-semibold',
                    isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                )}>
                    {badge}
                </span>
            )}
        </button>
    );
}

interface NavGroupProps {
    title: string;
    icon: string;
    children: React.ReactNode;
}

function NavGroup({ title, icon, children }: NavGroupProps) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                <span>{icon}</span>
                <span>{title}</span>
            </div>
            <div className="space-y-1 pl-4">
                {children}
            </div>
        </div>
    );
}

export default function Sidebar({
    appState,
    onNavigate,
    executionsCount,
    userRole,
    permissions,
    onShowUserContext,
    onShowSettings,
    onShowAIUsage,
    onLogout,
    isOpen,
    onClose,
    user,
}: SidebarProps) {
    const { t } = useLanguage();
    const roleKey = (userRole in ROLE_BADGE_STYLES ? userRole : 'admin') as keyof typeof ROLE_BADGE_STYLES;
    const roleBadgeStyle = ROLE_BADGE_STYLES[roleKey];

    const handleNav = (state: string) => {
        onNavigate(state);
        onClose();
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={clsx(
                    'fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity',
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={clsx(
                    'fixed top-0 left-0 z-[60] h-full w-64',
                    'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
                    'transform transition-transform duration-300 ease-in-out',
                    'flex flex-col',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                    'md:translate-x-0'
                )}
            >
                {/* Logo + User Info */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <Link
                        href="/"
                        onClick={() => handleNav('home')}
                        className="flex items-center gap-2"
                    >
                        <span className="text-2xl">🎯</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">CVF v1.6</span>
                    </Link>
                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-3 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Close sidebar"
                    >
                        ✕
                    </button>
                </div>

                {/* User Info */}
                {user && (
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
                        <div className="font-medium">{user}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">{roleKey}</div>
                    </div>
                )}

                {/* Navigation Groups */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-6" aria-label="Main navigation">
                    {/* Browse Group */}
                    <NavGroup title={t('sidebar.browse') || 'Browse'} icon="📁">
                        <NavItem
                            label={t('nav.home') || '🏠 Home'}
                            isActive={appState === 'home'}
                            onClick={() => handleNav('home')}
                        />
                        <NavItem
                            label={t('nav.skills') || '📚 Skills'}
                            isActive={appState === 'skills'}
                            onClick={() => handleNav('skills')}
                        />
                        <Link
                            href="/skills/search"
                            className={clsx(
                                'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                                'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            )}
                            onClick={onClose}
                            aria-label="Skill Search & Planner"
                        >
                            <span className="flex-1 text-left">🔍 Skill Search</span>
                        </Link>
                        <Link
                            href="/help"
                            className={clsx(
                                'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                                'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            )}
                            onClick={onClose}
                            aria-label={t('nav.help') || 'Help'}
                        >
                            <span className="flex-1 text-left">{t('nav.help') || '📖 Help'}</span>
                        </Link>
                        <Link
                            href="/docs"
                            className={clsx(
                                'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                                'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            )}
                            onClick={onClose}
                            aria-label={t('nav.docs') || 'Docs'}
                        >
                            <span className="flex-1 text-left">{t('nav.docs') || '📚 Docs'}</span>
                        </Link>
                    </NavGroup>

                    {/* AI Features Group */}
                    <NavGroup title={t('sidebar.ai') || 'AI Features'} icon="🤖">
                        {permissions.canUseAgent && (
                            <NavItem
                                label={t('nav.aiAgent') || '💬 AI Agent'}
                                isActive={appState === 'agent'}
                                onClick={() => handleNav('agent')}
                                gradient="from-blue-500 to-purple-500"
                            />
                        )}
                        {permissions.canUseMultiAgent && (
                            <NavItem
                                label={t('nav.multiAgent') || '👥 Multi-Agent'}
                                isActive={appState === 'multi-agent'}
                                onClick={() => handleNav('multi-agent')}
                                gradient="from-purple-500 to-pink-500"
                            />
                        )}
                        {permissions.canUseTools && (
                            <NavItem
                                label={t('nav.tools') || '🛠️ Tools'}
                                isActive={appState === 'tools'}
                                onClick={() => handleNav('tools')}
                                gradient="from-amber-500 to-orange-500"
                            />
                        )}
                    </NavGroup>

                    {/* Data & Analytics Group — hidden for viewers */}
                    {userRole !== 'viewer' && (
                    <NavGroup title={t('sidebar.data') || 'Data'} icon="📊">
                        <NavItem
                            label={t('nav.history') || '📜 History'}
                            isActive={appState === 'history'}
                            onClick={() => handleNav('history')}
                            badge={executionsCount > 0 ? executionsCount : undefined}
                        />
                        <NavItem
                            label={t('nav.analytics') || '📈 Analytics'}
                            isActive={appState === 'analytics'}
                            onClick={() => handleNav('analytics')}
                        />
                        <NavItem
                            label={t('nav.marketplace') || '🛒 Marketplace'}
                            isActive={appState === 'marketplace'}
                            onClick={() => handleNav('marketplace')}
                        />
                    </NavGroup>
                    )}

                    {/* Governance Group */}
                    {userRole !== 'viewer' && (
                    <NavGroup title={t('sidebar.governance') || 'Governance'} icon="🛡️">
                        <NavItem
                            label={t('nav.governance') || '🛡️ Governance'}
                            isActive={appState === 'governance'}
                            onClick={() => handleNav('governance')}
                            gradient="from-emerald-500 to-teal-500"
                        />
                        <NavItem
                            label={t('nav.simulation') || '🧪 Simulation'}
                            isActive={appState === 'simulation'}
                            onClick={() => handleNav('simulation')}
                        />
                    </NavGroup>
                    )}

                    {/* User & Settings Group */}
                    <NavGroup title={t('sidebar.user') || 'User'} icon="⚙️">
                        {permissions.canUseContext && (
                            <NavItem
                                label={t('nav.context') || '👤 Context'}
                                isActive={false}
                                onClick={onShowUserContext}
                            />
                        )}
                        {permissions.canUseSettings && (
                            <NavItem
                                label={t('nav.settings') || '⚙️ Settings'}
                                isActive={false}
                                onClick={onShowSettings}
                            />
                        )}
                        {permissions.canUseAIUsage && (
                            <NavItem
                                label={t('nav.aiUsage') || '💰 AI Usage'}
                                isActive={false}
                                onClick={onShowAIUsage}
                            />
                        )}
                        <NavItem
                            label={t('auth.logout') || '🚪 Logout'}
                            isActive={false}
                            onClick={onLogout}
                        />
                    </NavGroup>
                </nav>

                {/* Footer: Role Badge */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-center">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${roleBadgeStyle}`}>
                            {roleKey.toUpperCase()}
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
}
