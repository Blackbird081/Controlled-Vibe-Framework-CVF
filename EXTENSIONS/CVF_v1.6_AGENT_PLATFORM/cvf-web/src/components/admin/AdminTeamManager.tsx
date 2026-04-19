'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_USERS, UserRecord } from '@/lib/mock-enterprise-db';
import type { TeamRole } from 'cvf-guard-contract/enterprise';
import { useLanguage } from '@/lib/i18n';

const ROLE_INFO = {
  owner:     { color: 'text-purple-600', en: 'Owner',     vi: 'Chủ sở hữu',  descEn: 'Full access (R3+). Configures guards.',           descVi: 'Toàn quyền (R3+). Cấu hình guard.' },
  admin:     { color: 'text-red-600',    en: 'Admin',     vi: 'Quản trị',     descEn: 'Full access (R3+). Can approve requests.',         descVi: 'Toàn quyền (R3+). Phê duyệt yêu cầu.' },
  reviewer:  { color: 'text-indigo-600', en: 'Reviewer',  vi: 'Kiểm duyệt',   descEn: 'Review phase only. Can approve R3.',               descVi: 'Chỉ pha kiểm duyệt. Phê duyệt R3.' },
  developer: { color: 'text-blue-600',   en: 'Developer', vi: 'Lập trình viên', descEn: 'Build phase. Max risk R2. Needs approval for R3.', descVi: 'Pha xây dựng. Rủi ro tối đa R2. Cần phê duyệt R3.' },
  viewer:    { color: 'text-gray-500',   en: 'Viewer',    vi: 'Quan sát',     descEn: 'Discovery phase only (R0). Read-only.',            descVi: 'Chỉ pha khám phá (R0). Chỉ đọc.' },
};

export function AdminTeamManager() {
  const [users, setUsers] = useState<UserRecord[]>(MOCK_USERS);
  const [isSaving, setIsSaving] = useState(false);
  const { language } = useLanguage();
  const vi = language === 'vi';

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as TeamRole } : u));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    alert(vi ? 'Đã cập nhật quyền thành công! (Mock)' : 'Roles updated successfully! (Mock)');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/home" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {vi ? 'Trang chủ' : 'Home'}
            </Link>
            <span>/</span>
            <span>Admin</span>
            <span>/</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {vi ? 'Phân quyền nhóm' : 'Team Roles'}
            </span>
          </div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-white">
            👥 {vi ? 'Quản lý phân quyền nhóm' : 'Team Role Management'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {vi
              ? 'Quản lý quyền truy cập của thành viên trong dự án CVF. Vai trò định nghĩa mức rủi ro và pha tối đa được phép.'
              : 'Manage member access across the CVF project. Roles define maximum allowed risk levels and phases.'}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving
            ? (vi ? 'Đang lưu...' : 'Saving...')
            : (vi ? 'Lưu thay đổi' : 'Save Changes')}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-[#171b29]">
        <h3 className="mb-4 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:border-white/[0.06] dark:text-white/40">
          {vi ? 'Tham chiếu quyền hạn vai trò' : 'Role Permissions Reference'}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {(Object.keys(ROLE_INFO) as Array<keyof typeof ROLE_INFO>).map(role => {
            const info = ROLE_INFO[role];
            return (
              <div key={role} className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className={`font-bold ${info.color}`}>{vi ? info.vi : info.en}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-white/40">{vi ? info.descVi : info.descEn}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#171b29]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-white/50">
                {vi ? 'Tên / Email' : 'Name / Email'}
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-white/50">
                {vi ? 'Nhóm' : 'Team'}
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-white/50">
                {vi ? 'Ngày tham gia' : 'Joined'}
              </th>
              <th className="w-64 px-6 py-4 text-sm font-semibold text-gray-600 dark:text-white/50">
                {vi ? 'Vai trò được gán' : 'Assigned Role'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {users.map(user => (
              <tr key={user.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.03]">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                  <div className="text-sm text-gray-500 dark:text-white/40">{user.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-white/40">{user.teamId}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-white/40">
                  {new Date(user.joinedAt).toLocaleDateString(vi ? 'vi-VN' : 'en-US')}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
                    aria-label={vi ? 'Chọn vai trò' : 'Select role'}
                  >
                    {(Object.keys(ROLE_INFO) as Array<keyof typeof ROLE_INFO>).map(role => (
                      <option key={role} value={role}>
                        {vi ? ROLE_INFO[role].vi : ROLE_INFO[role].en}
                      </option>
                    ))}
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
