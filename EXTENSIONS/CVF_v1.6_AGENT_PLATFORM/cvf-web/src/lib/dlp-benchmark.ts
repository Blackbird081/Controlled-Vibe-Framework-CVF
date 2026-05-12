import { applyDLPPatterns } from './dlp-filter-core';

export interface DLPCorpusCase {
    id: string;
    patternId: string;
    input: string;
    expectRedacted: boolean;
    note?: string;
}

export interface DLPCorpus {
    version: string;
    generated: string;
    categories: {
        true_pii: { cases: DLPCorpusCase[] };
        false_pii: { cases: DLPCorpusCase[] };
        adversarial: { cases: DLPCorpusCase[] };
    };
}

export interface DLPCaseResult {
    id: string;
    category: 'true_pii' | 'false_pii' | 'adversarial';
    input: string;
    expectRedacted: boolean;
    actualRedacted: boolean;
    correct: boolean;
    note?: string;
}

export interface DLPBenchmarkMetrics {
    truePositive: number;
    falseNegative: number;
    trueNegative: number;
    falsePositive: number;
    precision: number;
    recall: number;
    f1: number;
    adversarialTotal: number;
    adversarialPassed: number;
    caseResults: DLPCaseResult[];
    grade: 'PASS' | 'ADVISORY';
}

const F1_PASS_THRESHOLD = 0.8;

function runCase(c: DLPCorpusCase, category: DLPCaseResult['category']): DLPCaseResult {
    const result = applyDLPPatterns(c.input);
    const actualRedacted = result.wasRedacted;
    return {
        id: c.id,
        category,
        input: c.input,
        expectRedacted: c.expectRedacted,
        actualRedacted,
        correct: actualRedacted === c.expectRedacted,
        note: c.note,
    };
}

export function runDLPBenchmark(corpus: DLPCorpus): DLPBenchmarkMetrics {
    const trueResults = corpus.categories.true_pii.cases.map(c => runCase(c, 'true_pii'));
    const falseResults = corpus.categories.false_pii.cases.map(c => runCase(c, 'false_pii'));
    const advResults = corpus.categories.adversarial.cases.map(c => runCase(c, 'adversarial'));

    // Precision/recall computed on true_pii + false_pii only (adversarial is doc-only)
    let truePositive = 0;
    let falseNegative = 0;
    let trueNegative = 0;
    let falsePositive = 0;

    for (const r of trueResults) {
        if (r.actualRedacted) truePositive++;
        else falseNegative++;
    }
    for (const r of falseResults) {
        if (!r.actualRedacted) trueNegative++;
        else falsePositive++;
    }

    const precision = truePositive + falsePositive > 0
        ? truePositive / (truePositive + falsePositive)
        : 1;
    const recall = truePositive + falseNegative > 0
        ? truePositive / (truePositive + falseNegative)
        : 1;
    const f1 = precision + recall > 0
        ? 2 * precision * recall / (precision + recall)
        : 0;

    return {
        truePositive,
        falseNegative,
        trueNegative,
        falsePositive,
        precision,
        recall,
        f1,
        adversarialTotal: advResults.length,
        adversarialPassed: advResults.filter(r => r.correct).length,
        caseResults: [...trueResults, ...falseResults, ...advResults],
        grade: f1 >= F1_PASS_THRESHOLD ? 'PASS' : 'ADVISORY',
    };
}
