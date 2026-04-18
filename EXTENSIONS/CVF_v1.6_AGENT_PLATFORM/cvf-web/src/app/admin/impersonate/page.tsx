import { AdminImpersonationControls } from '@/components/admin/AdminImpersonationControls';
import { requireAdminSession } from '@/lib/admin-session';
import { MOCK_USERS } from '@/lib/mock-enterprise-db';

export default async function AdminImpersonationPage() {
  await requireAdminSession('/admin/impersonate', { ownerOnly: true });

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Phase D2 • Enterprise Hardening</div>
        <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">Impersonation</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Owner-only support tool for reproducing user experiences without mutating the real NextAuth session.
        </p>
      </div>

      <AdminImpersonationControls users={MOCK_USERS.filter(user => user.role !== 'owner').map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
      }))}
      />
    </div>
  );
}
