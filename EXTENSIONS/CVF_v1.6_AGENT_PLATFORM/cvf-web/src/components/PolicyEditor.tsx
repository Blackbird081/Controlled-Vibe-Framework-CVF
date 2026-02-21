'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';

interface PolicyEditorProps {
    initialPolicy?: string;
    onSave?: (policy: string) => void;
    onRun?: (policy: string) => void;
}

const LABELS = {
    vi: {
        title: '📜 Trình soạn chính sách',
        save: 'Lưu',
        run: 'Chạy mô phỏng',
        clear: 'Xóa',
        load: 'Nạp mẫu',
        placeholder: 'Nhập chính sách DSL...\n\nRULE block_high_risk\nWHEN cvf_risk_level >= R3\nTHEN BLOCK\n\nRULE require_approval_medium\nWHEN risk_score > 50 AND cvf_phase = BUILD\nTHEN NEEDS_APPROVAL',
        syntax: 'Cú pháp: RULE / WHEN / THEN',
        keywords: 'Từ khóa: violation, risk_score, cvf_phase, cvf_risk_level, BLOCK, ALLOW, NEEDS_APPROVAL',
        saved: 'Đã lưu!',
        lineCount: 'dòng',
        rulesCount: 'quy tắc',
    },
    en: {
        title: '📜 Policy Editor',
        save: 'Save',
        run: 'Run Simulation',
        clear: 'Clear',
        load: 'Load Sample',
        placeholder: 'Enter policy DSL...\n\nRULE block_high_risk\nWHEN cvf_risk_level >= R3\nTHEN BLOCK\n\nRULE require_approval_medium\nWHEN risk_score > 50 AND cvf_phase = BUILD\nTHEN NEEDS_APPROVAL',
        syntax: 'Syntax: RULE / WHEN / THEN',
        keywords: 'Keywords: violation, risk_score, cvf_phase, cvf_risk_level, BLOCK, ALLOW, NEEDS_APPROVAL',
        saved: 'Saved!',
        lineCount: 'lines',
        rulesCount: 'rules',
    },
};

const SAMPLE_POLICY = `RULE block_critical_risk
WHEN cvf_risk_level >= R4
THEN BLOCK

RULE require_approval_high
WHEN cvf_risk_level = R3
THEN NEEDS_APPROVAL

RULE allow_low_risk
WHEN cvf_risk_level <= R1
THEN ALLOW

RULE block_frozen_changes
WHEN cvf_phase = FREEZE AND violation = true
THEN BLOCK

RULE review_medium_build
WHEN risk_score > 40 AND cvf_phase = BUILD
THEN NEEDS_APPROVAL`;

/** Parse DSL to extract rules */
export function parsePolicyDSL(dsl: string): PolicyRule[] {
    const rules: PolicyRule[] = [];
    const lines = dsl.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let current: Partial<PolicyRule> | null = null;

    for (const line of lines) {
        if (line.startsWith('RULE ')) {
            if (current?.name && current?.condition && current?.action) {
                rules.push(current as PolicyRule);
            }
            current = { name: line.slice(5).trim(), condition: '', action: '' };
        } else if (line.startsWith('WHEN ') && current) {
            current.condition = line.slice(5).trim();
        } else if (line.startsWith('THEN ') && current) {
            current.action = line.slice(5).trim();
        }
    }
    if (current?.name && current?.condition && current?.action) {
        rules.push(current as PolicyRule);
    }
    return rules;
}

export interface PolicyRule {
    name: string;
    condition: string;
    action: string;
}

export function PolicyEditor({ initialPolicy = '', onSave, onRun }: PolicyEditorProps) {
    const { language } = useLanguage();
    const l = LABELS[language];
    const [policy, setPolicy] = useState(initialPolicy || '');
    const [saved, setSaved] = useState(false);

    const handleSave = useCallback(() => {
        onSave?.(policy);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }, [policy, onSave]);

    const handleRun = useCallback(() => {
        onRun?.(policy);
    }, [policy, onRun]);

    const handleLoadSample = useCallback(() => {
        setPolicy(SAMPLE_POLICY);
    }, []);

    const lineCount = policy.split('\n').length;
    const rules = parsePolicyDSL(policy);

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {l.title}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleLoadSample}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {l.load}
                    </button>
                    <button
                        onClick={() => setPolicy('')}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {l.clear}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        {saved ? `✅ ${l.saved}` : l.save}
                    </button>
                </div>
            </div>

            <div className="flex-1 relative">
                <textarea
                    value={policy}
                    onChange={e => setPolicy(e.target.value)}
                    placeholder={l.placeholder}
                    spellCheck={false}
                    className="w-full h-full min-h-[300px] p-3 font-mono text-sm bg-gray-950 text-green-400 resize-none focus:outline-none"
                    style={{ tabSize: 2 }}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                    {lineCount} {l.lineCount} | {rules.length} {l.rulesCount}
                </div>
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <p className="text-[10px] text-gray-400">{l.syntax}</p>
                <p className="text-[10px] text-gray-400">{l.keywords}</p>
                <button
                    onClick={handleRun}
                    disabled={rules.length === 0}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                    ▶ {l.run}
                </button>
            </div>
        </div>
    );
}
