'use client';

import { useState } from 'react';
import { getQualityBadgeColor, getQualityLabel, QualityScore } from '@/lib/governance';
import type { CVFQualityResult } from '@/types/governance-engine';
import { QualityRadar } from './QualityRadar';

const GRADE_BADGE_COLORS: Record<string, string> = {
    A: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    D: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    F: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

interface QualityScoreBadgeProps {
    score: QualityScore;
    language?: 'vi' | 'en';
    /** Server-side quality result for enhanced display */
    serverQuality?: CVFQualityResult;
}

export function QualityScoreBadge({ score, language = 'vi', serverQuality }: QualityScoreBadgeProps) {
    const [showRadar, setShowRadar] = useState(false);

    if (serverQuality) {
        const gradeColor = GRADE_BADGE_COLORS[serverQuality.grade] || GRADE_BADGE_COLORS.F;
        return (
            <div className="relative">
                <button
                    onClick={() => setShowRadar(!showRadar)}
                    className={`px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${gradeColor}`}
                >
                    <span>⭐</span>
                    <span>{Math.round(serverQuality.overall * 100)}%</span>
                    <span className="font-bold">{serverQuality.grade}</span>
                </button>

                {showRadar && (
                    <div className="absolute top-full mt-2 right-0 z-50 w-72 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                        <QualityRadar quality={serverQuality} language={language} />
                        <button
                            onClick={() => setShowRadar(false)}
                            className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600"
                        >
                            {language === 'vi' ? 'Đóng' : 'Close'}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Fallback: original badge without server quality
    return (
        <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${getQualityBadgeColor(score.overall)}`}>
            <span>⭐</span>
            <span>{score.overall}% {getQualityLabel(score.overall, language)}</span>
        </span>
    );
}
