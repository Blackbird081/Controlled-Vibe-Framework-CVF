import { AdminKnowledgePartitioningControls } from '@/components/admin/AdminKnowledgePartitioningControls';
import { AdminToolPolicyControls } from '@/components/admin/AdminToolPolicyControls';
import { requireAdminSession } from '@/lib/admin-session';
import { listKnowledgeCollections } from '@/lib/knowledge-retrieval';
import { MOCK_ORGANIZATIONS, MOCK_TEAMS } from '@/lib/mock-enterprise-db';
import { getToolInventory } from '@/lib/tool-registry-catalog';

export default async function AdminToolRegistryPage() {
  await requireAdminSession('/admin/tool-registry');
  const [tools, collections] = await Promise.all([
    getToolInventory(),
    listKnowledgeCollections(),
  ]);

  const organizations = MOCK_ORGANIZATIONS.map(org => ({ id: org.id, name: org.name }));
  const teams = MOCK_TEAMS.map(team => ({ id: team.id, orgId: team.orgId, name: team.name }));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Phase D • Runtime policy + knowledge partitioning</div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">Tool Registry Controls</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Dynamic tool inventory with role policy overrides and knowledge collection scoping persisted through the append-only control-plane store.
        </p>
      </div>

      <AdminToolPolicyControls initialTools={tools} />

      <AdminKnowledgePartitioningControls
        initialCollections={collections}
        organizations={organizations}
        teams={teams}
      />
    </div>
  );
}
