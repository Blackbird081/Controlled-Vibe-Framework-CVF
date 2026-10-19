// Text Encoding Exception: Vietnamese fixture labels, UI strings and date-rule notes use Vietnamese letters with diacritics; no other non-ASCII symbol class is added.
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ExpenseList, filterExpensesByMonth, type ExpenseRecord } from './ExpenseList';

// Five manually authored synthetic rows (VÍ DỤ MINH HỌA - DỮ LIỆU GIẢ).
// Order is deliberately not chronological, so order preservation is observable.
// The wrong-format date is dd/mm/yyyy: a locale parser would read it as March.
const FIXTURE: ReadonlyArray<ExpenseRecord> = Object.freeze([
    Object.freeze({ id: 'exp-mar-late', date: '2026-03-21', label: 'Chi phí thử D', amount: 60000 }),
    Object.freeze({ id: 'exp-feb-early', date: '2026-02-03', label: 'Chi phí thử A', amount: 120000 }),
    Object.freeze({ id: 'exp-mar-early', date: '2026-03-05', label: 'Chi phí thử C', amount: 240000 }),
    Object.freeze({ id: 'exp-wrong-format', date: '05/03/2026', label: 'Chi phí thử E', amount: 30000 }),
    Object.freeze({ id: 'exp-feb-late', date: '2026-02-18', label: 'Chi phí thử B', amount: 85000 }),
]);

const ALL_VALID_IDS = ['exp-mar-late', 'exp-feb-early', 'exp-mar-early', 'exp-feb-late'];

function withDate(id: string, date: string): ExpenseRecord[] {
    return FIXTURE.map((expense) => (expense.id === id ? { ...expense, date } : expense));
}

function selectMonth(value: string) {
    fireEvent.change(screen.getByLabelText('Lọc theo tháng'), { target: { value } });
}

function renderedIds(): string[] {
    const table = screen.queryByRole('table');
    if (!table) {
        return [];
    }
    return within(table)
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.getAttribute('data-expense-id') ?? '');
}

describe('ExpenseList render cases', () => {
    it('shows all four valid rows in supplied order and skips the wrong-format row', () => {
        render(<ExpenseList expenses={FIXTURE} />);

        expect(renderedIds()).toEqual(ALL_VALID_IDS);
        expect(screen.queryByText('Chi phí thử E')).toBeNull();
    });

    it('shows only the two March 2026 rows when 2026-03 is selected', () => {
        render(<ExpenseList expenses={FIXTURE} />);

        selectMonth('2026-03');

        expect(renderedIds()).toEqual(['exp-mar-late', 'exp-mar-early']);
    });

    it('shows the no-expenses message for an empty month (2026-04)', () => {
        render(<ExpenseList expenses={FIXTURE} />);

        selectMonth('2026-04');

        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.getByRole('status').textContent).toContain('Không có khoản chi nào.');
    });

    it('restores all four valid rows after the month filter is cleared', () => {
        render(<ExpenseList expenses={FIXTURE} />);

        selectMonth('2026-03');
        selectMonth('');

        expect(renderedIds()).toEqual(ALL_VALID_IDS);
    });
});

describe('ExpenseList accessibility, notice and immutability', () => {
    it('labels a native month input in Vietnamese and shows the synthetic notice', () => {
        render(<ExpenseList expenses={FIXTURE} />);

        const input = screen.getByLabelText('Lọc theo tháng');
        expect(input.getAttribute('type')).toBe('month');
        expect(screen.getByRole('note').textContent).toBe('VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ');
    });

    it('does not mutate the supplied expenses while filtering', () => {
        const before = JSON.stringify(FIXTURE);

        render(<ExpenseList expenses={FIXTURE} />);
        selectMonth('2026-03');
        selectMonth('');

        expect(JSON.stringify(FIXTURE)).toBe(before);
        expect(FIXTURE.map((expense) => expense.id)).toEqual([
            'exp-mar-late',
            'exp-feb-early',
            'exp-mar-early',
            'exp-wrong-format',
            'exp-feb-late',
        ]);
    });
});

describe('ExpenseList negative cases on the same fixture', () => {
    it('keeps a same-month row from another year out of 2026-03', () => {
        render(<ExpenseList expenses={withDate('exp-mar-late', '2025-03-21')} />);

        selectMonth('2026-03');

        expect(renderedIds()).toEqual(['exp-mar-early']);
    });

    it('shows a real leap day only in its own leap month', () => {
        render(<ExpenseList expenses={withDate('exp-feb-late', '2024-02-29')} />);

        selectMonth('2024-02');

        expect(renderedIds()).toEqual(['exp-feb-late']);
    });

    it('drops Feb 29 in a non-leap year without crashing or moving the row into February', () => {
        render(<ExpenseList expenses={withDate('exp-feb-late', '2026-02-29')} />);

        selectMonth('2026-02');
        expect(renderedIds()).toEqual(['exp-feb-early']);

        selectMonth('');
        expect(renderedIds()).toEqual(['exp-mar-late', 'exp-feb-early', 'exp-mar-early']);
    });
});

describe('filterExpensesByMonth date rules', () => {
    const acceptedAsDate = (date: string) =>
        filterExpensesByMonth([{ id: 'probe', date, label: 'probe', amount: 1 }], '').length === 1;

    it('accepts real Gregorian YYYY-MM-DD dates, including leap days in leap years', () => {
        const accepted = ['2026-01-01', '2026-03-05', '2026-03-31', '2026-04-30', '2026-12-31', '2024-02-29', '2000-02-29'];
        for (const date of accepted) {
            expect(acceptedAsDate(date), date).toBe(true);
        }
    });

    it('rejects malformed, unpadded, locale-style and nonexistent dates', () => {
        const rejected = [
            '05/03/2026', '03-05-2026', '2026/03/05', '20260305', '2026-3-05', '2026-03-5',
            '2026-3-5', '2026-03-05T00:00:00Z', ' 2026-03-05', '2026-03-05 ', '',
            '2026-00-10', '2026-13-01', '2026-03-00', '2026-02-30', '2026-04-31',
            '2026-02-29', '2025-02-29', '1900-02-29', '2100-02-29',
        ];
        for (const date of rejected) {
            expect(acceptedAsDate(date), date).toBe(false);
        }
    });

    it('matches only the exact YYYY-MM month and fails closed on malformed month text', () => {
        const rows: ExpenseRecord[] = [
            { id: 'end-of-march', date: '2026-03-31', label: 'a', amount: 1 },
            { id: 'start-of-april', date: '2026-04-01', label: 'b', amount: 1 },
            { id: 'march-2025', date: '2025-03-15', label: 'c', amount: 1 },
        ];

        expect(filterExpensesByMonth(rows, '2026-03').map((row) => row.id)).toEqual(['end-of-march']);
        expect(filterExpensesByMonth(rows, '2026-3')).toEqual([]);
        expect(filterExpensesByMonth(rows, '2026-13')).toEqual([]);
    });
});
