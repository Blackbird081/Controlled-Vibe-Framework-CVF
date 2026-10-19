import { handleSaveReview } from '@/lib/intent-spec-review-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    return handleSaveReview(request);
}
