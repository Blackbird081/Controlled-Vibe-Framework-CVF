import { NextRequest, NextResponse } from 'next/server';

import { requireAdminApiSession } from '@/lib/admin-session';
import { getToolInventory } from '@/lib/tool-registry-catalog';

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/tool-registry');
  if (session instanceof NextResponse) {
    return session;
  }

  const inventory = await getToolInventory();

  return NextResponse.json({
    success: true,
    data: inventory.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      enabled: true,
      allowedRoles: tool.allowedRoles,
      policySource: tool.policySource,
      policyUpdatedAt: tool.policyUpdatedAt,
      parameterCount: tool.parameters.length,
    })),
  });
}
