// Text Encoding Exception: Vietnamese fictional-content labels and existing localized text use UTF-8.
import { describe, expect, it } from 'vitest';
import { htmlPilotFilename, renderHtmlPilotPage, renderLockedHtmlPilotSource } from './html-cta-rendering';

const good = '# Không gian đọc Ánh Sao\n## Giới thiệu\nKhông gian hư cấu.\n## Hoạt động\nĐọc sách cùng nhau.\n## Liên hệ\nGặp tại khu sinh hoạt.\nCTA: Đăng ký tham gia -> Liên hệ';
describe('tiny safe HTML grammar', () => {
  it('renders one escaped same-document CTA', () => {
    const page = renderHtmlPilotPage(good.replace('Đọc sách cùng nhau.', 'Đọc sách & chia sẻ.'), 'Không gian đọc Ánh Sao');
    expect(page?.html).toContain('href="#lien-he"');
    expect(page?.html).toContain('&amp;');
    expect(page?.html).not.toContain('<script');
  });
  it('rejects arbitrary link, script and wrong title/CTA', () => {
    expect(renderHtmlPilotPage(`${good}\nhttps://example.invalid`, 'Không gian đọc Ánh Sao')).toBeNull();
    expect(renderHtmlPilotPage(good.replace('Đọc sách cùng nhau.', '<script>alert(1)</script>'), 'Không gian đọc Ánh Sao')).toBeNull();
    expect(renderHtmlPilotPage(good.replace('CTA: Đăng ký tham gia -> Liên hệ', 'CTA: Đi ngay -> https://x.invalid'), 'Không gian đọc Ánh Sao')).toBeNull();
    expect(renderHtmlPilotPage(good, 'Other')).toBeNull();
  });
  it('binds the two locked headings to signed parent lineage', () => {
    expect(renderLockedHtmlPilotSource(good, null)?.title).toBe('Không gian đọc Ánh Sao');
    expect(renderLockedHtmlPilotSource(good, 'parent')).toBeNull();
    const revised = good.replace('Không gian đọc Ánh Sao', 'Ngày hội đọc Ánh Sao');
    expect(renderLockedHtmlPilotSource(revised, 'parent')?.title).toBe('Ngày hội đọc Ánh Sao');
    expect(renderLockedHtmlPilotSource(revised, null)).toBeNull();
    expect(htmlPilotFilename('Không gian đọc Ánh Sao')).toBe('kh-ng-gian-c-nh-sao.html');
  });
});
