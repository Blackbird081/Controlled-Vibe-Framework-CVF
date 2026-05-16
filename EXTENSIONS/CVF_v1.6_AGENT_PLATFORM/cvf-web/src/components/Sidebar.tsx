'use client';

import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import clsx from 'clsx';
import {
    Sparkles, Home, Zap, Search, HelpCircle, BookOpen,
    Bot, Network, Wrench, FlaskConical, Lightbulb,
    Activity, BarChart3, ShoppingBag, Shield, Building2, Lock, Gauge,
    UserCircle, Settings, Coins, LogOut, Globe, FileCheck2, ClipboardCheck,
} from 'lucide-react';
import SidebarNavItem from './sidebar/SidebarNavItem';
import SidebarNavGroup from './sidebar/SidebarNavGroup';

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

const ROLE_BADGE_COLOR: Record<string, string> = {
    owner:     'text-purple-300 bg-purple-500/20',
    admin:     'text-red-300    bg-red-500/20',
    developer: 'text-blue-300   bg-blue-500/20',
    reviewer:  'text-indigo-300 bg-indigo-500/20',
    editor:    'text-amber-300  bg-amber-500/20',
    viewer:    'text-gray-300   bg-white/10',
};

const USER_AVATAR_GRADIENT = 'from-amber-400 to-red-500';

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
    const { language, setLanguage, t } = useLanguage();
    const pathname = usePathname();

    const roleKey = (userRole in ROLE_BADGE_COLOR ? userRole : 'admin');
    const badgeColor = ROLE_BADGE_COLOR[roleKey] ?? ROLE_BADGE_COLOR.admin;

    const initials = user
        ? user.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
        : roleKey.slice(0, 2).toUpperCase();

    const handleNav = (state: string) => {
        onNavigate(state);
        onClose();
    };

    const isRoute = (prefix: string) => pathname.startsWith(prefix);

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={clsx(
                    'fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity',
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar panel */}
            <aside
                className={clsx(
                    'fixed top-0 left-0 z-[60] h-full w-[220px]',
                    'bg-[#0d0f1a] border-r border-white/[0.06]',
                    'flex flex-col',
                    'transform transition-transform duration-300 ease-in-out',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                    'md:translate-x-0',
                )}
                aria-label="Main navigation"
            >
                {/* ── Logo ─────────────────────────────────────── */}
                <div className="flex items-center gap-2.5 px-[18px] py-[18px] pb-[14px] border-b border-white/[0.06] flex-shrink-0">
                    <div className="w-8 h-8 rounded-[9px] flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500">
                        <Sparkles size={15} color="#fff" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-white font-bold text-[15px] leading-none tracking-tight">CVF</div>
                    </div>
                    {/* Mobile close */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="md:hidden p-1.5 rounded text-white/40 hover:text-white/70 hover:bg-white/[0.07] transition-colors"
                        aria-label="Close sidebar"
                    >
                        ✕
                    </button>
                </div>

                {/* ── User block ───────────────────────────────── */}
                <div className="flex items-center gap-2.5 px-[14px] py-[11px] border-b border-white/[0.06] flex-shrink-0">
                    <div className={clsx(
                        'w-[30px] h-[30px] rounded-full flex-shrink-0 flex items-center justify-center',
                        `bg-gradient-to-br ${USER_AVATAR_GRADIENT}`,
                        'text-[12px] text-white font-bold',
                    )}>
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-white/90 text-[12px] font-medium truncate">{user || 'User'}</div>
                        <div className="text-white/25 text-[10px] capitalize">{roleKey}</div>
                    </div>
                    <span className={clsx(
                        'flex-shrink-0 text-[9px] font-bold uppercase tracking-[0.06em]',
                        'px-[7px] py-[3px] rounded',
                        badgeColor,
                    )}>
                        {roleKey}
                    </span>
                </div>

                {/* ── Nav ─────────────────────────────────────── */}
                <nav className="flex-1 overflow-y-auto px-[10px] py-2" aria-label="Main navigation">

                    {/* Workspace */}
                    <SidebarNavGroup id="workspace" title={t('sidebar.workspace') || 'Workspace'}>
                        <SidebarNavItem icon={Home} label={t('nav.home') || 'Home'}
                            isActive={appState === 'home' || isRoute('/home')}
                            onClick={() => handleNav('home')} />
                        <SidebarNavItem icon={Sparkles} label={t('nav.landing') || 'Landing Page'}
                            isActive={appState === 'landing' || isRoute('/landing')}
                            onClick={() => handleNav('landing')} />
                        <SidebarNavItem icon={Zap} label={t('nav.skills') || 'Skills'}
                            isActive={appState === 'skills' || (isRoute('/skills') && !isRoute('/skills/search'))}
                            onClick={() => handleNav('skills')} />
                        <SidebarNavItem icon={Search} label={t('nav.skillSearch') || 'Skill Search'}
                            isActive={appState === 'skill-search' || isRoute('/skills/search')}
                            onClick={() => handleNav('skill-search')} />
                        <SidebarNavItem icon={HelpCircle} label={t('nav.help') || 'Help'}
                            isActive={appState === 'help' || isRoute('/help')}
                            onClick={() => handleNav('help')} />
                        <SidebarNavItem icon={BookOpen} label={t('nav.docs') || 'Docs'}
                            isActive={appState === 'docs' || isRoute('/docs')}
                            onClick={() => handleNav('docs')} />
                    </SidebarNavGroup>

                    {/* AI */}
                    <SidebarNavGroup id="ai" title={t('sidebar.ai') || 'AI'}>
                        {permissions.canUseAgent && (
                            <SidebarNavItem icon={Bot} label={t('nav.aiAgent') || 'AI Agent'}
                                isActive={appState === 'agent'}
                                onClick={() => handleNav('agent')} />
                        )}
                        {permissions.canUseMultiAgent && (
                            <SidebarNavItem icon={Network} label={t('nav.multiAgent') || 'Multi Agent'}
                                isActive={appState === 'multi-agent'}
                                onClick={() => handleNav('multi-agent')} />
                        )}
                        {permissions.canUseTools && (
                            <SidebarNavItem icon={Wrench} label={t('nav.tools') || 'Tools'}
                                isActive={appState === 'tools'}
                                onClick={() => handleNav('tools')} />
                        )}
                        {userRole !== 'viewer' && (
                            <SidebarNavItem icon={FlaskConical} label={t('nav.simulation') || 'Simulation'}
                                isActive={appState === 'simulation' || isRoute('/simulation')}
                                onClick={() => handleNav('simulation')} />
                        )}
                        {userRole !== 'viewer' && (
                            <SidebarNavItem icon={Lightbulb} label={t('nav.knowledge') || 'Knowledge'}
                                isActive={isRoute('/governance/knowledge')}
                                href="/governance/knowledge" onNavigate={onClose} />
                        )}
                        {userRole !== 'viewer' && (
                            <SidebarNavItem icon={BookOpen} label={t('nav.knowledgeIntake') || 'Knowledge Intake'}
                                isActive={isRoute('/knowledge/intake')}
                                href="/knowledge/intake" onNavigate={onClose} />
                        )}
                        {userRole !== 'viewer' && (
                            <SidebarNavItem icon={FileCheck2} label={t('nav.artifacts') || 'Artifacts'}
                                isActive={isRoute('/artifacts')}
                                href="/artifacts" onNavigate={onClose} />
                        )}
                        {userRole !== 'viewer' && (
                            <SidebarNavItem icon={ClipboardCheck} label={t('nav.workTransfer') || 'Work Transfer'}
                                isActive={isRoute('/work-transfer')}
                                href="/work-transfer" onNavigate={onClose} />
                        )}
                    </SidebarNavGroup>

                    {/* Platform */}
                    <SidebarNavGroup id="platform" title={t('sidebar.platform') || 'Platform'}>
                        {userRole !== 'viewer' && (
                            <SidebarNavItem icon={Activity} label={t('nav.history') || 'History'}
                                isActive={appState === 'history' || isRoute('/history')}
                                onClick={() => handleNav('history')}
                                badge={executionsCount > 0 ? executionsCount : undefined} />
                        )}
                        {userRole !== 'viewer' && (
                            <SidebarNavItem icon={BarChart3} label={t('nav.analytics') || 'Analytics'}
                                isActive={appState === 'analytics' || isRoute('/analytics')}
                                onClick={() => handleNav('analytics')} />
                        )}
                        {userRole !== 'viewer' && (
                            <SidebarNavItem icon={Gauge} label={t('nav.runtime') || 'Runtime Monitor'}
                                isActive={appState === 'runtime' || isRoute('/runtime')}
                                onClick={() => handleNav('runtime')} />
                        )}
                        {userRole !== 'viewer' && (
                            <SidebarNavItem icon={ShoppingBag} label={t('nav.marketplace') || 'Marketplace'}
                                isActive={appState === 'marketplace' || isRoute('/marketplace')}
                                onClick={() => handleNav('marketplace')} />
                        )}
                        {userRole !== 'viewer' && (
                            <SidebarNavItem icon={Shield} label={t('nav.governance') || 'Governance'}
                                isActive={appState === 'governance' || (isRoute('/governance') && !isRoute('/governance/knowledge'))}
                                onClick={() => handleNav('governance')} />
                        )}
                        {(userRole === 'admin' || userRole === 'owner') && (
                            <SidebarNavItem icon={Building2} label={t('nav.enterprise') || 'Enterprise'}
                                isActive={isRoute('/admin')}
                                href="/admin/team" onNavigate={onClose} />
                        )}
                        <SidebarNavItem icon={Lock} label={t('nav.safety') || 'AI Safety'}
                            isActive={appState === 'safety' || isRoute('/safety')}
                            onClick={() => handleNav('safety')} />
                    </SidebarNavGroup>

                    {/* Account */}
                    <SidebarNavGroup id="account" title={t('sidebar.account') || 'Account'}>
                        {permissions.canUseContext && (
                            <SidebarNavItem icon={UserCircle} label={t('nav.context') || 'Context'}
                                isActive={false}
                                onClick={() => { onShowUserContext(); onClose(); }} />
                        )}
                        {permissions.canUseSettings && (
                            <SidebarNavItem icon={Settings} label={t('nav.settings') || 'Settings'}
                                isActive={false}
                                onClick={() => { onShowSettings(); onClose(); }} />
                        )}
                        {permissions.canUseAIUsage && (
                            <SidebarNavItem icon={Coins} label={t('nav.aiUsage') || 'AI Usage'}
                                isActive={false}
                                onClick={() => { onShowAIUsage(); onClose(); }} />
                        )}
                    </SidebarNavGroup>
                </nav>

                {/* ── Footer ─────────────────────────────────── */}
                <div className="px-[10px] pb-3 pt-2 border-t border-white/[0.06] flex-shrink-0">
                    <SidebarNavItem icon={LogOut} label={t('auth.logout') || 'Logout'}
                        isActive={false}
                        onClick={onLogout} />
                    <button
                        type="button"
                        onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                        className="mt-0.5 flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium text-white/45 transition hover:bg-white/[0.07] hover:text-white/75"
                        aria-label={t('lang.current')}
                    >
                        <Globe size={12} strokeWidth={1.75} aria-hidden="true" />
                        <span>{language === 'vi' ? 'VI' : 'EN'}</span>
                        <span className="text-white/20">·</span>
                        <span>{language === 'vi' ? 'Switch to EN' : 'Chuyển sang VI'}</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
