// components/governance/AutonomyChart.tsx
"use client";

import type { GovernanceEvent } from "@/lib/sessionManager";

interface Props {
    events: GovernanceEvent[];
}

export default function AutonomyChart({ events }: Props) {
    // Filter events that have autonomy changes
    const dataPoints = events.map((e, i) => ({
        index: i,
        autonomy: e.autonomy,
        type: e.type,
        rLevel: e.rLevel,
    }));

    if (dataPoints.length < 2) {
        return (
            <div className="border border-gray-200 rounded-xl p-4 bg-white text-sm text-gray-500 text-center">
                Cần ít nhất 2 events để hiển thị biểu đồ.
            </div>
        );
    }

    const maxAutonomy = 100;
    const minAutonomy = 0;
    const range = maxAutonomy - minAutonomy;

    const width = 600;
    const height = 160;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xStep = chartW / (dataPoints.length - 1);

    // Build path
    const pathPoints = dataPoints.map((p, i) => {
        const x = padding.left + i * xStep;
        const y = padding.top + chartH - ((p.autonomy - minAutonomy) / range) * chartH;
        return { x, y, autonomy: p.autonomy, rLevel: p.rLevel, type: p.type };
    });

    const linePath = pathPoints
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");

    // Gradient area path
    const areaPath = `${linePath} L ${pathPoints[pathPoints.length - 1].x} ${padding.top + chartH} L ${pathPoints[0].x} ${padding.top + chartH} Z`;

    // Color based on last autonomy value
    const lastAutonomy = dataPoints[dataPoints.length - 1].autonomy;
    const lineColor = lastAutonomy >= 70 ? "#22c55e" : lastAutonomy >= 40 ? "#f59e0b" : "#ef4444";

    // Y-axis labels
    const yLabels = [0, 25, 50, 75, 100];

    return (
        <div className="border border-gray-200 rounded-xl p-4 bg-white card-hover">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Autonomy Timeline
            </h3>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full"
                style={{ maxHeight: "200px" }}
            >
                {/* Grid lines */}
                {yLabels.map((v) => {
                    const y = padding.top + chartH - ((v - minAutonomy) / range) * chartH;
                    return (
                        <g key={v}>
                            <line
                                x1={padding.left}
                                y1={y}
                                x2={width - padding.right}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeDasharray="4,4"
                            />
                            <text
                                x={padding.left - 8}
                                y={y + 4}
                                textAnchor="end"
                                className="text-xs fill-gray-400"
                                fontSize="10"
                            >
                                {v}
                            </text>
                        </g>
                    );
                })}

                {/* Gradient fill */}
                <defs>
                    <linearGradient id="autonomyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#autonomyGrad)" />

                {/* Line */}
                <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Data points */}
                {pathPoints.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={lineColor} strokeWidth="2" />
                        {/* Risk color indicator */}
                        {p.rLevel === "R3" && (
                            <circle cx={p.x} cy={padding.top + chartH + 12} r="3" fill="#ef4444" />
                        )}
                        {p.rLevel === "R2" && (
                            <circle cx={p.x} cy={padding.top + chartH + 12} r="3" fill="#f59e0b" />
                        )}
                    </g>
                ))}

                {/* X-axis label */}
                <text
                    x={width / 2}
                    y={height - 2}
                    textAnchor="middle"
                    className="text-xs fill-gray-400"
                    fontSize="10"
                >
                    Events →
                </text>
            </svg>
        </div>
    );
}
