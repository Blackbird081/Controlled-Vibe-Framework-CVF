import { AdminTeamManager } from '@/components/admin/AdminTeamManager';
import { requireAdminSession } from '@/lib/admin-session';

export default async function AdminTeamPage() {
  await requireAdminSession('/admin/team');
  return <AdminTeamManager />;
}
