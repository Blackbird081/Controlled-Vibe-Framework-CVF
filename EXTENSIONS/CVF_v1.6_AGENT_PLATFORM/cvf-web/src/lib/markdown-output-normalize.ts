/**
 * markdown-output-normalize.ts
 * ============================
 * Display-only normalization for model output that wraps its ENTIRE answer in a
 * single fenced markdown block (for example a first line of "```markdown" and a
 * last line of "```"). Rendering such text as-is shows one big code block instead
 * of formatted markdown.
 *
 * Callers use the result for display and for export content (Markdown, PDF, Word and
 * the pack Main Output). The stored and API output stays raw; this helper never mutates it.
 */

// Only explicit markdown tags are unwrapped. An untagged fence is never unwrapped, because
// it may be a shell script, YAML, Python or a table rather than markdown.
const ALLOWED_INFO_STRINGS = new Set(['markdown', 'md', 'mdx']);

// Opening fence: up to 3 spaces of indent is allowed by CommonMark, but the caller
// trims the whole text first, so the opening line never carries leading spaces.
const OPENING_FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
// Closing fence: marker run followed only by optional spaces or tabs.
const CLOSING_FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;

/**
 * If `text` is exactly one fenced block whose info string is `markdown`, `md` or `mdx`
 * (case-insensitive), return the inner content. Otherwise return `text` unchanged. An
 * empty info string is not unwrapped.
 *
 * A block is unwrapped only when:
 * - after trimming surrounding whitespace (including a BOM), the first line is an
 *   opening fence of ``` or ~~~ (3 or more characters) with an allowed info string;
 * - the last line is a closing fence with the same character and at least the same
 *   length as the opening fence;
 * - no earlier line closes the block, so the opening fence's first closing fence is
 *   the final line and no text sits outside the block.
 *
 * Inner fences of other lengths or characters (for example a 3-backtick block inside
 * a 4-backtick wrapper) are kept as content. Line endings are normalized to LF in the
 * unwrapped content.
 */
export function unwrapWholeMarkdownFence(text: string): string {
    const trimmed = text.trim();
    const lines = trimmed.split(/\r?\n/);
    if (lines.length < 2) return text;

    const open = OPENING_FENCE.exec(lines[0]);
    if (!open) return text;

    const marker = open[1];
    const fenceChar = marker[0];
    const fenceLength = marker.length;
    const info = open[2].trim().toLowerCase();
    if (!ALLOWED_INFO_STRINGS.has(info)) return text;
    // A backtick fence cannot carry a backtick in its info string (CommonMark).
    if (fenceChar === '`' && open[2].includes('`')) return text;

    const closesBlock = (line: string): boolean => {
        const close = CLOSING_FENCE.exec(line);
        if (!close) return false;
        const closeMarker = close[1];
        return closeMarker[0] === fenceChar && closeMarker.length >= fenceLength;
    };

    const last = lines.length - 1;
    if (!closesBlock(lines[last])) return text;

    // Any earlier closing fence would end the block before the final line, which would
    // leave text outside the block. Keep the input unchanged in that case.
    for (let i = 1; i < last; i += 1) {
        if (closesBlock(lines[i])) return text;
    }

    return lines.slice(1, last).join('\n');
}
