// Text Encoding Exception: tests the literal Vietnamese reader guidance.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { DOCS } from './docs-data';
it('ships every documented page in both languages and uses current risk guidance', () => {
 for (const locale of ['en','vi']) {
  for (const { slug } of DOCS.flatMap(category => category.items)) {
   expect(readFileSync(`public/content/${locale}/${slug}.md`, 'utf8').trim().length).toBeGreaterThan(0);
  }
  for (const guide of ['agent-skills-catalog', 'custom-skills']) {
   const content = readFileSync(`public/content/${locale}/${guide}.md`, 'utf8');
   expect(content).not.toMatch(/legacy finance entry|mục phân tích tài chính cũ/i);
  }
  const risk=readFileSync(`public/content/${locale}/risk-model.md`, 'utf8');
  expect(risk).toContain('R0'); expect(risk).toContain('R3'); expect(risk).toContain('R4');
  expect(risk).not.toMatch(/R1[^\n]*(Peer review|Đánh giá ngang hàng)/i);
 }
});
