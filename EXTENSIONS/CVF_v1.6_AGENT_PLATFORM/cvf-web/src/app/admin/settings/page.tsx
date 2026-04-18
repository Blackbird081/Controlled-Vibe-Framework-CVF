import { AdminSettingsControls } from '@/components/admin/AdminSettingsControls';
import { requireAdminSession } from '@/lib/admin-session';
import { getActiveSIEMConfig } from '@/lib/policy-reader';

export default async function AdminSettingsPage() {
  await requireAdminSession('/admin/settings');
  const config = await getActiveSIEMConfig();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Phase D2 • Enterprise Hardening</div>
        <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure outbound audit delivery and enterprise hardening controls for the admin console.
        </p>
      </div>

      <AdminSettingsControls initialConfig={{
        webhookUrl: config?.webhookUrl ?? '',
        signingSecret: config?.signingSecret ?? '',
        enabled: config?.enabled ?? false,
        eventTypes: config?.eventTypes ?? 'audit',
      }}
      />
    </div>
  );
}
