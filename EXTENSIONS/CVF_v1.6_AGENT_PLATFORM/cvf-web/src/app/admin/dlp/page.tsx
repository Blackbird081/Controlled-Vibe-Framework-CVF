import { AdminDLPControls } from '@/components/admin/AdminDLPControls';
import { requireAdminSession } from '@/lib/admin-session';
import { getActiveDLPPolicy } from '@/lib/policy-reader';

export default async function AdminDLPPage() {
  await requireAdminSession('/admin/dlp');
  const policy = await getActiveDLPPolicy();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Phase D1 • Egress Safety</div>
        <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">DLP Controls</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Redact sensitive data before prompts leave the execute path. Presets are always on, custom regex rules are append-only policy events.
        </p>
      </div>

      <AdminDLPControls initialPatterns={policy?.patterns ?? []} />
    </div>
  );
}
