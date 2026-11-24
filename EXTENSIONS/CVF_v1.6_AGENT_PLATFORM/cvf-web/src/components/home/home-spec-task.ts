function words(description: string) {
    return description.normalize('NFC').toLowerCase().match(/[\p{L}\p{M}]+|[+-]?\p{N}+(?:[.,]\p{N}+)*%?|[\u20ac$\u00a3\u20ab]/gu) ?? [];
}

function isSpellingEdit(previous: string, next: string) {
    if (!/^\p{L}[\p{L}\p{M}]{3,}$/u.test(previous) || !/^\p{L}[\p{L}\p{M}]{3,}$/u.test(next)) return false;
    const unaccented = (word: string) => word.normalize('NFD').replace(/\p{M}/gu, '');
    if (unaccented(previous) === unaccented(next)) return true;
    const firstDifference = [...previous].findIndex((char, index) => char !== next[index]);
    const index = firstDifference < 0 ? previous.length : firstDifference;
    if (previous.length === next.length) {
        return previous.slice(index + 1) === next.slice(index + 1)
            || (previous[index] === next[index + 1] && previous[index + 1] === next[index]
                && previous.slice(index + 2) === next.slice(index + 2));
    }
    const [longer, shorter] = previous.length > next.length ? [previous, next] : [next, previous];
    return longer.slice(0, index) + longer.slice(index + 1) === shorter;
}

/** Preserve answers for cosmetic edits and a local typo, with a clean start for rewrites. */
export function isNewHomeSpecTask(previous: string, next: string) {
    const before = words(previous);
    const after = words(next);
    if (before.length !== after.length) return true;
    const differences = before.flatMap((word, index) => word === after[index] ? [] : [index]);
    if (!differences.length) return false;
    const [index] = differences;
    return differences.length !== 1 || !isSpellingEdit(before[index], after[index]);
}
