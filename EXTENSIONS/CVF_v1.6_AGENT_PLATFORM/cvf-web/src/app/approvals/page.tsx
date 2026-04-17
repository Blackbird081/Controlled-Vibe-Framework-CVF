'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ApprovalRequest } from 'cvf-guard-contract/enterprise';

// Mock Data for UI
const MOCK_REQUESTS: ApprovalRequest[] = [
  {
    id: 'req_1',
    requestedBy: 'usr_3',
    action: 'Deploy hotfix to production server',
    phase: 'BUILD',
    riskLevel: 'R3',
    reason: 'Deploy hotfix to production server',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 22).toISOString(),
  },
  {
    id: 'req_2',
    requestedBy: 'usr_3',
    action: 'Run migrations on staging database',
    phase: 'REVIEW',
    riskLevel: 'R3', // Developer pushing to R3
    reason: 'Run migrations on staging database',
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    expiresAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    reviewedAt: new Date(Date.now() - 3600000 * 47).toISOString(),
    reviewedBy: 'usr_2',
    reviewComment: 'Verified migration script, looks safe.',
  },
  {
    id: 'req_3',
    requestedBy: 'usr_4',
    action: 'Export full database snapshot for local testing',
    phase: 'INTAKE',
    riskLevel: 'R1',
    reason: 'Export full database snapshot for local testing',
    status: 'rejected',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 12).toISOString(),
    reviewedAt: new Date(Date.now() - 3600000 * 11).toISOString(),
    reviewedBy: 'usr_1',
    reviewComment: 'Security risk. Please use anonymized dump instead.',
  }
];

export default function ApprovalsPage() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<ApprovalRequest[]>(MOCK_REQUESTS);
  const riskLevelFilter = searchParams.get('riskLevel');

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    const reason = prompt(`Enter reason for ${action.toLowerCase()}:`);
    if (reason === null) return; // cancelled
    
    setRequests(requests.map(req => 
      req.id === id 
        ? { 
            ...req, 
            status: action, 
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Current Admin',
            reviewComment: reason,
          } 
        : req
    ));
  };

  const filteredRequests = riskLevelFilter
    ? requests.filter(r => r.riskLevel === riskLevelFilter)
    : requests;

  const pending = filteredRequests.filter(r => r.status === 'pending');
  const history = filteredRequests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-blue-500">Home</Link>
            <span>/</span>
            <span>Enterprise</span>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">Approvals</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            📥 Approval Inbox
            {pending.length > 0 && (
              <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 rounded-full">
                {pending.length} Pending
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Review and manage ESCALATED guard requests from team members.
          </p>
          {riskLevelFilter && (
            <div className="mt-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              Prefilter: {riskLevelFilter}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Action Required</h2>
          {pending.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700 border-dashed">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-gray-500 font-medium">No pending approvals. All caught up!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pending.map(req => (
                <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-l-4 border-l-amber-500 border-y-gray-200 border-r-gray-200 dark:border-y-gray-700 dark:border-r-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{req.requestedBy}</span>
                        <span className="text-gray-400 dark:text-gray-500 text-sm">requested</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">Risk: {req.riskLevel}</span>
                        <span className="text-gray-400 dark:text-gray-500 text-sm">in</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-bold rounded">Phase: {req.phase}</span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 text-lg mb-4">&quot;{req.reason}&quot;</p>
                      <div className="text-xs text-gray-500">
                        Created: {new Date(req.createdAt).toLocaleString()} • Expires: {new Date(req.expiresAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleAction(req.id, 'approved')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, 'rejected')}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Decision History</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-6 font-semibold text-gray-600 dark:text-gray-400">Request</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 dark:text-gray-400">Target</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 dark:text-gray-400">Decision</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 dark:text-gray-400">Reviewer Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs" title={req.reason}>{req.reason}</div>
                      <div className="text-xs text-gray-500 mt-1">By {req.requestedBy} on {new Date(req.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {req.phase} / {req.riskLevel}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                         req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                         req.status === 'expired' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : 
                         'bg-red-100 text-red-700'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-700 dark:text-gray-300 truncate max-w-xs">{req.reviewComment || '-'}</div>
                      <div className="text-xs text-gray-500 mt-1">{req.reviewedBy}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
