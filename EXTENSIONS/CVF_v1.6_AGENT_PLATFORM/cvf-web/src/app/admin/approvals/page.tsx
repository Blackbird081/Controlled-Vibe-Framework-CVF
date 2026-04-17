import { redirect } from 'next/navigation';

import { requireAdminSession } from '@/lib/admin-session';

export default async function AdminApprovalsPage() {
  await requireAdminSession('/admin/approvals');
  redirect('/approvals?riskLevel=R3');
}
