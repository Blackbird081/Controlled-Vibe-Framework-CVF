import type { TeamRole } from 'cvf-guard-contract/enterprise';

import { getActiveToolPolicy } from '@/lib/policy-reader';
import { TOOL_REGISTRY_CATALOG, TOOL_ROLE_MATRIX } from '@/lib/tool-registry-catalog';

export function getDefaultToolRoles(toolId: string): TeamRole[] {
  const tool = TOOL_REGISTRY_CATALOG.find(entry => entry.id === toolId);
  if (!tool) {
    return ['owner', 'admin'];
  }

  return TOOL_ROLE_MATRIX[tool.category] ?? ['owner', 'admin'];
}

export async function getEffectiveToolRoles(toolId: string): Promise<TeamRole[]> {
  const policy = await getActiveToolPolicy(toolId);
  return policy?.allowedRoles ?? getDefaultToolRoles(toolId);
}

export async function canUseTool(toolId: string, role?: TeamRole): Promise<boolean> {
  if (!role) return false;
  const allowedRoles = await getEffectiveToolRoles(toolId);
  return allowedRoles.includes(role);
}
