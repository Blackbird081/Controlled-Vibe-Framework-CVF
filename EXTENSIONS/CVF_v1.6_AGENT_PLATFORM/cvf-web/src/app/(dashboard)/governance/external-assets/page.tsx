'use client';

import { useState, useEffect, useCallback } from 'react';

type WorkflowStatus = 'invalid' | 'review_required' | 'registry_ready';
type LifecycleStatus = 'active' | 'retired';
type StatusFilter = 'all' | 'active' | 'retired';

interface PrepareResult {
    workflowStatus: WorkflowStatus;
    readyForRegistry: boolean;
    warnings: string[];
    intake: { valid: boolean; issues: { code: string; field: string; message: string }[] };
    plannerTrigger: { confidence: string; clarification_needed: boolean; negative_matches: string[] };
    diagnosticPacket: { primaryAttribution: string };
    registryReady: {
        valid: boolean;
        governedAsset?: {
            name?: string;
            version?: string;
            governance?: { owner: string; approvalState: string; riskLevel: string; registryRefs?: string[] };
        };
    };
}

interface RegistryEntry {
    id: string;
    registeredAt: string;
    source_ref: string;
    candidate_asset_type: string;
    description_or_trigger: string;
    approvalState: string;
    governanceOwner: string;
    riskLevel: string;
    workflowStatus: 'registry_ready';
    /** W69-T1: lifecycle status — 'active' by default, 'retired' after retire action */
    lifecycleStatus: LifecycleStatus;
    /** W69-T1: ISO timestamp; present when lifecycleStatus === 'retired' */
    retiredAt?: string;
    assetName: string;
    assetVersion: string;
}

const STATUS_STYLES: Record<WorkflowStatus, string> = {
    registry_ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    review_required: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    invalid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const STATUS_LABELS: Record<WorkflowStatus, string> = {
    registry_ready: 'Registry Ready',
    review_required: 'Review Required',
    invalid: 'Invalid — Cannot Proceed',
};

// CP3 — human-readable closure guidance per status
const CLOSURE_GUIDANCE: Record<WorkflowStatus, { heading: string; body: string }> = {
    registry_ready: {
        heading: 'Asset is ready for governed registration.',
        body: 'All intake, normalization, and registry checks passed. Click "Register Asset" to persist this asset in the governed registry.',
    },
    review_required: {
        heading: 'Asset requires review before registration.',
        body: 'Intake is valid but one or more downstream checks need attention (semantic policy, planner clarity, or normalization). Resolve the warnings below and re-submit, or proceed to a human review step.',
    },
    invalid: {
        heading: 'Asset cannot proceed — intake shape is invalid.',
        body: 'Required intake fields are missing or incorrect. Fix the intake issues listed below and re-submit. Registration is not possible until intake is valid.',
    },
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

type PageTab = 'prepare' | 'registry';

// W70-T1: lifecycle badge styles
const LIFECYCLE_BADGE: Record<LifecycleStatus, { cls: string; label: string }> = {
    active: {
        cls: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        label: 'Active',
    },
    retired: {
        cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
        label: 'Retired',
    },
};

export default function ExternalAssetsPage() {
    const [activeTab, setActiveTab] = useState<PageTab>('prepare');

    // Prepare form state
    const [form, setForm] = useState(BLANK_FORM);
    const [approvalState, setApprovalState] = useState<string>('draft');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PrepareResult | null>(null);
    const [prepareError, setPrepareError] = useState<string | null>(null);

    // Register state
    const [registering, setRegistering] = useState(false);
    const [registeredEntry, setRegisteredEntry] = useState<RegistryEntry | null>(null);
    const [registerError, setRegisterError] = useState<string | null>(null);
    // W70-T1: existing active entry when 409 is returned
    const [duplicateEntry, setDuplicateEntry] = useState<RegistryEntry | null>(null);

    // Registry list state
    const [registryEntries, setRegistryEntries] = useState<RegistryEntry[]>([]);
    const [registryLoading, setRegistryLoading] = useState(false);
    // W70-T1: filter + retire state
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sourceRefFilter, setSourceRefFilter] = useState<string>('');
    const [assetTypeFilter, setAssetTypeFilter] = useState<string>('');
    const [retireLoadingId, setRetireLoadingId] = useState<string | null>(null);
    const [retireError, setRetireError] = useState<string | null>(null);

    const loadRegistry = useCallback(async (
        status: StatusFilter = 'all',
        sourceRef: string = '',
        assetType: string = '',
    ) => {
        setRegistryLoading(true);
        setRetireError(null);
        try {
            const q = new URLSearchParams();
            if (status !== 'all') q.set('status', status);
            if (sourceRef.trim()) q.set('source_ref', sourceRef.trim());
            if (assetType.trim()) q.set('candidate_asset_type', assetType.trim());
            const params = q.toString() ? `?${q.toString()}` : '';
            const res = await fetch(`/api/governance/external-assets/register${params}`);
            const json = await res.json();
            if (json.success) setRegistryEntries(json.entries as RegistryEntry[]);
        } catch {
            // registry empty or unavailable — not fatal
        } finally {
            setRegistryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'registry') loadRegistry(statusFilter, sourceRefFilter, assetTypeFilter);
    }, [activeTab, loadRegistry, statusFilter, sourceRefFilter, assetTypeFilter]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setPrepareError(null);
        setRegisteredEntry(null);
        setRegisterError(null);
        setDuplicateEntry(null);
        try {
            const res = await fetch('/api/governance/external-assets/prepare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: form, registry: { approvalState } }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error ?? 'Unknown error');
            setResult(json.data as PrepareResult);
        } catch (err) {
            setPrepareError(err instanceof Error ? err.message : 'Request failed');
        } finally {
            setLoading(false);
        }
    }

    async function handleRegister() {
        if (!result || result.workflowStatus !== 'registry_ready') return;
        setRegistering(true);
        setRegisterError(null);
        setDuplicateEntry(null);
        try {
            // Send the same profile+registry payload as /prepare so the server
            // independently re-derives readiness. The server is the authority.
            const res = await fetch('/api/governance/external-assets/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: form, registry: { approvalState } }),
            });
            const json = await res.json();
            if (!json.success) {
                // W70-T1: 409 = active duplicate — surface lifecycle-aware guidance
                if (res.status === 409 && json.existingEntry) {
                    setDuplicateEntry(json.existingEntry as RegistryEntry);
                    throw new Error('duplicate');
                }
                throw new Error(json.error ?? 'Registration failed');
            }
            setRegisteredEntry(json.entry as RegistryEntry);
        } catch (err) {
            if (err instanceof Error && err.message !== 'duplicate') {
                setRegisterError(err instanceof Error ? err.message : 'Registration failed');
            }
        } finally {
            setRegistering(false);
        }
    }

    // W70-T1: retire an active registry entry
    async function handleRetire(id: string) {
        setRetireLoadingId(id);
        setRetireError(null);
        try {
            const res = await fetch('/api/governance/external-assets/retire', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error ?? 'Retirement failed');
            // Read-after-write: refresh the list with the current filters
            await loadRegistry(statusFilter, sourceRefFilter, assetTypeFilter);
        } catch (err) {
            setRetireError(err instanceof Error ? err.message : 'Retirement failed');
        } finally {
            setRetireLoadingId(null);
        }
    }

    const warningGroups = result ? groupWarnings(result.warnings) : {};
    const guidance = result ? CLOSURE_GUIDANCE[result.workflowStatus] : null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">External Asset Governance</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Prepare and register external assets through the CVF governance pipeline.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
                {(['prepare', 'registry'] as PageTab[]).map((tab) => (
                    <button
                        type="button"
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    >
                        {tab === 'prepare' ? 'Prepare Asset' : `Registry (${registryEntries.length})`}
                    </button>
                ))}
            </div>

            {/* ── PREPARE TAB ── */}
            {activeTab === 'prepare' && (
                <div className="space-y-4">
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
                                <label htmlFor="source_kind" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Source Kind</label>
                                <select
                                    id="source_kind"
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
                                <label htmlFor="source_quality" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Source Quality</label>
                                <select
                                    id="source_quality"
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
                                <label htmlFor="candidate_asset_type" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Candidate Asset Type</label>
                                <select
                                    id="candidate_asset_type"
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
                                <label htmlFor="approval_state" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Approval State</label>
                                <select
                                    id="approval_state"
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
                    {prepareError && (
                        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
                            {prepareError}
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-4">
                            {/* Status + closure guidance (CP3) */}
                            <div className={`rounded-lg border p-4 space-y-2 ${
                                result.workflowStatus === 'registry_ready'
                                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                                    : result.workflowStatus === 'review_required'
                                    ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
                                    : 'border-red-300 bg-red-50 dark:bg-red-900/20'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[result.workflowStatus]}`}>
                                        {STATUS_LABELS[result.workflowStatus]}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Attribution: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{result.diagnosticPacket.primaryAttribution}</code>
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                                        Planner confidence: <strong>{result.plannerTrigger.confidence}</strong>
                                    </span>
                                </div>
                                {guidance && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{guidance.heading}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{guidance.body}</p>
                                    </div>
                                )}
                            </div>

                            {/* Register action (CP2) */}
                            {result.workflowStatus === 'registry_ready' && !registeredEntry && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleRegister}
                                            disabled={registering}
                                            className="px-4 py-2 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {registering ? 'Registering…' : 'Register Asset'}
                                        </button>
                                        {registerError && (
                                            <span className="text-sm text-red-600 dark:text-red-400">{registerError}</span>
                                        )}
                                    </div>

                                    {/* W70-T1: 409 duplicate — lifecycle-aware guidance */}
                                    {duplicateEntry && (
                                        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
                                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                                This logical asset is already registered and active.
                                            </p>
                                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                                The registry enforces one active entry per{' '}
                                                <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">source_ref + candidate_asset_type</code>.
                                                To register a new version: go to the{' '}
                                                <strong>Registry tab</strong>, retire the existing active entry (ID:{' '}
                                                <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded text-xs">{duplicateEntry.id}</code>),
                                                then return here and register again.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Registered confirmation */}
                            {registeredEntry && (
                                <div className="rounded-lg border border-green-400 bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-300 space-y-1">
                                    <p className="font-semibold">Asset registered in governed registry.</p>
                                    <p>ID: <code className="text-xs bg-green-100 dark:bg-green-800 px-1 rounded">{registeredEntry.id}</code></p>
                                    <p>Name: <strong>{registeredEntry.assetName}</strong> · Version: {registeredEntry.assetVersion}</p>
                                    <p>Registered at: {new Date(registeredEntry.registeredAt).toLocaleString()}</p>
                                </div>
                            )}

                            {/* Warnings (CP3 grouped) */}
                            {result.warnings.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Review Warnings ({result.warnings.length})
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
                                <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-300">
                                    Planner requires clarification before registry handoff.
                                    {result.plannerTrigger.negative_matches.length > 0 && (
                                        <span className="ml-1">
                                            Negative signals: {result.plannerTrigger.negative_matches.join(', ')}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── REGISTRY TAB ── */}
            {activeTab === 'registry' && (
                <div className="space-y-4">
                    {/* W70-T1: filter + refresh controls */}
                    <div className="space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Governed assets registered through the preparation pipeline.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <label htmlFor="status_filter" className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
                                Status:
                            </label>
                            <select
                                id="status_filter"
                                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            >
                                <option value="all">All</option>
                                <option value="active">Active only</option>
                                <option value="retired">Retired only</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Filter by source ref…"
                                value={sourceRefFilter}
                                onChange={(e) => setSourceRefFilter(e.target.value)}
                                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white w-44"
                            />
                            <input
                                type="text"
                                placeholder="Filter by asset type…"
                                value={assetTypeFilter}
                                onChange={(e) => setAssetTypeFilter(e.target.value)}
                                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white w-44"
                            />
                            <button
                                type="button"
                                onClick={() => loadRegistry(statusFilter, sourceRefFilter, assetTypeFilter)}
                                disabled={registryLoading}
                                className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                {registryLoading ? 'Loading…' : 'Refresh'}
                            </button>
                        </div>
                    </div>

                    {/* W70-T1: retire error banner */}
                    {retireError && (
                        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
                            Retirement failed: {retireError}
                        </div>
                    )}

                    {registryEntries.length === 0 && !registryLoading && (
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-8 text-center text-sm text-gray-400">
                            No assets registered yet. Use the Prepare Asset tab to run the governance pipeline and register approved assets.
                        </div>
                    )}

                    {registryEntries.length > 0 && (
                        <div className="space-y-2">
                            {registryEntries.map((entry) => {
                                const lifecycle = entry.lifecycleStatus ?? 'active';
                                const badge = LIFECYCLE_BADGE[lifecycle];
                                const isRetiring = retireLoadingId === entry.id;
                                return (
                                    <div
                                        key={entry.id}
                                        className={`bg-white dark:bg-gray-800 rounded-lg border p-4 ${
                                            lifecycle === 'retired'
                                                ? 'border-gray-200 dark:border-gray-700 opacity-70'
                                                : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.assetName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{entry.source_ref}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{entry.description_or_trigger}</p>
                                            </div>
                                            <div className="text-right space-y-1 shrink-0">
                                                {/* W70-T1: lifecycle badge (primary) */}
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                                <p className="text-xs text-gray-400">{entry.riskLevel} · {entry.approvalState}</p>
                                                <p className="text-xs text-gray-400">{new Date(entry.registeredAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
                                            <p className="text-xs text-gray-400 font-mono">ID: {entry.id}</p>
                                            <p className="text-xs text-gray-400">Owner: {entry.governanceOwner} · v{entry.assetVersion}</p>

                                            {/* W70-T1: retired timestamp */}
                                            {lifecycle === 'retired' && entry.retiredAt && (
                                                <p className="text-xs text-gray-400">
                                                    Retired: {new Date(entry.retiredAt).toLocaleString()}
                                                </p>
                                            )}

                                            {/* W70-T1: re-register guidance for retired entries */}
                                            {lifecycle === 'retired' && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    This entry is retired. You may now re-register the same logical asset via the Prepare Asset tab.
                                                </p>
                                            )}

                                            {/* W70-T1: retire action — active entries only */}
                                            {lifecycle === 'active' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRetire(entry.id)}
                                                    disabled={isRetiring || retireLoadingId !== null}
                                                    className="mt-1 text-xs px-2 py-1 rounded border border-red-300 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                                                >
                                                    {isRetiring ? 'Retiring…' : 'Retire'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
