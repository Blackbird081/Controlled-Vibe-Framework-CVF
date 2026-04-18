import { AdminToolPolicyControls } from '@/components/admin/AdminToolPolicyControls';
import { requireAdminSession } from '@/lib/admin-session';
import { getToolInventory } from '@/lib/tool-registry-catalog';

export default async function AdminToolRegistryPage() {
  await requireAdminSession('/admin/tool-registry');
  const tools = await getToolInventory();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Phase C • Runtime policy</div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">Tool Registry Controls</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Dynamic tool inventory with role policy overrides persisted through the append-only control-plane store.
        </p>
      </div>

      <AdminToolPolicyControls initialTools={tools} />
    </div>
  );
}
