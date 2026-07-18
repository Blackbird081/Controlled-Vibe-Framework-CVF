import { verifySessionCookie } from '@/lib/middleware-auth';
import OperationsClient from './OperationsClient';

export default async function GovernanceOperationsPage() {
    const session = await verifySessionCookie();
    return <OperationsClient initialRole={session?.role} initialUser={session?.user} />;
}
