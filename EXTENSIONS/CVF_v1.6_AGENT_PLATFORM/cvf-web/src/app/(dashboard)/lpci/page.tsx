'use client';

import { useState } from 'react';
import type { AuditReceipt, FilterParams } from '@/lib/lpci/types';

// Registered corpora pulled from status endpoint at query time.
// For prototype: hardcoded known pilot corpus ID from CI2-T4.
const PILOT_CORPUS_ID = 'GOVERNANCE_PILOT_NO_LEGAL_CORPUS';

const ANSWER_CLASS_LABELS: Record<string, { label: string; color: string }> = {
  DIRECT_CITED_ANSWER: { label: 'Direct Cited Answer', color: 'bg-green-100 text-green-800' },
  SUMMARY_WITH_SOURCE: { label: 'Summary with Source', color: 'bg-blue-100 text-blue-800' },
  PROCEDURAL_GUIDANCE: { label: 'Procedural Guidance', color: 'bg-yellow-100 text-yellow-800' },
  ESCALATE_OR_ABSTAIN: { label: 'Escalate / Abstain', color: 'bg-red-100 text-red-800' },
};

interface QueryResult {
  response?: string;
  answerClass?: string;
  matchedSources?: string[];
  freshnessFlag?: boolean;
  conflictFlag?: boolean;
  receiptType?: string;
  auditReceipt?: AuditReceipt;
  error?: string;
}

export default function LpciPage() {
  const [corpusId, setCorpusId] = useState(PILOT_CORPUS_ID);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [showAuditReceipt, setShowAuditReceipt] = useState(false);
  const [filters] = useState<FilterParams>({});

  async function handleQuery() {
    if (!query.trim() || !corpusId) return;
    setLoading(true);
    setResult(null);
    setShowAuditReceipt(false);
    try {
      const res = await fetch('/api/lpci/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, corpusId, filters }),
      });
      const data = await res.json() as QueryResult;
      setResult(data);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  function exportAuditReceipt() {
    if (!result?.auditReceipt) return;
    const blob = new Blob([JSON.stringify(result.auditReceipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-receipt-${result.auditReceipt.auditId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const badge = result?.answerClass ? ANSWER_CLASS_LABELS[result.answerClass] : null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Legal / Policy Corpus Intelligence</h1>
        <p className="mt-1 text-sm text-gray-500">
          LPCI1-T5 Chatbot Prototype — citation-first, bounded answers from registered corpora only.
        </p>
        <p className="mt-1 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 inline-block">
          Based on retrieved documents only. Not legal advice.
        </p>
      </div>

      {/* Corpus selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Corpus</label>
        <select
          value={corpusId}
          onChange={(e) => setCorpusId(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={PILOT_CORPUS_ID}>Governance Pilot (CI2-T4)</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">Only GC-051 registered corpora are available.</p>
      </div>

      {/* Query input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Query</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          placeholder="Enter your query about the selected corpus..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleQuery(); }}
        />
        <button
          onClick={handleQuery}
          disabled={loading || !query.trim()}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Querying...' : 'Query'}
        </button>
      </div>

      {/* Response panel */}
      {result && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Answer boundary badge */}
          {badge && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Answer class:</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          )}

          {/* NO_PROVIDER_CONFIGURED */}
          {result.receiptType === 'NO_PROVIDER_CONFIGURED' && (
            <div className="text-sm text-amber-700 bg-amber-50 rounded p-3">
              <strong>No LLM provider configured.</strong> Set the <code>LPCI_LLM_API_KEY</code> environment variable to enable answers.
              {result.auditReceipt && (
                <div className="mt-2 text-xs text-gray-500">
                  Retrieval completed — {(result as QueryResult & { retrievalReceipt?: { matched_paths: string[] } }).retrievalReceipt?.matched_paths?.length ?? 0} source(s) matched. AuditReceipt available below.
                </div>
              )}
            </div>
          )}

          {/* Negative receipts */}
          {result.receiptType && result.receiptType !== 'NO_PROVIDER_CONFIGURED' && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded p-3">
              <strong>Receipt type:</strong> {result.receiptType}
            </div>
          )}

          {/* Answer text */}
          {result.response && (
            <div className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded p-3">
              {result.response}
            </div>
          )}

          {/* Freshness warning */}
          {result.freshnessFlag && (
            <div className="text-xs text-amber-700 bg-amber-50 rounded p-2">
              ⚠ FRESHNESS WARNING — one or more sources may not be current (status: amended or superseded).
            </div>
          )}

          {/* Conflict notice */}
          {result.conflictFlag && (
            <div className="text-xs text-red-700 bg-red-50 rounded p-2">
              ⚠ CONFLICT — two or more sources conflict on this topic. Resolution requires operator judgment.
            </div>
          )}

          {/* Matched sources */}
          {result.matchedSources && result.matchedSources.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Retrieved sources</div>
              <ul className="text-xs text-gray-600 space-y-0.5">
                {result.matchedSources.map((src) => (
                  <li key={src} className="font-mono bg-gray-100 rounded px-2 py-0.5">{src}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Error */}
          {result.error && (
            <div className="text-sm text-red-700 bg-red-50 rounded p-3">
              Error: {result.error}
            </div>
          )}

          {/* AuditReceipt */}
          {result.auditReceipt && (
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAuditReceipt(!showAuditReceipt)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {showAuditReceipt ? 'Hide' : 'Show'} AuditReceipt
                </button>
                <button
                  onClick={exportAuditReceipt}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Export JSON
                </button>
                <span className="text-xs text-gray-400">ID: {result.auditReceipt.auditId}</span>
              </div>
              {showAuditReceipt && (
                <pre className="mt-2 text-xs bg-gray-50 rounded p-3 overflow-auto max-h-64">
                  {JSON.stringify(result.auditReceipt, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        LPCI1-T5 prototype — local only, no production corpus, no legal advice quality claim.
      </p>
    </div>
  );
}
