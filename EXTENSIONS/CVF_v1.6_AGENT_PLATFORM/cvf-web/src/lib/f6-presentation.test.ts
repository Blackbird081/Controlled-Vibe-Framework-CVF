// Text Encoding Exception: assertions include Vietnamese labels.
import { describe, it, expect } from 'vitest';
import { RISK_OPTIONS } from './governance-context';
import en from './i18n/en.json';
import vi from './i18n/vi.json';
describe('plain navigation and risk labels', () => {
  it('names minimal risk without claiming no risk', () => {
    expect(RISK_OPTIONS.find(option => option.value === 'R0')).toMatchObject({ label: 'Rất thấp', labelEn: 'Minimal' });
  });
  it.each([
    ['vi', vi, 'nav.maoRuns', 'Lịch sử chạy nhiều trợ lý'],
    ['en', en, 'nav.maoRuns', 'Team run history'],
    ['vi', vi, 'nav.landing', 'Trang giới thiệu'],
    ['en', en, 'nav.landing', 'Introduction'],
  ] as const)('uses plain navigation wording in %s', (_language, copy, key, expected) => {
    expect(copy[key]).toBe(expected);
  });
});
