import { describe, it, expect } from 'vitest';
import { unwrapWholeMarkdownFence } from './markdown-output-normalize';

const BODY = '## Heading\n\nSome **bold** text.\n\n- Item A\n- Item B';

describe('unwrapWholeMarkdownFence', () => {
    it('unwraps a whole-output ```markdown fence', () => {
        const input = '```markdown\n' + BODY + '\n```';
        expect(unwrapWholeMarkdownFence(input)).toBe(BODY);
    });

    it('unwraps md and mdx info strings', () => {
        expect(unwrapWholeMarkdownFence('```md\n' + BODY + '\n```')).toBe(BODY);
        expect(unwrapWholeMarkdownFence('```mdx\n' + BODY + '\n```')).toBe(BODY);
    });

    it('does not unwrap an untagged (empty info string) fence', () => {
        const input = '```\n' + BODY + '\n```';
        expect(unwrapWholeMarkdownFence(input)).toBe(input);
    });

    it('does not unwrap an untagged shell script, YAML, Python or table fence', () => {
        const shell = '```\n# install deps\nnpm install\n__init__ = 1\n```';
        const yaml = '~~~\nkey: value\nlist:\n  - a\n~~~';
        const python = '```\ndef __init__(self):\n    pass\n```';
        const table = '```\n+-----+-----+\n| a   | b   |\n+-----+-----+\n```';
        for (const input of [shell, yaml, python, table]) {
            expect(unwrapWholeMarkdownFence(input)).toBe(input);
        }
    });

    it('matches the info string case-insensitively and ignores spaces around it', () => {
        expect(unwrapWholeMarkdownFence('```MARKDOWN\n' + BODY + '\n```')).toBe(BODY);
        expect(unwrapWholeMarkdownFence('```  markdown  \n' + BODY + '\n```')).toBe(BODY);
    });

    it('does not unwrap other languages', () => {
        for (const lang of ['ts', 'typescript', 'json', 'html', 'js', 'text', 'sh', 'bash', 'yaml', 'python', 'markdownx']) {
            const input = '```' + lang + '\n' + BODY + '\n```';
            expect(unwrapWholeMarkdownFence(input)).toBe(input);
        }
    });

    it('does not unwrap when text exists before the fence', () => {
        const input = 'Here you go:\n```markdown\n' + BODY + '\n```';
        expect(unwrapWholeMarkdownFence(input)).toBe(input);
    });

    it('does not unwrap when text exists after the fence', () => {
        const input = '```markdown\n' + BODY + '\n```\nThanks!';
        expect(unwrapWholeMarkdownFence(input)).toBe(input);
    });

    it('does not unwrap when an early closing fence is followed by more text', () => {
        const input = '```markdown\n## Part 1\n\n```\n\n## Part 2\n\nMore text\n```';
        expect(unwrapWholeMarkdownFence(input)).toBe(input);
    });

    it('does not unwrap when a same-length closing fence appears before the final line', () => {
        const input = '```markdown\n' + BODY + '\n```\n' + BODY + '\n```';
        expect(unwrapWholeMarkdownFence(input)).toBe(input);
    });

    it('does not unwrap when the closing fence is missing', () => {
        const input = '```markdown\n' + BODY;
        expect(unwrapWholeMarkdownFence(input)).toBe(input);
    });

    it('does not unwrap when the closing fence uses a different character', () => {
        const input = '```markdown\n' + BODY + '\n~~~';
        expect(unwrapWholeMarkdownFence(input)).toBe(input);
    });

    it('does not unwrap when the closing fence is shorter than the opening fence', () => {
        const input = '````markdown\n' + BODY + '\n```';
        expect(unwrapWholeMarkdownFence(input)).toBe(input);
    });

    it('does not treat a fence line carrying an info string as a closing fence', () => {
        const input = '```markdown\n```ts\ncode\n```ts\n```';
        expect(unwrapWholeMarkdownFence(input)).toBe('```ts\ncode\n```ts');
    });

    it('keeps nested 3-backtick fences inside a 4-backtick wrapper', () => {
        const inner = '## Example\n\n```ts\nconst a = 1;\n```\n\nDone.';
        const input = '````markdown\n' + inner + '\n````';
        expect(unwrapWholeMarkdownFence(input)).toBe(inner);
    });

    it('does not unwrap a 3-backtick wrapper that contains a bare 3-backtick fence (closes early)', () => {
        const input = '```markdown\nIntro\n\n```\ncode\n```\n\nOutro\n```';
        expect(unwrapWholeMarkdownFence(input)).toBe(input);
    });

    it('unwraps a ~~~ fence and keeps backtick fences inside it', () => {
        const inner = '## Title\n\n```js\nlet x = 1;\n```';
        const input = '~~~markdown\n' + inner + '\n~~~';
        expect(unwrapWholeMarkdownFence(input)).toBe(inner);
    });

    it('handles CRLF line endings', () => {
        const input = '```markdown\r\n## Heading\r\n\r\nSome text.\r\n```';
        expect(unwrapWholeMarkdownFence(input)).toBe('## Heading\n\nSome text.');
    });

    it('does not unwrap a CRLF ts fence', () => {
        const input = '```ts\r\nconst a = 1;\r\n```';
        expect(unwrapWholeMarkdownFence(input)).toBe(input);
    });

    it('ignores a leading BOM and surrounding whitespace', () => {
        const input = '\uFEFF \n```markdown\n' + BODY + '\n```\n\n';
        expect(unwrapWholeMarkdownFence(input)).toBe(BODY);
    });

    it('accepts trailing spaces and tabs on the closing fence', () => {
        const input = '```markdown\n' + BODY + '\n```  \t';
        expect(unwrapWholeMarkdownFence(input)).toBe(BODY);
    });

    it('returns unfenced markdown unchanged', () => {
        expect(unwrapWholeMarkdownFence(BODY)).toBe(BODY);
    });

    it('returns single-line and empty input unchanged', () => {
        expect(unwrapWholeMarkdownFence('')).toBe('');
        expect(unwrapWholeMarkdownFence('```markdown')).toBe('```markdown');
    });
});
