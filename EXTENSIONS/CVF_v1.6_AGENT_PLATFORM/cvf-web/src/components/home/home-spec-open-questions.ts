const unknown = /\b(?:chua (?:biet|nghi|co|xac dinh|quyet)|khong (?:biet|ro|chac|co)|not sure|unsure|(?:do not|don't|does not|doesn't) know|(?:have not|haven't|has not|hasn't) (?:thought|decided)|no\b[^.!?]*\byet|(?:do not|don't|does not|doesn't) have)\b/;
const shortUnknown = /^(?:chua (?:biet|nghi(?: (?:toi|den|ve))?|xac dinh|quyet(?: dinh)?)|khong (?:biet|ro|chac)|(?:i(?:'m| am) )?(?:not sure|unsure)|(?:i )?(?:do not|don't) know|(?:i )?(?:have not|haven't) (?:thought(?: about it)?|decided)|unknown)$/;
const routineNegative = /\b(?:khong co (?:gi kho|van de|tro ngai)|khong biet lap trinh|(?:do not|don't) know how to code)\b/g;
const genericTopic = '(?:(?:cac |nhung )?(?:chi tiet|thong tin|muc|phan) (?:khac|con lai)|cho khong biet|(?:the )?(?:other|remaining) (?:details|information)|the rest)';
const genericTopicPrefix = new RegExp(`^${genericTopic}\\s*[:\\u2013\\u2014-]\\s*`);
const genericTopicSuffix = new RegExp(`\\s+(?:(?:ve|about) )?${genericTopic}$`);
const vagueUnknown = /^(?:(?:chua biet|khong (?:biet|ro|chac)) (?:cu the )?(?:la gi|gi|the nao)|(?:(?:i|we) )?(?:do not|don't) know what (?:it|that|this) is)$/;

function normalizeForMatching(text: string) {
    return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replaceAll('\u0111', 'd')
        .replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim();
}

function segments(text: string) {
    return text.split(/\r?\n|(?<=[.!?;])\s+/u).map(part => part.trim()).filter(Boolean);
}

function isTopiclessUncertainty(body: string): boolean {
    return body.split(/[,;]\s*/).every((part) => {
        const clause = part.trim().replace(/^(?:and|va)\s+/, '');
        const short = clause.replace(/ (?:nua|gi them|gi khac|anything else|any more|yet)$/, '');
        return shortUnknown.test(short) || vagueUnknown.test(short) || /^(?:chua co|not yet)$/.test(clause);
    });
}

export function normalizeHomeOpenQuestion(text: string): string {
    return normalizeForMatching(text).replaceAll("'", '').replace(/\p{P}+/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function dedupeHomeOpenQuestions(questions: string[]): string[] {
    const seen = new Set<string>();
    return questions.filter((question) => {
        const key = normalizeHomeOpenQuestion(question);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export function collectHomeOpenQuestions(
    description: string,
    answers: Record<string, string>,
    labels: ReadonlyMap<string, string>,
    requiredFields: ReadonlySet<string>,
    unknownAnswerLabel: string,
): string[] {
    const specific = new Set<string>();
    const required = new Set<string>();
    const optional = new Set<string>();

    function collect(text: string, fieldId?: string) {
        for (const sentence of segments(text)) {
            const match = normalizeForMatching(sentence).replace(/[.!?;]+$/u, '');
            const withoutGenericTopic = match.replace(genericTopicPrefix, '').replace(genericTopicSuffix, '');
            const body = withoutGenericTopic.replace(/^(?:toi|minh|em|chung toi|chung minh|we)\s+/, '');
            if (isTopiclessUncertainty(body)) {
                const label = fieldId && labels.get(fieldId);
                if (fieldId && label && withoutGenericTopic === match) {
                    const bucket = requiredFields.has(fieldId) ? required : optional;
                    bucket.add(`${label.replace(/[?:]$/u, '')}: ${unknownAnswerLabel}`);
                }
            } else if (body !== 'khong co' && unknown.test(body.replace(routineNegative, ''))) {
                specific.add(sentence);
            }
        }
    }

    collect(description);
    for (const [id, answer] of Object.entries(answers)) collect(answer, id);
    return [...specific, ...required, ...optional];
}
