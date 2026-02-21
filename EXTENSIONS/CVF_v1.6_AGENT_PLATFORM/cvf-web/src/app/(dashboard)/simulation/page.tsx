'use client';

import { useState } from 'react';
import { PolicyEditor, parsePolicyDSL, type PolicyRule } from '@/components/PolicyEditor';
import { SimulationRunner } from '@/components/SimulationRunner';
import { useLanguage } from '@/lib/i18n';

const LABELS = {
    vi: {
        title: '🧪 Mô phỏng chính sách',
        subtitle: 'Kiểm thử chính sách trước khi áp dụng',
        baseline: 'Chính sách cơ sở',
        newPolicy: 'Chính sách mới',
    },
    en: {
        title: '🧪 Policy Simulation',
        subtitle: 'Test policies before applying them',
        baseline: 'Baseline Policy',
        newPolicy: 'New Policy',
    },
};

const DEFAULT_BASELINE = `RULE block_r4
WHEN cvf_risk_level >= R4
THEN BLOCK

RULE approve_r3
WHEN cvf_risk_level = R3
THEN NEEDS_APPROVAL

RULE allow_rest
WHEN cvf_risk_level <= R2
THEN ALLOW`;

export default function SimulationPage() {
    const { language } = useLanguage();
    const l = LABELS[language];
    const [baselinePolicy, setBaselinePolicy] = useState(DEFAULT_BASELINE);
    const [newPolicy, setNewPolicy] = useState('');
    const [activeNewRules, setActiveNewRules] = useState<PolicyRule[]>([]);

    const baselineRules = parsePolicyDSL(baselinePolicy);

    const handleRun = (policyText: string) => {
        setNewPolicy(policyText);
        setActiveNewRules(parsePolicyDSL(policyText));
    };

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{l.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{l.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
                {/* Left: Policy Editor */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <PolicyEditor
                        initialPolicy={DEFAULT_BASELINE}
                        onSave={setNewPolicy}
                        onRun={handleRun}
                    />
                </div>

                {/* Right: Simulation Results */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <SimulationRunner
                        baselineRules={baselineRules}
                        newRules={activeNewRules.length > 0 ? activeNewRules : baselineRules}
                    />
                </div>
            </div>
        </div>
    );
}
