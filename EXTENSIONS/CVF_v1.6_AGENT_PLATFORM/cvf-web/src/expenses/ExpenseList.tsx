'use client';

// Text Encoding Exception: Vietnamese UI labels and the synthetic notice use Vietnamese letters with diacritics; no other non-ASCII symbol class is added.

import { useId, useState, type CSSProperties } from 'react';

// Synthetic fixture component: VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ.
// Dates are accepted only as real Gregorian YYYY-MM-DD values. No locale or
// host-timezone parsing is used; the month is read straight from the string.
export type ExpenseRecord = Readonly<{
    id: string;
    date: string;
    label: string;
    amount: number;
}>;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const NOTICE = 'VÍ DỤ MINH HỌA - CHƯA CHẠY THẬT - DỮ LIỆU GIẢ';

function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
    if (month === 2) {
        return isLeapYear(year) ? 29 : 28;
    }
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isValidExpenseDate(value: string): boolean {
    const match = DATE_PATTERN.exec(value);
    if (!match) {
        return false;
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12) {
        return false;
    }
    return day >= 1 && day <= daysInMonth(year, month);
}

// Pure and non-mutating: returns a new array in supplied order. An empty month
// keeps every valid row; a YYYY-MM month keeps only exact year/month matches.
// Invalid dates are always excluded, and a malformed month matches nothing.
export function filterExpensesByMonth(
    expenses: ReadonlyArray<ExpenseRecord>,
    month: string,
): ExpenseRecord[] {
    return expenses.filter(
        (expense) =>
            isValidExpenseDate(expense.date) &&
            (month === '' || expense.date.slice(0, 7) === month),
    );
}

const cellStyle: CSSProperties = {
    padding: '8px 10px',
    borderTop: '1px solid var(--cvf-border)',
    textAlign: 'left',
};

const headerStyle: CSSProperties = {
    ...cellStyle,
    borderTop: 'none',
    color: 'var(--cvf-text-secondary)',
    fontSize: 12,
    fontWeight: 600,
};

export function ExpenseList({ expenses }: Readonly<{ expenses: ReadonlyArray<ExpenseRecord> }>) {
    const [month, setMonth] = useState('');
    const titleId = useId();
    const monthId = useId();
    const rows = filterExpensesByMonth(expenses, month);

    return (
        <section
            aria-labelledby={titleId}
            style={{
                background: 'var(--cvf-surface)',
                border: '1px solid var(--cvf-border)',
                borderRadius: 12,
                padding: 16,
                color: 'var(--cvf-text-primary)',
            }}
        >
            <p role="note" style={{ margin: '0 0 12px', color: 'var(--cvf-warning)', fontSize: 12 }}>
                {NOTICE}
            </p>
            <h2 id={titleId} style={{ margin: '0 0 12px', fontSize: 16 }}>
                Chi tiêu
            </h2>
            <label htmlFor={monthId} style={{ display: 'block', marginBottom: 6, color: 'var(--cvf-text-secondary)' }}>
                Lọc theo tháng
            </label>
            <input
                id={monthId}
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                style={{
                    height: 44,
                    boxSizing: 'border-box',
                    borderRadius: 9,
                    padding: '0 10px',
                    background: 'var(--cvf-bg-page)',
                    border: '1px solid var(--cvf-border-strong)',
                    color: 'var(--cvf-text-primary)',
                }}
            />
            {rows.length === 0 ? (
                <p role="status" style={{ margin: '16px 0 0', color: 'var(--cvf-text-secondary)' }}>
                    Không có khoản chi nào. Chọn tháng khác hoặc để trống bộ lọc để xem tất cả.
                </p>
            ) : (
                <table aria-labelledby={titleId} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
                    <thead>
                        <tr>
                            <th scope="col" style={headerStyle}>Ngày</th>
                            <th scope="col" style={headerStyle}>Nội dung</th>
                            <th scope="col" style={{ ...headerStyle, textAlign: 'right' }}>Số tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((expense) => (
                            <tr key={expense.id} data-expense-id={expense.id}>
                                <td style={cellStyle}>{expense.date}</td>
                                <td style={{ ...cellStyle, overflowWrap: 'anywhere' }}>{expense.label}</td>
                                <td style={{ ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                    {expense.amount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}
