/** @vitest-environment jsdom */
// Text Encoding Exception: checks the Vietnamese text displayed to users.
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { LanguageProvider } from '@/lib/i18n';
import ComplianceReportPage from './page';

afterEach(() => localStorage.removeItem('cvf_language'));

it.each([
  ['vi', 'Báo cáo tuân thủ', 'Chưa có dữ liệu để lập báo cáo tuân thủ.', 'Trang chủ'],
  ['en', 'Compliance report', 'No data is available for a compliance report yet.', 'Home'],
])('shows only the empty report in %s', async (language, title, empty, home) => {
  localStorage.setItem('cvf_language', language);
  const { container } = render(
    <LanguageProvider>
      <ComplianceReportPage />
    </LanguageProvider>,
  );

  expect(await screen.findByRole('heading', { level: 1, name: title })).toBeTruthy();
  expect(screen.getByText(empty)).toBeTruthy();
  expect(screen.getByRole('link', { name: home }).getAttribute('href')).toBe('/');
  expect(screen.queryByRole('button', { name: /pdf|print|in báo cáo/i })).toBeNull();
  expect(container.textContent).not.toMatch(/\d|usr_|system_execute|file_delete|auto.generated|report generated/i);
  expect(screen.queryByRole('table')).toBeNull();
});

it('does not keep a sample report in the page source', () => {
  const source = readFileSync('src/app/reports/compliance/page.tsx', 'utf8');
  expect(source).not.toMatch(/MOCK_REPORT|usr_[35]|window\.print/);
});
