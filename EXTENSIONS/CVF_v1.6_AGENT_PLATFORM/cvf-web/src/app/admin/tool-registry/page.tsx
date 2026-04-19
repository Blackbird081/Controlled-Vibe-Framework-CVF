import { AdminKnowledgePartitioningControls } from '@/components/admin/AdminKnowledgePartitioningControls';
import { AdminToolPolicyControls } from '@/components/admin/AdminToolPolicyControls';
import { AdminToolRegistryHeader } from '@/components/admin/AdminToolRegistryHeader';
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
      <AdminToolRegistryHeader />

      <AdminToolPolicyControls initialTools={tools} />

      <AdminKnowledgePartitioningControls
        initialCollections={collections}
        organizations={organizations}
        teams={teams}
      />
    </div>
  );
}
