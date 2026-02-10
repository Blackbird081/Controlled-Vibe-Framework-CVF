'use client';

import Link from 'next/link';
import { SidebarToggle } from '@/components';
import { ThemeToggle } from '@/lib/theme';
import { LanguageToggle } from '@/lib/i18n';

interface CompactHeaderProps {
    onSidebarOpen: () => void;
    onLogoClick: () => void;
    mockAiEnabled: boolean;
}

export default function CompactHeader({ onSidebarOpen, onLogoClick, mockAiEnabled }: CompactHeaderProps) {
    return (
        <>
            {/* Mobile Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 md:hidden">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <SidebarToggle onClick={onSidebarOpen} />
                            <Link href="/" onClick={onLogoClick}>
                                <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <span>🎯</span>
                                    <span>CVF v1.6</span>
                                </h1>
                            </Link>
                            {mockAiEnabled && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                    Demo
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div id="tour-lang-switch">
                                <LanguageToggle />
                            </div>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Desktop Top Bar */}
            <div className="hidden md:flex items-center justify-end gap-3 px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {mockAiEnabled && (
                    <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        Demo Mode
                    </span>
                )}
                <div id="tour-lang-switch">
                    <LanguageToggle />
                </div>
                <ThemeToggle />
            </div>
        </>
    );
}
