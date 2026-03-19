'use client';

import React from 'react';
import Link from 'next/link';
import type { ComplianceReport } from 'cvf-guard-contract/enterprise';

// Mock report data complying with actual ComplianceReport interface
const MOCK_REPORT: ComplianceReport = {
  generatedAt: new Date().toISOString(),
  reportPeriod: {
    from: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    to: new Date().toISOString()
  },
  summary: {
    totalActions: 1245,
    allowedActions: 1161,
    blockedActions: 42,
    escalatedActions: 42,
    approvalRate: 96,
    avgResponseTimeMs: 142
  },
  guardBreakdown: [
    { guardId: 'PhaseGateGuard', triggered: 1245, blocked: 12, allowed: 1233 },
    { guardId: 'IntentGuard', triggered: 1245, blocked: 30, allowed: 1215 }
  ],
  riskDistribution: {
    'R0': 450,
    'R1': 520,
    'R2': 233,
    'R3': 42
  },
  phaseDistribution: {
    'INTAKE': 410,
    'DESIGN': 255,
    'BUILD': 360,
    'REVIEW': 170,
    'FREEZE': 50
  },
  topBlockedActions: [
    { action: 'system_execute', count: 18, reason: 'Risk R3 exceeds Developer Role Max R2' },
    { action: 'file_delete', count: 12, reason: 'Destructive action blocked by PhaseGate' }
  ],
  teamActivity: [
    { memberId: 'usr_3', actions: 450, blocked: 12 },
    { memberId: 'usr_5', actions: 120, blocked: 4 }
  ],
  complianceScore: 96
};

export default function ComplianceReportPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/" className="hover:text-blue-500">Home</Link>
              <span>/</span>
              <span>Enterprise</span>
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">Compliance</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              📊 Compliance & Audit Report
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Auto-generated governance metrics for the last 30 days.
            </p>
          </div>
          <button 
            onClick={() => window.print()}
            className="px-6 py-2.5 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm font-medium flex items-center gap-2"
          >
            <span>🖨️</span> Export PDF
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Compliance Score</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-emerald-600">{MOCK_REPORT.complianceScore}</span>
              <span className="text-gray-400">/100</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Total Evals</div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">{MOCK_REPORT.summary.totalActions}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Escalations</div>
            <div className="text-4xl font-bold text-amber-500">{MOCK_REPORT.summary.escalatedActions}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Blocks</div>
            <div className="text-4xl font-bold text-red-500">{MOCK_REPORT.summary.blockedActions}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Risk Distribution Chart (Mock UI) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Risk Distribution</h2>
            <div className="space-y-4">
              {Object.entries(MOCK_REPORT.riskDistribution as Record<string, number>).map(([risk, count]) => {
                const percentage = Math.round((count / MOCK_REPORT.summary.totalActions) * 100);
                const colors: Record<string, string> = {
                  'R0': 'bg-gray-400',
                  'R1': 'bg-blue-500',
                  'R2': 'bg-amber-500',
                  'R3': 'bg-red-500'
                };
                return (
                  <div key={risk} className="flex items-center gap-4">
                    <div className="w-8 font-bold text-gray-700 dark:text-gray-300">{risk}</div>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-4 rounded-full overflow-hidden">
                      <div className={`${colors[risk]} h-full rounded-full transition-all`} style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="w-16 text-right text-sm text-gray-500">{count} ({percentage}%)</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              Most evaluations fall into the R0/R1 safe zone, indicating healthy usage patterns. 3.3% of requests required R3 elevated privileges.
            </div>
          </div>

          {/* Top Escalations Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Policy Blocks by User</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500">
                  <th className="pb-3 font-semibold">User ID</th>
                  <th className="pb-3 font-semibold text-right">Blocks / Escalations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {MOCK_REPORT.teamActivity.filter(u => u.blocked > 0).map((member) => (
                  <tr key={member.memberId}>
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{member.memberId}</td>
                    <td className="py-3 text-right">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold text-sm">
                        {member.blocked}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-3 text-gray-500 text-sm italic">System Overrides</td>
                  <td className="py-3 text-right">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full font-semibold text-sm">
                      {MOCK_REPORT.summary.blockedActions - MOCK_REPORT.teamActivity.reduce((acc, curr) => acc + curr.blocked, 0)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          Report generated at {new Date(MOCK_REPORT.generatedAt).toLocaleString()} • Next auto-generation in 14 days
        </div>

      </div>
    </div>
  );
}
