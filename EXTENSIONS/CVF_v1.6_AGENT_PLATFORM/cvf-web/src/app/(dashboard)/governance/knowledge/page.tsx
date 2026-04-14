'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';

type ArtifactType = 'concept' | 'entity' | 'summary';
type GovChoice = 'none' | 'approved' | 'rejected';

interface CompileForm {
    contextId: string; artifactType: ArtifactType; sourceIds: string;
    citationRef: string; citationTrail: string; compiledBy: string;
    content: string; govChoice: GovChoice; rejectionReason: string;
}

interface Artifact {
    artifactId: string; artifactType: string; governanceStatus: string;
    content: string; compiledAt: string; governedAt: string | null;
    rejectionReason: string | null; contextId: string; compiledBy: string; artifactHash: string;
}
interface Signal { signalType: string; message: string; }
interface MaintainResult { artifactId: string; totalSignals: number; hasIssues: boolean; signals: Signal[]; }
interface RefactorResult { artifactId: string; recommendedAction: string; triggerTypes: string[]; rationale: string; triggeredBySignalCount: number; }

const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const SIGNAL_BADGE: Record<string, string> = {
    lint: 'bg-orange-100 text-orange-700',
    drift: 'bg-blue-100 text-blue-700',
    staleness: 'bg-purple-100 text-purple-700',
    orphan: 'bg-red-100 text-red-700',
    contradiction: 'bg-rose-100 text-rose-700',
};

const ACTION_BADGE: Record<string, string> = {
    recompile: 'bg-yellow-100 text-yellow-700',
    archive: 'bg-gray-100 text-gray-700',
    review: 'bg-blue-100 text-blue-700',
};

const LABELS = {
    vi: {
        title: '📚 Knowledge Governance', subtitle: 'Lifecycle: Compile → Govern → Maintain → Refactor',
        step1: '1. Compile & Govern', step2: '2. Maintain', step3: '3. Refactor',
        contextId: 'Context ID', artifactType: 'Artifact Type', sourceIds: 'Source IDs (phân cách bằng dấu phẩy)',
        citationRef: 'Citation Ref', citationTrail: 'Citation Trail (mỗi dòng một bước)', compiledBy: 'Compiled By',
        content: 'Content', govDecision: 'Govern Decision', govNone: 'Chưa govern (pending)',
        govApprove: 'Approve', govReject: 'Reject', rejectionReason: 'Lý do từ chối',
        compile: 'Compile', compiling: 'Đang compile...',
        artifactResult: 'Artifact Result', proceedMaintain: 'Tiến hành Maintain →',
        lintKeywords: 'Lint Keywords (phân cách bằng dấu phẩy, để trống = bỏ qua)', maxAgeDays: 'Max Age Days (để trống = bỏ qua)',
        runMaintain: 'Run Maintain', maintaining: 'Đang maintain...',
        signals: 'Quality Signals', noIssues: '✅ Không có issue',
        runRefactor: 'Run Refactor', refactoring: 'Đang refactor...',
        proposals: 'Refactor Proposals', noProposals: '✅ Không có đề xuất',
    },
    en: {
        title: '📚 Knowledge Governance', subtitle: 'Lifecycle: Compile → Govern → Maintain → Refactor',
        step1: '1. Compile & Govern', step2: '2. Maintain', step3: '3. Refactor',
        contextId: 'Context ID', artifactType: 'Artifact Type', sourceIds: 'Source IDs (comma-separated)',
        citationRef: 'Citation Ref', citationTrail: 'Citation Trail (one step per line)', compiledBy: 'Compiled By',
        content: 'Content', govDecision: 'Govern Decision', govNone: 'Skip govern (pending)',
        govApprove: 'Approve', govReject: 'Reject', rejectionReason: 'Rejection reason',
        compile: 'Compile', compiling: 'Compiling...',
        artifactResult: 'Artifact Result', proceedMaintain: 'Proceed to Maintain →',
        lintKeywords: 'Lint Keywords (comma-separated, leave empty to skip)', maxAgeDays: 'Max Age Days (leave empty to skip)',
        runMaintain: 'Run Maintain', maintaining: 'Maintaining...',
        signals: 'Quality Signals', noIssues: '✅ No issues found',
        runRefactor: 'Run Refactor', refactoring: 'Refactoring...',
        proposals: 'Refactor Proposals', noProposals: '✅ No proposals',
    },
};

const FIELD = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500';
const LABEL = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';
const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5';

export default function KnowledgeGovernancePage() {
    const { language } = useLanguage();
    const l = LABELS[language];

    const [activeStep, setActiveStep] = useState<'compile' | 'maintain' | 'refactor'>('compile');

    const [form, setForm] = useState<CompileForm>({
        contextId: 'ctx-001', artifactType: 'concept',
        sourceIds: 'src-001', citationRef: 'CVF Knowledge Base §1',
        citationTrail: 'raw-ingest-001 -> compiled-001', compiledBy: 'operator',
        content: '', govChoice: 'approved', rejectionReason: '',
    });

    const [maintainForm, setMaintainForm] = useState({ lintKeywords: '', maxAgeDays: '30' });

    const [artifact, setArtifact] = useState<Artifact | null>(null);
    const [governed, setGoverned] = useState(false);
    const [maintainResult, setMaintainResult] = useState<MaintainResult | null>(null);
    const [refactorResult, setRefactorResult] = useState<RefactorResult | null>(null);

    const [compiling, setCompiling] = useState(false);
    const [maintaining, setMaintaining] = useState(false);
    const [refactoring, setRefactoring] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleCompile() {
        setCompiling(true); setError(null);
        try {
            const body: Record<string, unknown> = {
                compileRequest: {
                    contextId: form.contextId.trim(),
                    artifactType: form.artifactType,
                    sourceIds: form.sourceIds.split(',').map(s => s.trim()).filter(Boolean),
                    citationRef: form.citationRef.trim(),
                    citationTrail: form.citationTrail.split('\n').map(s => s.trim()).filter(Boolean),
                    compiledBy: form.compiledBy.trim(),
                    content: form.content.trim(),
                },
            };
            if (form.govChoice !== 'none') {
                body.governDecision = { decision: form.govChoice, reason: form.rejectionReason || undefined };
            }
            const res = await fetch('/api/governance/knowledge/compile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Compile failed');
            setArtifact(json.data.artifact);
            setGoverned(json.data.governed);
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
        finally { setCompiling(false); }
    }

    async function handleMaintain() {
        if (!artifact) return;
        setMaintaining(true); setError(null);
        try {
            const checks: unknown[] = [];
            const kws = maintainForm.lintKeywords.split(',').map(k => k.trim()).filter(Boolean);
            if (kws.length > 0) checks.push({ type: 'lint', requiredKeywords: kws });
            const days = parseInt(maintainForm.maxAgeDays);
            if (!isNaN(days) && days > 0) checks.push({ type: 'staleness', maxAgeDays: days });
            if (checks.length === 0) checks.push({ type: 'lint', requiredKeywords: [] });
            const res = await fetch('/api/governance/knowledge/maintain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ artifact, checks }) });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Maintain failed');
            setMaintainResult(json.data);
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
        finally { setMaintaining(false); }
    }

    async function handleRefactor() {
        if (!maintainResult) return;
        setRefactoring(true); setError(null);
        try {
            const res = await fetch('/api/governance/knowledge/refactor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ result: maintainResult }) });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Refactor failed');
            setRefactorResult(json.data);
        } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
        finally { setRefactoring(false); }
    }

    const steps: { key: typeof activeStep; label: string; enabled: boolean }[] = [
        { key: 'compile', label: l.step1, enabled: true },
        { key: 'maintain', label: l.step2, enabled: artifact?.governanceStatus === 'approved' },
        { key: 'refactor', label: l.step3, enabled: !!maintainResult },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{l.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{l.subtitle}</p>
            </div>

            {/* Step tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
                {steps.map(s => (
                    <button key={s.key} onClick={() => s.enabled && setActiveStep(s.key)} disabled={!s.enabled}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeStep === s.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : s.enabled ? 'text-gray-500 dark:text-gray-400 hover:text-gray-700' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'}`}>
                        {s.label}
                    </button>
                ))}
            </div>

            {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-sm text-red-600 dark:text-red-400">{error}</div>}

            {/* ── Step 1: Compile & Govern ── */}
            {activeStep === 'compile' && (
                <div className="space-y-4">
                    <div className={CARD}>
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">{l.step1}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={LABEL}>{l.contextId}</label><input className={FIELD} title="Context ID" value={form.contextId} onChange={e => setForm(f => ({ ...f, contextId: e.target.value }))} /></div>
                            <div><label className={LABEL}>{l.artifactType}</label>
                                <select className={FIELD} title="Artifact Type" value={form.artifactType} onChange={e => setForm(f => ({ ...f, artifactType: e.target.value as ArtifactType }))}>
                                    <option value="concept">concept</option><option value="entity">entity</option><option value="summary">summary</option>
                                </select>
                            </div>
                            <div><label className={LABEL}>{l.sourceIds}</label><input className={FIELD} title="Source IDs" value={form.sourceIds} onChange={e => setForm(f => ({ ...f, sourceIds: e.target.value }))} /></div>
                            <div><label className={LABEL}>{l.citationRef}</label><input className={FIELD} title="Citation Ref" value={form.citationRef} onChange={e => setForm(f => ({ ...f, citationRef: e.target.value }))} /></div>
                            <div><label className={LABEL}>{l.compiledBy}</label><input className={FIELD} title="Compiled By" value={form.compiledBy} onChange={e => setForm(f => ({ ...f, compiledBy: e.target.value }))} /></div>
                            <div><label className={LABEL}>{l.govDecision}</label>
                                <select className={FIELD} title="Govern Decision" value={form.govChoice} onChange={e => setForm(f => ({ ...f, govChoice: e.target.value as GovChoice }))}>
                                    <option value="none">{l.govNone}</option><option value="approved">{l.govApprove}</option><option value="rejected">{l.govReject}</option>
                                </select>
                            </div>
                            <div className="md:col-span-2"><label className={LABEL}>{l.citationTrail}</label><textarea className={FIELD} title="Citation Trail" rows={2} value={form.citationTrail} onChange={e => setForm(f => ({ ...f, citationTrail: e.target.value }))} /></div>
                            <div className="md:col-span-2"><label className={LABEL}>{l.content}</label><textarea className={FIELD} rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Enter knowledge artifact content..." /></div>
                            {form.govChoice === 'rejected' && <div className="md:col-span-2"><label className={LABEL}>{l.rejectionReason}</label><input className={FIELD} title="Rejection Reason" value={form.rejectionReason} onChange={e => setForm(f => ({ ...f, rejectionReason: e.target.value }))} /></div>}
                        </div>
                        <button onClick={handleCompile} disabled={compiling || !form.content.trim()} className="mt-4 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-colors">
                            {compiling ? l.compiling : l.compile}
                        </button>
                    </div>

                    {artifact && (
                        <div className={CARD}>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{l.artifactResult}</h3>
                            <div className="flex flex-wrap gap-3 text-xs mb-3">
                                <span className={`px-2 py-1 rounded-full font-medium ${STATUS_BADGE[artifact.governanceStatus] ?? ''}`}>{artifact.governanceStatus}</span>
                                <span className="text-gray-500">type: {artifact.artifactType}</span>
                                <span className="text-gray-500 truncate max-w-[260px]">id: {artifact.artifactId}</span>
                                {governed && <span className="text-gray-500">governed: {artifact.governedAt?.slice(0, 10)}</span>}
                            </div>
                            {artifact.rejectionReason && <p className="text-xs text-red-500 mb-3">Rejected: {artifact.rejectionReason}</p>}
                            <p className="text-xs text-gray-500 font-mono bg-gray-50 dark:bg-gray-900 rounded p-2 line-clamp-3">{artifact.content}</p>
                            {artifact.governanceStatus === 'approved' && (
                                <button onClick={() => setActiveStep('maintain')} className="mt-3 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg hover:bg-emerald-100 transition-colors">
                                    {l.proceedMaintain}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Step 2: Maintain ── */}
            {activeStep === 'maintain' && artifact && (
                <div className="space-y-4">
                    <div className={CARD}>
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">{l.step2}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={LABEL}>{l.lintKeywords}</label><input className={FIELD} value={maintainForm.lintKeywords} onChange={e => setMaintainForm(f => ({ ...f, lintKeywords: e.target.value }))} placeholder="e.g. governance, policy" /></div>
                            <div><label className={LABEL}>{l.maxAgeDays}</label><input className={FIELD} title="Max Age Days" type="number" min="1" value={maintainForm.maxAgeDays} onChange={e => setMaintainForm(f => ({ ...f, maxAgeDays: e.target.value }))} /></div>
                        </div>
                        <button onClick={handleMaintain} disabled={maintaining} className="mt-4 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors">
                            {maintaining ? l.maintaining : l.runMaintain}
                        </button>
                    </div>

                    {maintainResult && (
                        <div className={CARD}>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{l.signals} ({maintainResult.totalSignals})</h3>
                            {maintainResult.signals.length === 0
                                ? <p className="text-sm text-green-600 dark:text-green-400">{l.noIssues}</p>
                                : <div className="space-y-2">{maintainResult.signals.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                        <span className={`px-1.5 py-0.5 rounded font-medium ${SIGNAL_BADGE[s.signalType] ?? 'bg-gray-100 text-gray-700'}`}>{s.signalType}</span>
                                        <span className="text-gray-600 dark:text-gray-400">{s.message}</span>
                                    </div>
                                ))}</div>
                            }
                            {maintainResult.hasIssues && (
                                <button onClick={() => setActiveStep('refactor')} className="mt-3 px-4 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 transition-colors">
                                    Run Refactor →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Step 3: Refactor ── */}
            {activeStep === 'refactor' && maintainResult && (
                <div className="space-y-4">
                    <div className={CARD}>
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">{l.step3}</h2>
                        <p className="text-sm text-gray-500 mb-4">Signals: {maintainResult.totalSignals} | hasIssues: {String(maintainResult.hasIssues)}</p>
                        <button onClick={handleRefactor} disabled={refactoring || !maintainResult.hasIssues} className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 transition-colors">
                            {refactoring ? l.refactoring : l.runRefactor}
                        </button>
                        {!maintainResult.hasIssues && <p className="mt-2 text-sm text-green-600 dark:text-green-400">{l.noIssues} — no refactor needed.</p>}
                    </div>

                    {refactorResult && (
                        <div className={CARD}>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{l.proposals}</h3>
                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-xs space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded font-medium ${ACTION_BADGE[refactorResult.recommendedAction] ?? 'bg-gray-100 text-gray-700'}`}>{refactorResult.recommendedAction}</span>
                                    <span className="text-gray-400">triggers: {refactorResult.triggerTypes.join(', ')}</span>
                                    <span className="text-gray-400">signals: {refactorResult.triggeredBySignalCount}</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">{refactorResult.rationale}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
