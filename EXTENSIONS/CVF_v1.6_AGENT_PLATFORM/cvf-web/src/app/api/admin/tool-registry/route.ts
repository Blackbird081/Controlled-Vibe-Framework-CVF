import { NextResponse } from 'next/server';

import { verifySessionCookie } from '@/lib/middleware-auth';
import { canAccessAdmin } from '@/lib/enterprise-access';
import { getToolInventory } from '@/lib/tool-registry-catalog';

export async function GET() {
  const session = await verifySessionCookie();
  if (!session || !canAccessAdmin(session.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
