import { AdminSettingsControls } from '@/components/admin/AdminSettingsControls';
import { AdminSettingsHeader } from '@/components/admin/AdminSettingsHeader';
import { requireAdminSession } from '@/lib/admin-session';
import { getActiveSIEMConfig } from '@/lib/policy-reader';

export default async function AdminSettingsPage() {
  await requireAdminSession('/admin/settings');
  const config = await getActiveSIEMConfig();

  return (
    <div className="space-y-6">
      <AdminSettingsHeader />

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
