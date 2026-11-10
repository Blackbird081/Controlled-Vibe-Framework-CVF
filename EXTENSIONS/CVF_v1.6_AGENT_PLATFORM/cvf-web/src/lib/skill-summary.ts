// Text Encoding Exception: Vietnamese purpose headings and labels are required native parser literals.
const PURPOSE_HEADING = /^#{1,4}[^\n]*Mục đích[^\n]*$/im;
const WHEN_LABEL = /^(?:Khi nào(?: nên)? dùng(?: skill này)?|When to use(?: this skill)?)$/i;
const AVOID_LABEL = /^(?:Không phù hợp(?: khi)?|Not suitable(?: when)?)$/i;
const LABEL_LINE = /^\*\*([^*\n]{1,60}?)\s*:\*\*\s*$/;

export function summarizeSkillContent(content: string): string {
    const text = content.replace(/\r\n?/g, '\n');
    const heading = PURPOSE_HEADING.exec(text);
    if (!heading) return '';
    const section = text.slice(heading.index + heading[0].length).split(/\n(?:---|#{1,4} )/)[0];
    const lead: string[] = [], when: string[] = [], avoid: string[] = [];
    let target: string[] | null = lead;
    for (const raw of section.split('\n')) {
        const line = raw.trim();
        const label = LABEL_LINE.exec(line);
        if (label) {
            target = WHEN_LABEL.test(label[1].trim()) ? when : AVOID_LABEL.test(label[1].trim()) ? avoid : null;
            continue;
        }
        if (!line) {
            if (target !== lead) target = null;
            continue;
        }
        if (target) target.push(line.replace(/^>\s*/, '').replace(/^[-*]\s+/, ''));
    }
    const clean = (value: string, max: number): string => value.replace(/\s+/g, ' ').trim().slice(0, max);
    const leadText = clean(lead.join(' '), 160);
    // Strip bold markers after native clipping so the declared delta cannot move its boundary.
    return clean([leadText, when.length ? `Khi nào dùng: ${when.join('; ')}` : ''].filter(Boolean).join(' '), 280).replace(/\*\*/g, '');
}
