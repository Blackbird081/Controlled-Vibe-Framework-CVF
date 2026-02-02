'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Execution, QualityScore } from '@/types';

interface ResultViewerProps {
    execution: Execution;
    output: string;
    onAccept: () => void;
    onReject: () => void;
    onRetry: () => void;
    onBack: () => void;
}

function QualityBadge({ score }: { score: number }) {
    let color = 'bg-gray-100 text-gray-700';
    let label = 'Pending';

    if (score >= 8) {
        color = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
        label = '⭐ Excellent';
    } else if (score >= 6) {
        color = 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
        label = '✅ Good';
    } else if (score >= 4) {
        color = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
        label = '⚠️ Acceptable';
    } else {
        color = 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
        label = '❌ Poor';
    }

    return (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
            {label} ({score.toFixed(1)}/10)
        </span>
    );
}

function QualityBreakdown({ score }: { score: QualityScore }) {
    const metrics = [
        { name: 'Structure', value: score.structure },
        { name: 'Completeness', value: score.completeness },
        { name: 'Clarity', value: score.clarity },
        { name: 'Actionability', value: score.actionability },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m) => (
                <div key={m.name} className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {m.value.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">{m.name}</div>
                </div>
            ))}
        </div>
    );
}

export function ResultViewer({ execution, output, onAccept, onReject, onRetry, onBack }: ResultViewerProps) {
    const [showDetails, setShowDetails] = useState(false);

    // Mock quality score
    const qualityScore: QualityScore = {
        overall: 8.2,
        structure: 9.0,
        completeness: 8.5,
        clarity: 8.0,
        actionability: 7.5,
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-green-500">✅</span>
                            <span>{execution.templateName} Complete</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <QualityBadge score={qualityScore.overall} />
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        📄 Export
                    </button>
                </div>
            </div>

            {/* Quality Score Panel */}
            <div
                className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl cursor-pointer"
                onClick={() => setShowDetails(!showDetails)}
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-medium">Quality Score</h3>
                    <svg
                        className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {showDetails && (
                    <div className="mt-4">
                        <QualityBreakdown score={qualityScore} />
                    </div>
                )}
            </div>

            {/* Output Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
                <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{output}</ReactMarkdown>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-center gap-4">
                <button
                    onClick={onAccept}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg
                     shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                    <span>✅</span>
                    <span>Accept</span>
                </button>

                <button
                    onClick={onReject}
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg
                     shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                    <span>❌</span>
                    <span>Reject</span>
                </button>

                <button
                    onClick={onRetry}
                    className="px-8 py-3 border border-gray-300 dark:border-gray-600 
                     hover:bg-gray-100 dark:hover:bg-gray-800
                     font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                    <span>↻</span>
                    <span>Retry</span>
                </button>
            </div>

            {/* Metadata */}
            <div className="mt-8 text-center text-sm text-gray-500">
                Executed at {new Date().toLocaleString()} • Duration: 12.5s
            </div>
        </div>
    );
}
