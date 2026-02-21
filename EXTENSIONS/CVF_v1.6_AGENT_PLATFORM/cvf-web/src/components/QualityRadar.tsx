'use client';

import { useState } from 'react';
import type { CVFQualityResult } from '@/types/governance-engine';

interface QualityRadarProps {
    quality: CVFQualityResult;
    language?: 'vi' | 'en';
    compact?: boolean;
}

const LABELS = {
    vi: {
        correctness: 'Chính xác',
        safety: 'An toàn',
        alignment: 'Phù hợp',
        quality: 'Chất lượng',
        overall: 'Tổng thể',
        grade: 'Điểm',
        serverScore: 'Đánh giá server',
        weight: 'Trọng số',
        safetyNote: '(2x trọng số)',
    },
    en: {
        correctness: 'Correctness',
        safety: 'Safety',
        alignment: 'Alignment',
        quality: 'Quality',
        overall: 'Overall',
        grade: 'Grade',
        serverScore: 'Server-side score',
        weight: 'Weight',
        safetyNote: '(2x weight)',
    },
};

const GRADE_COLORS: Record<string, string> = {
    A: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    B: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    C: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
    D: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
    F: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
};

function getBarColor(value: number): string {
    if (value >= 0.8) return 'bg-green-500';
    if (value >= 0.6) return 'bg-blue-500';
    if (value >= 0.4) return 'bg-yellow-500';
    if (value >= 0.2) return 'bg-orange-500';
    return 'bg-red-500';
}

/** SVG Radar/Spider chart for 4 quality dimensions */
function RadarChart({ quality }: { quality: CVFQualityResult }) {
    const size = 180;
    const center = size / 2;
    const maxRadius = 70;
    const levels = 5;

    const dims = [
        { key: 'correctness', value: quality.correctness },
        { key: 'safety', value: quality.safety },
        { key: 'alignment', value: quality.alignment },
        { key: 'quality', value: quality.quality },
    ];

    const angleStep = (2 * Math.PI) / dims.length;
    const startAngle = -Math.PI / 2; // Start from top

    // Get point coordinates for a given value (0-1) and index
    const getPoint = (value: number, index: number) => {
        const angle = startAngle + index * angleStep;
        const radius = value * maxRadius;
        return {
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle),
        };
    };

    // Grid lines
    const gridPaths = Array.from({ length: levels }, (_, level) => {
        const scale = (level + 1) / levels;
        const points = dims.map((_, i) => getPoint(scale, i));
        return `M${points.map(p => `${p.x},${p.y}`).join('L')}Z`;
    });

    // Data polygon
    const dataPoints = dims.map((d, i) => getPoint(d.value, i));
    const dataPath = `M${dataPoints.map(p => `${p.x},${p.y}`).join('L')}Z`;

    // Labels
    const labelPositions = dims.map((_, i) => {
        const angle = startAngle + i * angleStep;
        const labelRadius = maxRadius + 18;
        return {
            x: center + labelRadius * Math.cos(angle),
            y: center + labelRadius * Math.sin(angle),
        };
    });

    const dimLabels = ['C', 'S', 'A', 'Q']; // Correctness, Safety, Alignment, Quality

    return (
        <svg width={size} height={size} className="mx-auto">
            {/* Grid */}
            {gridPaths.map((path, i) => (
                <path
                    key={i}
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={0.1}
                    strokeWidth={1}
                />
            ))}

            {/* Axis lines */}
            {dims.map((_, i) => {
                const p = getPoint(1, i);
                return (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={p.x}
                        y2={p.y}
                        stroke="currentColor"
                        strokeOpacity={0.15}
                        strokeWidth={1}
                    />
                );
            })}

            {/* Data polygon */}
            <path
                d={dataPath}
                fill="rgb(59 130 246 / 0.2)"
                stroke="rgb(59 130 246)"
                strokeWidth={2}
            />

            {/* Data points */}
            {dataPoints.map((p, i) => (
                <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={3.5}
                    fill="rgb(59 130 246)"
                    stroke="white"
                    strokeWidth={1.5}
                />
            ))}

            {/* Labels */}
            {labelPositions.map((p, i) => (
                <text
                    key={i}
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-xs font-bold fill-gray-500 dark:fill-gray-400"
                >
                    {dimLabels[i]}
                </text>
            ))}
        </svg>
    );
}

export function QualityRadar({ quality, language = 'vi', compact = false }: QualityRadarProps) {
    const l = LABELS[language];
    const [showDetailed, setShowDetailed] = useState(!compact);
    const gradeColor = GRADE_COLORS[quality.grade] || GRADE_COLORS.F;

    const dimensions = [
        { label: l.correctness, value: quality.correctness, weight: '1x' },
        { label: `${l.safety} ${l.safetyNote}`, value: quality.safety, weight: '2x' },
        { label: l.alignment, value: quality.alignment, weight: '1x' },
        { label: l.quality, value: quality.quality, weight: '1x' },
    ];

    if (compact && !showDetailed) {
        return (
            <button
                onClick={() => setShowDetailed(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${gradeColor} hover:opacity-80 transition-opacity`}
            >
                <span>⭐</span>
                <span>{Math.round(quality.overall * 100)}%</span>
                <span className="font-bold">{quality.grade}</span>
            </button>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-lg font-bold ${gradeColor}`}>
                        {quality.grade}
                    </span>
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {l.overall}: {Math.round(quality.overall * 100)}%
                        </p>
                        <p className="text-xs text-gray-500">{l.serverScore}</p>
                    </div>
                </div>
                {compact && (
                    <button
                        onClick={() => setShowDetailed(false)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Radar chart */}
            <RadarChart quality={quality} />

            {/* Dimension bars */}
            <div className="space-y-2">
                {dimensions.map(dim => (
                    <div key={dim.label} className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{dim.label}</span>
                            <span className="font-mono text-gray-900 dark:text-white">
                                {Math.round(dim.value * 100)}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${getBarColor(dim.value)}`}
                                style={{ width: `${dim.value * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
