// Text Encoding Exception: Vietnamese result-review status is operator-facing copy.
import type { GovernanceRolePlanSummary } from '@/lib/ai/types';
import { finalReviewDetail, finalRolePlanReview } from '@/lib/role-plan-review-status';

export function RolePlanReviewNotice({ plan, isVi }: { plan?: GovernanceRolePlanSummary; isVi: boolean }) {
    if (!plan || finalRolePlanReview(plan).confirmed) return null;
    return (
        <section role="status" data-testid="role-plan-review-notice"
            className="mb-4 rounded-xl border border-amber-500 bg-white p-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
            <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                {isVi ? 'Duyệt cuối chưa xác nhận' : 'Final review unconfirmed'}
            </h2>
            <p className="mt-2 text-sm">{finalReviewDetail(plan, isVi)}</p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {isVi ? 'Bạn vẫn có thể đọc và xuất tệp bản nháp. Hãy kiểm tra nội dung trước khi sử dụng.'
                    : 'You can still read and export the draft. Check its content before use.'}
            </p>
        </section>
    );
}
