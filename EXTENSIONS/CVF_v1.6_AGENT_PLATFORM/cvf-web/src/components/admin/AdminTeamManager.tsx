'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_USERS, UserRecord } from '@/lib/mock-enterprise-db';
import type { TeamRole } from 'cvf-guard-contract/enterprise';

export function AdminTeamManager() {
  const [users, setUsers] = useState<UserRecord[]>(MOCK_USERS);
  const [isSaving, setIsSaving] = useState(false);

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as TeamRole } : u));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    alert('Roles updated successfully! (Mock)');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-blue-500">Home</Link>
            <span>/</span>
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">Team Roles</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            👥 Team Role Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage member access across the CVF project. Roles define maximum allowed risk levels and phases.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-medium transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
          Role Permissions Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="font-bold text-purple-600">Owner</div>
            <div className="text-xs text-gray-500 mt-1">Full access (R3+). Configures guards.</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="font-bold text-red-600">Admin</div>
            <div className="text-xs text-gray-500 mt-1">Full access (R3+). Can approve requests.</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="font-bold text-indigo-600">Reviewer</div>
            <div className="text-xs text-gray-500 mt-1">Review phase only. Can approve R3.</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="font-bold text-blue-600">Developer</div>
            <div className="text-xs text-gray-500 mt-1">Build phase. Max risk R2. Needs approval for R3.</div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="font-bold text-gray-600">Viewer</div>
            <div className="text-xs text-gray-500 mt-1">Discovery phase only (R0). Read-only.</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th className="py-4 px-6 font-semibold text-sm text-gray-600 dark:text-gray-400">Name / Email</th>
              <th className="py-4 px-6 font-semibold text-sm text-gray-600 dark:text-gray-400">Team</th>
              <th className="py-4 px-6 font-semibold text-sm text-gray-600 dark:text-gray-400">Joined</th>
              <th className="py-4 px-6 font-semibold text-sm text-gray-600 dark:text-gray-400 w-64">Assigned Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="py-4 px-6 text-sm text-gray-500">{user.teamId}</td>
                <td className="py-4 px-6 text-sm text-gray-500">
                  {new Date(user.joinedAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-6">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 outline-none"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="developer">Developer</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
