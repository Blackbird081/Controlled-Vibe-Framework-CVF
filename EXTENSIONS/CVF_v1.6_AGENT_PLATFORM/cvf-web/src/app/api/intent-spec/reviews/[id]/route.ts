import { handleReadReview } from '@/lib/intent-spec-review-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    return handleReadReview(request, (await params).id);
}
