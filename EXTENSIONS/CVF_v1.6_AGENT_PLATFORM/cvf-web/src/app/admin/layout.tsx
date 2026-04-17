import Link from 'next/link';

import { requireAdminSession } from '@/lib/admin-session';

const ADMIN_NAV_ITEMS = [
  { href: '/admin/finops', label: 'FinOps Dashboard', icon: '💰' },
  { href: '/admin/audit-log', label: 'Audit Log', icon: '📋' },
  { href: '/admin/tool-registry', label: 'Tool Registry', icon: '🛠️' },
  { href: '/admin/approvals', label: 'Approvals', icon: '📥' },
  { href: '/admin/team', label: 'Team Roles', icon: '👥' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession('/admin');

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-72 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-5">
            <div className="text-sm text-gray-500 dark:text-gray-400">Admin Control Plane</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Enterprise Console</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Signed in as {(session.user.name || session.user.email || 'Admin')} • {(session.user as { role?: string }).role}
            </p>
          </div>
          <nav className="space-y-2">
            {ADMIN_NAV_ITEMS.map(item => (
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
