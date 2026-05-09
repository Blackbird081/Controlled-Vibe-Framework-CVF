'use client';

import { useState, useCallback } from 'react';

type Decision = 'ALLOW' | 'BLOCK' | 'ESCALATE';

interface GuardResultItem {
  guardId: string;
  decision: Decision;
  severity: string;
  reason: string;
  agentGuidance?: string;
  suggestedAction?: string;
}

interface EvalResponse {
  success: boolean;
  data?: {
    requestId: string;
    finalDecision: Decision;
    blockedBy?: string;
    escalatedBy?: string;
    agentGuidance?: string;
    durationMs: number;
    guardsEvaluated: number;
    results: GuardResultItem[];
  };
  error?: string;
}

const PHASES = ['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE'] as const;
const RISK_LEVELS = ['R0', 'R1', 'R2', 'R3'] as const;
const ROLES = ['HUMAN', 'OBSERVER', 'ANALYST', 'BUILDER', 'REVIEWER', 'GOVERNOR', 'AI_AGENT', 'OPERATOR'] as const;

const DECISION_STYLES: Record<Decision, { bg: string; text: string; icon: string }> = {
  ALLOW: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: '✅' },
  BLOCK: { bg: 'bg-red-500/15', text: 'text-red-400', icon: '🛑' },
  ESCALATE: { bg: 'bg-amber-500/15', text: 'text-amber-400', icon: '⚠️' },
};

export default function GuardsPage() {
  const [phase, setPhase] = useState<string>('BUILD');
  const [riskLevel, setRiskLevel] = useState<string>('R0');
  const [role, setRole] = useState<string>('BUILDER');
  const [action, setAction] = useState<string>('write code');
  const [result, setResult] = useState<EvalResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const evaluate = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/guards/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: `web-${Date.now()}`,
          phase,
          riskLevel,
          role,
          action,
          agentId: role === 'AI_AGENT' ? 'web-ui-agent' : undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [phase, riskLevel, role, action]);

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">🛡️ Guard Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Kiểm tra hành động theo canonical runtime `5-phase / 8-guard` của CVF
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard label="Guards Active" value="8 / 8" color="emerald" />
        <StatusCard label="Engine Mode" value="Strict" color="blue" />
        <StatusCard label="Default Flow" value="INTAKE → FREEZE" color="amber" />
        <StatusCard label="Bridge" value="Next.js API" color="purple" />
      </div>

      {/* Evaluation Form */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">🔍 Guard Evaluation</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <SelectField
            label="Phase"
            value={phase}
            onChange={setPhase}
            options={PHASES.map((p) => ({ value: p, label: p }))}
          />
          <SelectField
            label="Risk Level"
            value={riskLevel}
            onChange={setRiskLevel}
            options={RISK_LEVELS.map((r) => ({
              value: r,
              label: r === 'R0' ? 'R0 (Safe)' : r === 'R1' ? 'R1 (Controlled)' : r === 'R2' ? 'R2 (Elevated)' : 'R3 (Critical)',
            }))}
          />
          <SelectField
            label="Role"
            value={role}
            onChange={setRole}
            options={ROLES.map((r) => ({ value: r, label: r.replaceAll('_', ' ') }))}
          />
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Action</label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="clarify scope, analyze spec, write code, approve review..."
            />
          </div>
        </div>

        <button
          onClick={evaluate}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? '⏳ Evaluating...' : '▶️ Evaluate Guards'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Final Decision */}
          {result.success && result.data && (
            <>
              <div className={`${DECISION_STYLES[result.data.finalDecision].bg} border border-gray-800 rounded-xl p-6`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{DECISION_STYLES[result.data.finalDecision].icon}</span>
                  <div>
                    <h3 className={`text-2xl font-bold ${DECISION_STYLES[result.data.finalDecision].text}`}>
                      {result.data.finalDecision}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {result.data.guardsEvaluated} guards evaluated in {result.data.durationMs}ms
                    </p>
                  </div>
                </div>
                {result.data.blockedBy && (
                  <p className="text-red-400 text-sm mt-2">Blocked by: <strong>{result.data.blockedBy}</strong></p>
                )}
                {result.data.escalatedBy && (
                  <p className="text-amber-400 text-sm mt-2">Escalated by: <strong>{result.data.escalatedBy}</strong></p>
                )}
                {result.data.agentGuidance && (
                  <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 mb-1">Agent Guidance:</p>
                    <p className="text-gray-300 text-sm">{result.data.agentGuidance}</p>
                  </div>
                )}
              </div>

              {/* Individual Guard Results */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📋 Guard Results</h3>
                <div className="space-y-3">
                  {result.data.results.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-lg mt-0.5">{DECISION_STYLES[r.decision]?.icon ?? '❓'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-gray-300">{r.guardId}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${DECISION_STYLES[r.decision]?.bg ?? ''} ${DECISION_STYLES[r.decision]?.text ?? ''}`}>
                            {r.decision}
                          </span>
                          <span className="text-xs text-gray-500">{r.severity}</span>
                        </div>
                        <p className="text-sm text-gray-400">{r.reason}</p>
                        {r.agentGuidance && (
                          <p className="text-xs text-blue-400 mt-1 italic">{r.agentGuidance}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!result.success && (
            <div className="bg-red-500/10 border border-red-800 rounded-xl p-4">
              <p className="text-red-400">❌ Error: {result.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Phase Matrix */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📐 Phase-Role Matrix</h3>
        <p className="text-sm text-gray-400 mb-4">
          Bảng tóm tắt core roles trong canonical CVF runtime. Các legacy roles như `AI_AGENT` và `OPERATOR` vẫn được hỗ trợ để tương thích.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 px-3 text-gray-400">Phase</th>
                <th className="text-center py-2 px-3 text-gray-400">HUMAN</th>
                <th className="text-center py-2 px-3 text-gray-400">ANALYST</th>
                <th className="text-center py-2 px-3 text-gray-400">BUILDER</th>
                <th className="text-center py-2 px-3 text-gray-400">REVIEWER</th>
                <th className="text-center py-2 px-3 text-gray-400">GOVERNOR</th>
              </tr>
            </thead>
            <tbody>
              {[
                { phase: 'INTAKE', human: true, analyst: true, builder: false, reviewer: false, governor: true },
                { phase: 'DESIGN', human: true, analyst: true, builder: false, reviewer: true, governor: true },
                { phase: 'BUILD', human: true, analyst: false, builder: true, reviewer: false, governor: false },
                { phase: 'REVIEW', human: true, analyst: true, builder: true, reviewer: true, governor: true },
                { phase: 'FREEZE', human: true, analyst: false, builder: false, reviewer: false, governor: true },
              ].map((row) => (
                <tr key={row.phase} className="border-b border-gray-800/50">
                  <td className="py-2 px-3 font-mono text-white">{row.phase}</td>
                  <td className="py-2 px-3 text-center">{row.human ? '✅' : '🚫'}</td>
                  <td className="py-2 px-3 text-center">{row.analyst ? '✅' : '🚫'}</td>
                  <td className="py-2 px-3 text-center">{row.builder ? '✅' : '🚫'}</td>
                  <td className="py-2 px-3 text-center">{row.reviewer ? '✅' : '🚫'}</td>
                  <td className="py-2 px-3 text-center">{row.governor ? '✅' : '🚫'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function StatusCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-800/50',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-800/50',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-800/50',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-800/50',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorMap[color] ?? colorMap.blue}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold mt-1 ${colorMap[color]?.split(' ')[0] ?? 'text-white'}`}>{value}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
