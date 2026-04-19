import Link from 'next/link';

import { requireAdminSession } from '@/lib/admin-session';
import { AdminNavClient } from '@/components/admin/AdminNavClient';
import { AdminHeaderActions } from '@/components/admin/AdminHeaderActions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession('/admin');
  const hasImpersonate = session.role === 'owner';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-[#0d0f1a] dark:via-[#10131d] dark:to-[#0f1220]">
      {/* Top bar — fixed height, never scrolls */}
      <header className="flex-shrink-0 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm dark:border-white/[0.06] dark:bg-[#10131d]/80">
        <div className="mx-auto flex items-center justify-between px-6 py-3 md:px-10">
          <Link href="/home" className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-sm shadow-indigo-500/25">
              V
            </span>
            <span className="text-lg font-bold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
              VibCode
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <AdminHeaderActions />
            <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.08]" />
            <Link
              href="/home"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              <span className="text-base">←</span>
              <span>Dashboard</span>
            </Link>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              Admin
            </span>
          </div>
        </div>
      </header>

      {/* Body row — sidebar fixed, right panel scrolls independently */}
      <div className="flex min-h-0 w-full flex-1 gap-4 overflow-hidden py-6 pr-6 md:pr-10">
        <div className="ml-3 md:ml-4 flex h-full flex-shrink-0">
          <AdminNavClient
            hasImpersonate={hasImpersonate}
            user={session.user}
            role={session.role}
            isBreakGlass={session.authMode === 'break-glass'}
          />
        </div>

        {/* Page content — only this panel scrolls */}
        <section className="min-w-0 flex-1 overflow-y-auto">
          <div className="pb-10">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
