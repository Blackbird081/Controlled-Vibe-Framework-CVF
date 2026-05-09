import { AdminImpersonationHeader } from '@/components/admin/AdminImpersonationHeader';
import { AdminImpersonationControls } from '@/components/admin/AdminImpersonationControls';
import { requireAdminSession } from '@/lib/admin-session';
import { MOCK_USERS } from '@/lib/mock-enterprise-db';

export default async function AdminImpersonationPage() {
  await requireAdminSession('/admin/impersonate', { ownerOnly: true });

  return (
    <div className="space-y-6">
      <AdminImpersonationHeader />

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
