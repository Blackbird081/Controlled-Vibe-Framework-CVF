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

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <div className="font-semibold">Knowledge partitioning status</div>
        <p className="mt-2">
          Tenant scope plumbing is ready for future retrieval adapters via `orgId` and `teamId`, but chunk-level enforcement is intentionally not claimed yet because the current knowledge path still injects pre-built context strings rather than querying partitioned collections.
        </p>
      </div>

      <AdminToolPolicyControls initialTools={tools} />
    </div>
  );
}
