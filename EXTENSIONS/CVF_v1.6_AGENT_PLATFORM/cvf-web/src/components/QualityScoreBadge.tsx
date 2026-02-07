'use client';

import { getQualityBadgeColor, getQualityLabel, QualityScore } from '@/lib/governance';

interface QualityScoreBadgeProps {
    score: QualityScore;
    language?: 'vi' | 'en';
}

export function QualityScoreBadge({ score, language = 'vi' }: QualityScoreBadgeProps) {
    return (
        <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${getQualityBadgeColor(score.overall)}`}>
            <span>⭐</span>
            <span>{score.overall}% {getQualityLabel(score.overall, language)}</span>
        </span>
    );
}
