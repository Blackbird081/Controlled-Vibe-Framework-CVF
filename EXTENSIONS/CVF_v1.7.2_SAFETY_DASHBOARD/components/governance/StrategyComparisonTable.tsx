// components/governance/StrategyComparisonTable.tsx
"use client";

import { StrategyProfileName } from "@/lib/strategy/governanceStrategy.types";
import {
    BalancedStrategy,
    ConservativeStrategy,
    ExploratoryStrategy,
    StrategyRegistry,
} from "@/lib/strategy/governanceStrategy.config";
import { evaluateStrategy } from "@/lib/strategy/governanceStrategy.engine";
import type { RLevel, GovernanceStrategyConfig } from "@/lib/strategy/governanceStrategy.types";

interface Props {
    activeProfile?: StrategyProfileName;
}

const rLevels: RLevel[] = ["R0", "R1", "R2", "R3"];

function getDecisionSummary(
    rLevel: RLevel,
    strategy: GovernanceStrategyConfig,
    autonomy: number = 70
) {
    const d = evaluateStrategy({ rLevel, currentAutonomy: autonomy, sessionStep: 0 }, strategy);
    return d;
}

export default function StrategyComparisonTable({ activeProfile }: Props) {
    const profiles: { name: StrategyProfileName; config: GovernanceStrategyConfig; emoji: string }[] = [
        { name: "conservative", config: ConservativeStrategy, emoji: "🛡️" },
        { name: "balanced", config: BalancedStrategy, emoji: "⚖️" },
        { name: "exploratory", config: ExploratoryStrategy, emoji: "🚀" },
    ];

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white card-hover">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-4 py-3 text-gray-600 font-medium">Risk</th>
                            {profiles.map((p) => (
                                <th
                                    key={p.name}
                                    className={`text-center px-4 py-3 font-medium capitalize transition ${activeProfile === p.name
                                            ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                                            : "text-gray-600"
                                        }`}
                                >
                                    {p.emoji} {p.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rLevels.map((r) => (
                            <tr key={r} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="px-4 py-3 font-mono font-semibold text-gray-800">{r}</td>
                                {profiles.map((p) => {
                                    const d = getDecisionSummary(r, p.config);
                                    const flags: string[] = [];
                                    if (d.hardStop) flags.push("🛑");
                                    if (d.requireHuman) flags.push("👤");
                                    if (d.escalate) flags.push("⬆️");
                                    if (d.critical) flags.push("💀");
                                    if (d.warning) flags.push("⚠️");
                                    if (flags.length === 0) flags.push("✅");

                                    return (
                                        <td
                                            key={p.name}
                                            className={`text-center px-4 py-3 transition ${activeProfile === p.name ? "bg-blue-50/50" : ""
                                                }`}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-base">{flags.join(" ")}</span>
                                                <span className={`text-xs font-mono ${d.newAutonomy >= 70 ? "text-green-600" :
                                                        d.newAutonomy >= 40 ? "text-amber-600" :
                                                            "text-red-600"
                                                    }`}>
                                                    A:{d.newAutonomy}
                                                </span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex gap-4 flex-wrap">
                <span>✅ Safe</span>
                <span>⚠️ Warning</span>
                <span>⬆️ Escalate</span>
                <span>👤 Human Required</span>
                <span>💀 Critical</span>
                <span>🛑 Hard Stop</span>
                <span className="font-mono">A:xx = Autonomy</span>
            </div>
        </div>
    );
}
