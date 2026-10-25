// Text Encoding Exception: Vietnamese fictional-content labels and existing localized text use UTF-8.
const esc = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const headingId = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-+$/g, '');

export interface HtmlPilotRenderedPage { html: string; title: string; ctaTarget: '#lien-he' }

export const HTML_PILOT_CREATE_TITLE = 'Không gian đọc Ánh Sao';
export const HTML_PILOT_REVISION_TITLE = 'Ngày hội đọc Ánh Sao';

/** The signed lineage fixes the only two titles this pilot is authorized to render. */
export function renderLockedHtmlPilotSource(markdown: string, parentRunId: string | null): HtmlPilotRenderedPage | null {
  return renderHtmlPilotPage(markdown, parentRunId === null ? HTML_PILOT_CREATE_TITLE : HTML_PILOT_REVISION_TITLE);
}

/** Match the artifact export route's existing filename rule for the immutable saved form. */
export function htmlPilotFilename(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
  return `${slug.slice(0, 70) || 'cvf-artifact'}.html`;
}

/** A deliberately tiny content grammar: no raw HTML, arbitrary links or external assets. */
export function renderHtmlPilotPage(markdown: string, expectedTitle: string): HtmlPilotRenderedPage | null {
  if (typeof markdown !== 'string' || markdown.length > 2400 || !markdown.trim() || markdown.includes('<')
    || markdown.includes('>') && !markdown.includes(' -> ') || /(?:https?:|www\.|javascript:|data:|@|\[[^\]]+\]\(|!\[)/i.test(markdown)) return null;
  const words = markdown.trim().split(/\s+/u);
  if (words.length > 180) return null;
  const lines = markdown.replace(/\r\n/g, '\n').split('\n').map(line => line.trim()).filter(Boolean);
  if (lines[0] !== `# ${expectedTitle}`) return null;
  const sections = ['Giới thiệu', 'Hoạt động', 'Liên hệ'];
  const positions = sections.map(name => lines.indexOf(`## ${name}`));
  if (positions.some((position, index) => position < 1 || (index && position <= positions[index - 1]))) return null;
  const ctas = lines.filter(line => line.startsWith('CTA:'));
  if (ctas.length !== 1 || ctas[0] !== 'CTA: Đăng ký tham gia -> Liên hệ' || lines.at(-1) !== ctas[0]) return null;
  if (lines.some((line, index) => line.startsWith('#') && index !== 0 && !sections.some(name => line === `## ${name}`))) return null;
  const body = sections.map((section, index) => {
    const start = positions[index] + 1;
    const end = index === sections.length - 1 ? lines.length - 1 : positions[index + 1];
    const content = lines.slice(start, end);
    if (!content.length || content.some(line => line.startsWith('CTA:') || line.startsWith('#'))) return null;
    return `<section id="${headingId(section)}"><h2>${esc(section)}</h2>${content.map(line => `<p>${esc(line)}</p>`).join('')}</section>`;
  });
  if (body.includes(null) || headingId('Liên hệ') !== 'lien-he') return null;
  const html = `<!doctype html>\n<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(expectedTitle)}</title><style>body{font-family:system-ui,sans-serif;line-height:1.6;margin:0;background:#f6f7fb;color:#111827}main{max-width:800px;margin:auto;padding:24px}section{background:#fff;border:1px solid #d9dee8;border-radius:12px;padding:20px;margin:16px 0}a{display:inline-block;padding:12px 18px;background:#243b82;color:#fff;border-radius:8px}a:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}</style></head><body><main><h1>${esc(expectedTitle)}</h1>${body.join('')}<a href="#lien-he">Đăng ký tham gia</a></main></body></html>`;
  return { html, title: expectedTitle, ctaTarget: '#lien-he' };
}
