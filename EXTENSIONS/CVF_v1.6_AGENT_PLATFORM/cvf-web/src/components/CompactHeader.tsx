'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Settings2, Sparkles, X } from 'lucide-react';
import { SidebarToggle } from '@/components';
import { ThemeToggle, useTheme } from '@/lib/theme';
import { LanguageToggle, useLanguage } from '@/lib/i18n';

interface CompactHeaderProps {
    onSidebarOpen: () => void;
    onLogoClick: () => void;
    mockAiEnabled: boolean;
}

type AccentTone = 'indigo' | 'violet' | 'cyan' | 'emerald' | 'rose' | 'amber';
type DensityMode = 'normal' | 'compact';

interface TweaksState {
    accent: AccentTone;
    radius: number;
    density: DensityMode;
}

const TWEAKS_KEY = 'cvf_ui_tweaks';
const DEFAULT_TWEAKS: TweaksState = {
    accent: 'indigo',
    radius: 14,
    density: 'normal',
};

const ACCENT_OPTIONS: Array<{ id: AccentTone; rgb: string; swatchClass: string }> = [
    { id: 'indigo', rgb: '99 102 241', swatchClass: 'bg-indigo-500' },
    { id: 'violet', rgb: '139 92 246', swatchClass: 'bg-violet-500' },
    { id: 'cyan', rgb: '6 182 212', swatchClass: 'bg-cyan-500' },
    { id: 'emerald', rgb: '16 185 129', swatchClass: 'bg-emerald-500' },
    { id: 'rose', rgb: '244 63 94', swatchClass: 'bg-rose-500' },
    { id: 'amber', rgb: '245 158 11', swatchClass: 'bg-amber-500' },
];

function loadTweaks(): TweaksState {
    if (typeof window === 'undefined') return DEFAULT_TWEAKS;
    try {
        const saved = window.localStorage.getItem(TWEAKS_KEY);
        if (!saved) return DEFAULT_TWEAKS;
        const parsed = JSON.parse(saved) as Partial<TweaksState>;
        return {
            accent: parsed.accent ?? DEFAULT_TWEAKS.accent,
            radius: typeof parsed.radius === 'number' ? parsed.radius : DEFAULT_TWEAKS.radius,
            density: parsed.density ?? DEFAULT_TWEAKS.density,
        };
    } catch {
        return DEFAULT_TWEAKS;
    }
}

function applyTweaks(next: TweaksState) {
    if (typeof document === 'undefined') return;
    const accent = ACCENT_OPTIONS.find((item) => item.id === next.accent) ?? ACCENT_OPTIONS[0];
    document.documentElement.style.setProperty('--cvf-accent-rgb', accent.rgb);
    document.documentElement.style.setProperty('--cvf-control-radius', `${Math.max(10, next.radius)}px`);
    document.documentElement.style.setProperty('--cvf-surface-radius', `${Math.max(22, next.radius * 2)}px`);
    document.documentElement.dataset.cvfDensity = next.density;
}

export default function CompactHeader({ onSidebarOpen, onLogoClick, mockAiEnabled }: CompactHeaderProps) {
    const { language } = useLanguage();
    const { theme, setTheme, mounted } = useTheme();
    const [isTweaksOpen, setIsTweaksOpen] = useState(false);
    const [tweaks, setTweaks] = useState<TweaksState>(() => loadTweaks());

    useEffect(() => {
        applyTweaks(tweaks);
    }, [tweaks]);

    const labels = useMemo(() => (
        language === 'vi'
            ? {
                tweaks: 'Tweaks',
                theme: 'Giao diện',
                light: 'Sáng',
                dark: 'Tối',
                accent: 'Màu nhấn',
                radius: 'Bo góc',
                density: 'Mật độ',
                normal: 'Thường',
                compact: 'Gọn',
            }
            : {
                tweaks: 'Tweaks',
                theme: 'Theme',
                light: 'Light',
                dark: 'Dark',
                accent: 'Accent color',
                radius: 'Card radius',
                density: 'Density',
                normal: 'Normal',
                compact: 'Compact',
            }
    ), [language]);

    const updateTweaks = (updates: Partial<TweaksState>) => {
        const next = { ...tweaks, ...updates };
        setTweaks(next);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(TWEAKS_KEY, JSON.stringify(next));
        }
        applyTweaks(next);
    };

    const tweaksButton = (
        <button
            type="button"
            onClick={() => setIsTweaksOpen((value) => !value)}
            className="cvf-control inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/75 dark:hover:bg-white/[0.08]"
        >
            <Settings2 size={15} />
            <span>{labels.tweaks}</span>
        </button>
    );

    return (
        <div className="relative">
            {/* Mobile Header */}
            <header className="bg-[#0d0f1a] border-b border-white/[0.06] sticky top-0 z-50 md:hidden">
                <div className="px-4 py-[11px]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <SidebarToggle onClick={onSidebarOpen} />
                            <Link href="/home" onClick={onLogoClick} className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500">
                                    <Sparkles size={13} color="#fff" strokeWidth={1.75} />
                                </div>
                                <span className="text-white font-bold text-[15px] leading-none tracking-tight">CVF</span>
                                <span className="text-white/25 text-[10px] font-mono tracking-[0.06em]">v1.6</span>
                            </Link>
                            {mockAiEnabled && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] rounded bg-amber-500/20 text-amber-300 border border-amber-500/20">
                                    Demo
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {tweaksButton}
                            <div id="tour-lang-switch">
                                <LanguageToggle />
                            </div>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Desktop Top Bar */}
            <div className="hidden md:flex items-center justify-end gap-3 px-6 py-[11px] bg-[#0d0f1a] border-b border-white/[0.06]">
                {mockAiEnabled && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] rounded bg-amber-500/20 text-amber-300 border border-amber-500/20">
                        Demo
                    </span>
                )}
                {tweaksButton}
                <div id="tour-lang-switch">
                    <LanguageToggle />
                </div>
                <ThemeToggle />
            </div>

            {isTweaksOpen && (
                <div className="fixed right-4 top-20 z-[60] w-[320px] max-w-[calc(100vw-2rem)] cvf-surface border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.4)] dark:border-white/[0.08] dark:bg-[#171b29]">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                            <Settings2 size={18} className="cvf-accent-text" />
                            <span>{labels.tweaks}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsTweaksOpen(false)}
                            className="cvf-control rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-white/80"
                            aria-label="Close tweaks"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-white/35">
                                {labels.theme}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTheme('light')}
                                    className={`cvf-control px-4 py-2 text-sm font-semibold transition ${mounted && theme === 'light' ? 'cvf-accent-bg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/[0.1]'}`}
                                >
                                    {labels.light}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTheme('dark')}
                                    className={`cvf-control px-4 py-2 text-sm font-semibold transition ${mounted && theme === 'dark' ? 'cvf-accent-bg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/[0.1]'}`}
                                >
                                    {labels.dark}
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-white/35">
                                {labels.accent}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {ACCENT_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => updateTweaks({ accent: option.id })}
                                        className={`cvf-control h-10 w-10 border-2 transition ${tweaks.accent === option.id ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
                                        aria-label={option.id}
                                    >
                                        <span className={`block h-full w-full rounded-[inherit] ${option.swatchClass}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-white/35">
                                <span>{labels.radius}</span>
                                <span>{tweaks.radius}px</span>
                            </div>
                            <input
                                type="range"
                                min={10}
                                max={20}
                                step={1}
                                value={tweaks.radius}
                                onChange={(event) => updateTweaks({ radius: Number(event.target.value) })}
                                className="w-full accent-[rgb(var(--cvf-accent-rgb))]"
                            />
                        </div>

                        <div>
                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-white/35">
                                {labels.density}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => updateTweaks({ density: 'normal' })}
                                    className={`cvf-control px-4 py-2 text-sm font-semibold transition ${tweaks.density === 'normal' ? 'cvf-accent-bg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/[0.1]'}`}
                                >
                                    {labels.normal}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateTweaks({ density: 'compact' })}
                                    className={`cvf-control px-4 py-2 text-sm font-semibold transition ${tweaks.density === 'compact' ? 'cvf-accent-bg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/[0.1]'}`}
                                >
                                    {labels.compact}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
