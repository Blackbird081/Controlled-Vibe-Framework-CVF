import { requireAdminSession } from '@/lib/admin-session';
import { ApprovalInbox } from '@/components/ApprovalInbox';

export default async function AdminApprovalsPage() {
  await requireAdminSession('/admin/approvals');
  return <ApprovalInbox homePath="/admin/finops" />;
}
