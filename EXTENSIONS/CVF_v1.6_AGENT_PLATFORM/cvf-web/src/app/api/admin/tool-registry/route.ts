import { NextResponse } from 'next/server';

import { verifySessionCookie } from '@/lib/middleware-auth';
import { canAccessAdmin } from '@/lib/enterprise-access';
import { TOOL_REGISTRY_CATALOG, TOOL_ROLE_MATRIX } from '@/lib/tool-registry-catalog';

export async function GET() {
  const session = await verifySessionCookie();
  if (!session || !canAccessAdmin(session.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const inventory = TOOL_REGISTRY_CATALOG.map(tool => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    enabled: true,
    allowedRoles: TOOL_ROLE_MATRIX[tool.category] ?? ['owner', 'admin'],
    parameterCount: tool.parameters.length,
  }));

  return NextResponse.json({ success: true, data: inventory });
}
