'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';

const NAV_ITEMS = [
    { href: '/admin/finops', icon: '💰', en: 'FinOps Dashboard', vi: 'Bảng tài chính' },
    { href: '/admin/audit-log', icon: '📋', en: 'Audit Log', vi: 'Nhật ký hoạt động' },
    { href: '/admin/dlp', icon: '🧼', en: 'DLP Controls', vi: 'Kiểm soát DLP' },
    { href: '/admin/tool-registry', icon: '🛠️', en: 'Tool Registry', vi: 'Đăng ký công cụ' },
    { href: '/admin/approvals', icon: '📥', en: 'Approvals', vi: 'Phê duyệt' },
    { href: '/admin/team', icon: '👥', en: 'Team Roles', vi: 'Phân quyền nhóm' },
    { href: '/admin/settings', icon: '⚙️', en: 'Settings', vi: 'Cài đặt' },
];

interface AdminNavClientProps {
    hasImpersonate: boolean;
    user: string;
    role: string;
    isBreakGlass: boolean;
}

export function AdminNavClient({ hasImpersonate, user, role, isBreakGlass }: AdminNavClientProps) {
    const pathname = usePathname();
    const { language } = useLanguage();
    const vi = language === 'vi';

    const items = hasImpersonate
        ? [...NAV_ITEMS, { href: '/admin/impersonate', icon: '🪪', en: 'Impersonation', vi: 'Mạo danh' }]
        : NAV_ITEMS;

    return (
        <aside className="flex h-full w-80 flex-shrink-0 flex-col overflow-y-auto">
            <div className="rounded-2xl border border-gray-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-white/[0.07] dark:bg-[#171b29]/80">
                <div className="mb-5">
                    <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 dark:bg-indigo-900/50">
                            <span className="text-xs text-indigo-600 dark:text-indigo-400">⚡</span>
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Control Plane
                        </span>
                    </div>
                    <h1 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                        {vi ? 'Console Quản trị' : 'Enterprise Console'}
                    </h1>
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {user} · <span className="capitalize">{role}</span>
                    </p>
                    {isBreakGlass && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                            ⚠ {vi
                                ? 'Đang dùng quyền khẩn cấp. Đổi token sau khi dùng.'
                                : 'Break-glass access active. Rotate token after use.'}
                        </div>
                    )}
                </div>

                <div className="mb-3 h-px bg-gray-100 dark:bg-white/[0.06]" />

                <nav className="space-y-1">
                    {items.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${isActive
                                    ? 'bg-indigo-600 text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,0.7)]'
                                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300'
                                }`}
                            >
                                <span>{item.icon}</span>
                                <span>{vi ? item.vi : item.en}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-4 h-px bg-gray-100 dark:bg-white/[0.06]" />

                <div className="mt-4 space-y-1">
                    <Link
                        href="/home"
                        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
                    >
                        <span>🏠</span>
                        <span>{vi ? 'Về trang chủ' : 'Back to Home'}</span>
                    </Link>
                </div>
            </div>
        </aside>
    );
}
