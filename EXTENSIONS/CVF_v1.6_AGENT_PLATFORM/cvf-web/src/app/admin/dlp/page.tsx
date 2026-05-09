import { AdminDLPControls } from '@/components/admin/AdminDLPControls';
import { AdminDLPHeader } from '@/components/admin/AdminDLPHeader';
import { requireAdminSession } from '@/lib/admin-session';
import { getActiveDLPPolicy } from '@/lib/policy-reader';

export default async function AdminDLPPage() {
  await requireAdminSession('/admin/dlp');
  const policy = await getActiveDLPPolicy();

  return (
    <div className="space-y-6">
      <AdminDLPHeader />

      <AdminDLPControls initialPatterns={policy?.patterns ?? []} />
    </div>
  );
}
