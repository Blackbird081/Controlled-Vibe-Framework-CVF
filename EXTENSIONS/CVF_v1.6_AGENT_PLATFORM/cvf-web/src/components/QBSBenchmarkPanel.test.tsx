import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QBSBenchmarkPanel } from './QBSBenchmarkPanel';

const MOCK_SUMMARY = {
    runs: [
        {
            run: 'R5', run_id: 'qbs1-r5', kappa: 0.714, rho: 0.786,
            paired: 432, agreement_pass: true, hard_gates_pass: true,
            median_delta_b_a1: -0.25, l4_pass: false,
            public_status: 'QBS9_REVIEWER_SCORED_NO_PUBLIC_QBS_CLAIM',
        },
        {
            run: 'R10', run_id: 'qbs1-r10', kappa: 0.379, rho: 0.587,
            paired: 432, agreement_pass: false, hard_gates_pass: true,
            median_delta_b_a1: -0.125, l4_pass: false,
            public_status: 'QBS41_R10_REVIEWER_AGREEMENT_FAIL_NO_PUBLIC_QBS_CLAIM',
        },
    ],
    latest_status: 'QBS41_R10_REVIEWER_AGREEMENT_FAIL_NO_PUBLIC_QBS_CLAIM',
    latest_run: 'qbs1-powered-single-provider-20260512-alibaba-r10',
    family_deltas_r10: [
        {
            family: 'negative_controls',
            median_delta_b_vs_a1: -0.4375,
            negative_delta_task_count: 5,
            positive_delta_task_count: 0,
            zero_delta_task_count: 1,
        },
        {
            family: 'builder_handoff_technical_planning',
            median_delta_b_vs_a1: -0.25,
            negative_delta_task_count: 5,
            positive_delta_task_count: 0,
            zero_delta_task_count: 1,
        },
    ],
    suspended: true,
    suspension_reason: 'Test suspension reason.',
};

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: () => Promise.resolve(MOCK_SUMMARY),
    }));
});

describe('QBSBenchmarkPanel', () => {
    it('renders run history table with R5 and R10', async () => {
        render(<QBSBenchmarkPanel />);
        await waitFor(() => expect(screen.getByText('R5')).toBeTruthy());
        expect(screen.getByText('R10')).toBeTruthy();
    });

    it('shows suspension badge when suspended', async () => {
        render(<QBSBenchmarkPanel />);
        await waitFor(() =>
            expect(screen.getByText(/Reruns suspended/i)).toBeTruthy()
        );
    });

    it('renders family chart labels', async () => {
        render(<QBSBenchmarkPanel />);
        await waitFor(() =>
            expect(screen.getByText('Negative Controls')).toBeTruthy()
        );
        expect(screen.getByText('Builder Handoff')).toBeTruthy();
    });

    it('shows latest status badge', async () => {
        render(<QBSBenchmarkPanel />);
        await waitFor(() =>
            expect(screen.getByText('QBS41_R10_REVIEWER_AGREEMENT_FAIL_NO_PUBLIC_QBS_CLAIM')).toBeTruthy()
        );
    });

    it('shows error message on fetch failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
        render(<QBSBenchmarkPanel />);
        await waitFor(() =>
            expect(screen.getByText(/Failed to load benchmark data/i)).toBeTruthy()
        );
    });
});
