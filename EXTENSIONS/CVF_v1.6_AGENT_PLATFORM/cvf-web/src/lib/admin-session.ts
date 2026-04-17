import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { canAccessAdmin } from '@/lib/enterprise-access';
import { appendAuditEvent } from '@/lib/control-plane-events';

export async function requireAdminSession(targetResource: string) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?from=${encodeURIComponent(targetResource)}`);
  }

  const user = session.user as {
    userId?: string;
    role?: string;
    name?: string | null;
    email?: string | null;
  };

  if (!canAccessAdmin(user.role)) {
    await appendAuditEvent({
      eventType: 'ADMIN_ACCESS_DENIED',
      actorId: user.userId ?? user.email ?? 'unknown-user',
      actorRole: user.role ?? 'unknown',
      targetResource,
      action: 'READ_ADMIN_ROUTE',
      outcome: 'REDIRECTED',
      payload: {
        source: 'server-component',
      },
    });
    redirect('/');
  }

  return session;
}
