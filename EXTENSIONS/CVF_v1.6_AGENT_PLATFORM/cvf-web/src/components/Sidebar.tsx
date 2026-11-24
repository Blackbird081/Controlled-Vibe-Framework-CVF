'use client';
// Text Encoding Exception: the developer navigation uses localized Vietnamese copy.

import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import clsx from 'clsx';
import {
    Sparkles, Home, LayoutDashboard, Zap, Search, HelpCircle, BookOpen,
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
    userRole: string | null;
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
    role?: string | null;
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

    const roleKey = userRole && Object.hasOwn(ROLE_BADGE_COLOR, userRole) ? userRole : 'unknown';
    const badgeColor = ROLE_BADGE_COLOR[roleKey] ?? ROLE_BADGE_COLOR.viewer;
    const roleLabel = t(`sidebar.role.${roleKey}`);
    const privileged = userRole === 'admin' || userRole === 'owner';
    const canReadOperations = Boolean(userRole && userRole !== 'viewer');

    const initials = user
        ? user.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
        : roleLabel.slice(0, 2).toUpperCase();

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
                    isOpen ? 'translate-x-0' : 'invisible -translate-x-full md:visible',
                    'md:translate-x-0',
                )}
                aria-label={t('sidebar.navigation')}
                onKeyDown={event => {
                    if (event.key === 'Escape' && isOpen) onClose();
                }}
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
                        className="md:hidden flex min-h-11 min-w-11 items-center justify-center rounded text-white/60 hover:text-white/90 hover:bg-white/[0.07] transition-colors"
                        aria-label={t('sidebar.close')}
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
                        <div className="text-white/90 text-[12px] font-medium truncate">{user || t('sidebar.user')}</div>
                    </div>
                    <span className={clsx(
                        'flex-shrink-0 text-[9px] font-bold tracking-[0.04em]',
                        'px-[7px] py-[3px] rounded',
                        badgeColor,
                    )}>
                        {roleLabel}
                    </span>
                </div>

                {/* ── Nav ─────────────────────────────────────── */}
                <nav className="flex-1 overflow-y-auto scroll-py-2 px-[10px] py-2" aria-label={t('sidebar.navigation')}>
                    <div className="flex flex-col gap-px" data-sidebar-group="main">
                        <SidebarNavItem icon={Home} label={t('nav.home')}
                            isActive={pathname === '/' || pathname === '/home' || isRoute('/home/')}
                            onClick={() => handleNav('home')} />
                        {permissions.canUseAgent && (
                            <SidebarNavItem icon={Bot} label={t('nav.aiAgent')}
                                isActive={appState === 'agent'} onClick={() => handleNav('agent')} />
                        )}
                        <SidebarNavItem icon={Zap} label={t('nav.skills')}
                            isActive={appState === 'skills' || (isRoute('/skills') && !isRoute('/skills/search'))}
                            onClick={() => handleNav('skills')} />
                        <SidebarNavItem icon={LayoutDashboard} label={t('nav.workspace')}
                            isActive={appState === 'workspace' || isRoute('/workspace')}
                            href="/workspace" onNavigate={onClose} />
                        <SidebarNavItem icon={HelpCircle} label={t('nav.help')}
                            isActive={appState === 'help' || isRoute('/help')}
                            onClick={() => handleNav('help')} />
                        <SidebarNavItem icon={Sparkles} label={t('nav.landing')}
                            isActive={appState === 'landing' || isRoute('/landing')}
                            onClick={() => handleNav('landing')} />
                        {(permissions.canUseContext || permissions.canUseSettings || permissions.canUseAIUsage) && (
                            <SidebarNavGroup id="account" title={t('sidebar.account')} defaultCollapsed>
                                {permissions.canUseSettings && (
                                    <SidebarNavItem icon={Settings} label={t('nav.settings')} isActive={false}
                                        onClick={() => { onShowSettings(); onClose(); }} />
                                )}
                                {permissions.canUseAIUsage && (
                                    <SidebarNavItem icon={Coins} label={t('nav.aiUsage')} isActive={false}
                                        onClick={() => { onShowAIUsage(); onClose(); }} />
                                )}
                                {permissions.canUseContext && (
                                    <SidebarNavItem icon={UserCircle} label={t('nav.context')} isActive={false}
                                        onClick={() => { onShowUserContext(); onClose(); }} />
                                )}
                            </SidebarNavGroup>
                        )}
                    </div>

                    <div className="mt-2 border-t border-white/[0.09] pt-2">
                        <SidebarNavGroup id="developer" title={t('sidebar.developer')} defaultCollapsed={!privileged}
                            storageKey={privileged ? 'cvf_sidebar_dev_admin' : 'cvf_sidebar_dev_standard'}>
                            <SidebarNavItem icon={Sparkles} label={language === 'vi' ? 'Luồng khởi đầu có kiểm soát' : 'Governed starter path'}
                                isActive={false} onClick={() => handleNav('quickStart')} />
                            {permissions.canUseMultiAgent && (
                                <SidebarNavItem icon={Network} label={t('nav.multiAgent')}
                                    isActive={appState === 'multi-agent'} onClick={() => handleNav('multi-agent')} />
                            )}
                            {permissions.canUseTools && (
                                <SidebarNavItem icon={Wrench} label={t('nav.tools')}
                                    isActive={appState === 'tools'} onClick={() => handleNav('tools')} />
                            )}
                            {canReadOperations && (
                                <>
                                    <SidebarNavItem icon={FlaskConical} label={t('nav.simulation')}
                                        isActive={appState === 'simulation' || isRoute('/simulation')}
                                        onClick={() => handleNav('simulation')} />
                                    <SidebarNavItem icon={Gauge} label={t('nav.runtime')}
                                        isActive={appState === 'runtime' || isRoute('/runtime')}
                                        onClick={() => handleNav('runtime')} />
                                    <SidebarNavItem icon={Activity} label={t('nav.history')}
                                        isActive={appState === 'history' || isRoute('/history')}
                                        onClick={() => handleNav('history')}
                                        badge={executionsCount > 0 ? executionsCount : undefined} />
                                    <SidebarNavItem icon={BarChart3} label={t('nav.analytics')}
                                        isActive={appState === 'analytics' || isRoute('/analytics')}
                                        onClick={() => handleNav('analytics')} />
                                    <SidebarNavItem icon={Shield} label={t('nav.governance')}
                                        isActive={isRoute('/governance') && !isRoute('/governance/knowledge') && !isRoute('/governance/mao-runs')}
                                        onClick={() => handleNav('governance')} />
                                    <SidebarNavItem icon={Activity} label={t('nav.maoRuns')}
                                        isActive={isRoute('/governance/mao-runs')}
                                        href="/governance/mao-runs" onNavigate={onClose} />
                                    <SidebarNavItem icon={ShoppingBag} label={t('nav.marketplace')}
                                        isActive={appState === 'marketplace' || isRoute('/marketplace')}
                                        onClick={() => handleNav('marketplace')} />
                                    <SidebarNavItem icon={Lightbulb} label={t('nav.knowledge')}
                                        isActive={isRoute('/governance/knowledge')}
                                        href="/governance/knowledge" onNavigate={onClose} />
                                    <SidebarNavItem icon={BookOpen} label={t('nav.knowledgeIntake')}
                                        isActive={isRoute('/knowledge/intake')} href="/knowledge/intake" onNavigate={onClose} />
                                    <SidebarNavItem icon={FileCheck2} label={t('nav.artifacts')}
                                        isActive={isRoute('/artifacts')} href="/artifacts" onNavigate={onClose} />
                                    <SidebarNavItem icon={ClipboardCheck} label={t('nav.workTransfer')}
                                        isActive={isRoute('/work-transfer')} href="/work-transfer" onNavigate={onClose} />
                                </>
                            )}
                            <SidebarNavItem icon={Search} label={t('nav.skillSearch')}
                                isActive={appState === 'skill-search' || isRoute('/skills/search')}
                                onClick={() => handleNav('skill-search')} />
                            <SidebarNavItem icon={BookOpen} label={t('nav.docs')}
                                isActive={appState === 'docs' || isRoute('/docs')}
                                onClick={() => handleNav('docs')} />
                            <SidebarNavItem icon={Lock} label={t('nav.safety')}
                                isActive={appState === 'safety' || isRoute('/safety')}
                                onClick={() => handleNav('safety')} />
                            {privileged && (
                                <SidebarNavItem icon={Building2} label={t('nav.enterprise')}
                                    isActive={isRoute('/admin')} href="/admin/team" onNavigate={onClose} />
                            )}
                        </SidebarNavGroup>
                    </div>
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
