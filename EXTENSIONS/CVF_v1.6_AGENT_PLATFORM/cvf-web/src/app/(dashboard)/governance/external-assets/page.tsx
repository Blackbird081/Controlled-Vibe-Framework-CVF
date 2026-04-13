'use client';

import { useState } from 'react';

type WorkflowStatus = 'invalid' | 'review_required' | 'registry_ready';

interface PrepareResult {
    workflowStatus: WorkflowStatus;
    readyForRegistry: boolean;
    warnings: string[];
    intake: { valid: boolean; issues: { code: string; field: string; message: string }[] };
    plannerTrigger: { confidence: string; clarification_needed: boolean; negative_matches: string[] };
    diagnosticPacket: { primaryAttribution: string };
    registryReady: { valid: boolean; governedAsset?: { governance?: { owner: string; approvalState: string } } };
}

const STATUS_STYLES: Record<WorkflowStatus, string> = {
    registry_ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    review_required: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    invalid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const STATUS_LABELS: Record<WorkflowStatus, string> = {
    registry_ready: 'Registry Ready',
    review_required: 'Review Required',
    invalid: 'Invalid',
};

const WARNING_PREFIX_LABELS: Record<string, string> = {
    INTAKE: 'Intake',
    SEMANTIC: 'Semantic Policy',
    PLANNER: 'Planner',
    PROVISIONAL: 'Provisional Signal',
    NORMALIZATION: 'Normalization',
    REGISTRY: 'Registry',
};

function groupWarnings(warnings: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    for (const w of warnings) {
        const prefix = Object.keys(WARNING_PREFIX_LABELS).find((p) => w.startsWith(p + '_')) ?? 'Other';
        const label = WARNING_PREFIX_LABELS[prefix] ?? prefix;
        if (!groups[label]) groups[label] = [];
        groups[label].push(w);
    }
    return groups;
}

const BLANK_FORM = {
    source_ref: '',
    source_kind: 'document_bundle',
    source_quality: 'internal_design_draft',
    officially_verified: false,
    provenance_notes: '',
    candidate_asset_type: 'W7SkillAsset',
    description_or_trigger: '',
    instruction_body: '',
};

export default function ExternalAssetsPage() {
    const [form, setForm] = useState(BLANK_FORM);
    const [approvalState, setApprovalState] = useState<string>('draft');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PrepareResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const res = await fetch('/api/governance/external-assets/prepare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile: form,
                    registry: { approvalState },
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error ?? 'Unknown error');
            setResult(json.data as PrepareResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Request failed');
        } finally {
            setLoading(false);
        }
    }

    const warningGroups = result ? groupWarnings(result.warnings) : {};

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">External Asset Preparation</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Submit an asset profile through the CVF governance pipeline to assess registry readiness.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Source Ref</label>
                        <input
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                            value={form.source_ref}
                            onChange={(e) => setForm({ ...form, source_ref: e.target.value })}
                            placeholder="e.g. CVF_ADDING_NEW/skill.md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Source Kind</label>
                        <select
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                            value={form.source_kind}
                            onChange={(e) => setForm({ ...form, source_kind: e.target.value })}
                        >
                            <option value="document_bundle">Document Bundle</option>
                            <option value="repo">Repo</option>
                            <option value="external_url">External URL</option>
                            <option value="inline">Inline</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Source Quality</label>
                        <select
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                            value={form.source_quality}
                            onChange={(e) => setForm({ ...form, source_quality: e.target.value })}
                        >
                            <option value="internal_design_draft">Internal Design Draft</option>
                            <option value="community_analysis">Community Analysis</option>
                            <option value="verified_external">Verified External</option>
                            <option value="operator_supplied">Operator Supplied</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Candidate Asset Type</label>
                        <select
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                            value={form.candidate_asset_type}
                            onChange={(e) => setForm({ ...form, candidate_asset_type: e.target.value })}
                        >
                            <option value="W7SkillAsset">W7 Skill Asset</option>
                            <option value="W7ToolAsset">W7 Tool Asset</option>
                            <option value="W7PolicyAsset">W7 Policy Asset</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Approval State</label>
                        <select
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                            value={approvalState}
                            onChange={(e) => setApprovalState(e.target.value)}
                        >
                            <option value="draft">Draft</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="approved">Approved</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                        <input
                            type="checkbox"
                            id="officially_verified"
                            checked={form.officially_verified}
                            onChange={(e) => setForm({ ...form, officially_verified: e.target.checked })}
                            className="h-4 w-4 rounded"
                        />
                        <label htmlFor="officially_verified" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Officially Verified
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description / Trigger</label>
                    <input
                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                        value={form.description_or_trigger}
                        onChange={(e) => setForm({ ...form, description_or_trigger: e.target.value })}
                        placeholder="What does this asset do?"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Provenance Notes</label>
                    <input
                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                        value={form.provenance_notes}
                        onChange={(e) => setForm({ ...form, provenance_notes: e.target.value })}
                        placeholder="Where does this asset come from?"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Instruction Body</label>
                    <textarea
                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white font-mono"
                        rows={4}
                        value={form.instruction_body}
                        onChange={(e) => setForm({ ...form, instruction_body: e.target.value })}
                        placeholder="Asset instructions or body content..."
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Running governance pipeline…' : 'Run Preparation'}
                </button>
            </form>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="space-y-4">
                    {/* Status header */}
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[result.workflowStatus]}`}>
                            {STATUS_LABELS[result.workflowStatus]}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Attribution: <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{result.diagnosticPacket.primaryAttribution}</code>
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
                            Planner confidence: <strong>{result.plannerTrigger.confidence}</strong>
                        </span>
                    </div>

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Warnings ({result.warnings.length})
                            </h2>
                            {Object.entries(warningGroups).map(([group, items]) => (
                                <div key={group}>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{group}</p>
                                    <ul className="space-y-1">
                                        {items.map((w) => (
                                            <li key={w} className="text-xs font-mono bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                                {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Intake issues */}
                    {result.intake.issues.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Intake Issues</h2>
                            {result.intake.issues.map((issue, i) => (
                                <div key={i} className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded p-2">
                                    <span className="font-medium">{issue.field}</span>
                                    <span className="text-gray-400 mx-1">·</span>
                                    <code className="text-red-600 dark:text-red-400">{issue.code}</code>
                                    <span className="text-gray-400 mx-1">·</span>
                                    {issue.message}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Planner clarification */}
                    {result.plannerTrigger.clarification_needed && (
                        <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm text-yellow-800 dark:text-yellow-300">
                            Planner requires clarification before registry handoff.
                            {result.plannerTrigger.negative_matches.length > 0 && (
                                <span className="ml-1">Negative matches: {result.plannerTrigger.negative_matches.join(', ')}</span>
                            )}
                        </div>
                    )}

                    {/* Registry info (if ready) */}
                    {result.workflowStatus === 'registry_ready' && result.registryReady.governedAsset?.governance && (
                        <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-300 space-y-1">
                            <p className="font-medium">Asset is ready for governed registration.</p>
                            <p>Owner: <strong>{result.registryReady.governedAsset.governance.owner}</strong></p>
                            <p>Approval state: <strong>{result.registryReady.governedAsset.governance.approvalState}</strong></p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
