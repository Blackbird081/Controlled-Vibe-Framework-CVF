/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DecisionLogSidebar } from './DecisionLogSidebar';

describe('DecisionLogSidebar', () => {
    it('renders empty state and triggers close/clear', () => {
        const onClose = vi.fn();
        const onClear = vi.fn();

        render(
            <DecisionLogSidebar
                entries={[]}
                onClose={onClose}
                onClear={onClear}
                language="vi"
            />
        );

        expect(screen.getByText('Chưa có quyết định nào')).toBeTruthy();

        fireEvent.click(screen.getByTitle('Đóng'));
        fireEvent.click(screen.getByText('Xóa log'));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('renders entries with action labels and details', () => {
        render(
            <DecisionLogSidebar
                entries={[
                    {
                        id: '1',
                        phase: 'Discovery',
                        action: 'gate_approved',
                        details: 'Approved',
                        timestamp: new Date('2026-02-07T10:00:00Z'),
                    },
                ]}
                onClose={vi.fn()}
                onClear={vi.fn()}
                language="en"
            />
        );

        expect(screen.getByText('Gate approved')).toBeTruthy();
        expect(screen.getByText('Approved')).toBeTruthy();
    });
});
