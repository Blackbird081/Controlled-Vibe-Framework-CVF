import Link from 'next/link';

import { requireAdminSession } from '@/lib/admin-session';

const ADMIN_NAV_ITEMS = [
  { href: '/admin/finops', label: 'FinOps Dashboard', icon: '💰' },
  { href: '/admin/audit-log', label: 'Audit Log', icon: '📋' },
  { href: '/admin/dlp', label: 'DLP Controls', icon: '🧼' },
  { href: '/admin/tool-registry', label: 'Tool Registry', icon: '🛠️' },
  { href: '/admin/approvals', label: 'Approvals', icon: '📥' },
  { href: '/admin/team', label: 'Team Roles', icon: '👥' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession('/admin');
  const navItems = session.role === 'owner'
    ? [...ADMIN_NAV_ITEMS, { href: '/admin/impersonate', label: 'Impersonation', icon: '🪪' }]
    : ADMIN_NAV_ITEMS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20">
      {/* Top bar — brand connection to main site */}
      <header className="border-b border-gray-200/60 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex items-center justify-between px-6 py-3 md:px-10">
          <Link href="/home" className="flex items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-sm font-bold shadow-sm shadow-indigo-500/25">
              V
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              VibCode
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <span className="text-base">←</span>
              <span>Dashboard</span>
            </Link>
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              Admin
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-[1400px] px-6 py-6 md:px-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-6 rounded-2xl border border-gray-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/70">
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
                  Enterprise Console
                </h1>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                  {session.user} · <span className="capitalize">{session.role}</span>
                </p>
                {session.authMode === 'break-glass' && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    ⚠ Break-glass access active. Rotate token after use.
                  </div>
                )}
              </div>

              <div className="mb-3 h-px bg-gray-100 dark:bg-gray-800" />

              <nav className="space-y-1">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-400 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-4 h-px bg-gray-100 dark:bg-gray-800" />

              {/* Quick links back */}
              <div className="mt-4 space-y-1">
                <Link
                  href="/home"
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <span>🏠</span>
                  <span>Back to Home</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Page content */}
          <section className="min-w-0 flex-1">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
