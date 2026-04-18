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
    <div className="px-6 py-8 md:px-10">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-72 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-5">
            <div className="text-sm text-gray-500 dark:text-gray-400">Admin Control Plane</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Enterprise Console</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Signed in as {session.user} • {session.role}
            </p>
            {session.authMode === 'break-glass' && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                Break-glass access is active. Rotate the token immediately after use.
              </div>
            )}
          </div>
          <nav className="space-y-2">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 flex-1">
          {children}
        </section>
      </div>
    </div>
  );
}
