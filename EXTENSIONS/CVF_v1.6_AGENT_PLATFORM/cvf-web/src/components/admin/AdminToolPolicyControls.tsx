'use client';

import { useState } from 'react';
import type { TeamRole } from 'cvf-guard-contract/enterprise';
import { useLanguage } from '@/lib/i18n';

const ROLE_OPTIONS: TeamRole[] = ['owner', 'admin', 'developer', 'reviewer', 'viewer'];

type ToolPolicyView = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  allowedRoles: TeamRole[];
  policySource: 'default' | 'custom';
  policyUpdatedAt: string | null;
};

const ROLE_LABELS: Record<TeamRole, { en: string; vi: string }> = {
  owner: { en: 'Owner', vi: 'Chủ sở hữu' },
  admin: { en: 'Admin', vi: 'Quản trị' },
  developer: { en: 'Developer', vi: 'Người xây dựng' },
  reviewer: { en: 'Reviewer', vi: 'Người duyệt' },
  viewer: { en: 'Viewer', vi: 'Người xem' },
};

const CATEGORY_LABELS: Record<string, { en: string; vi: string }> = {
  web: { en: 'Web', vi: 'Web' },
  code: { en: 'Code', vi: 'Code' },
  file: { en: 'Files', vi: 'Tệp' },
  utility: { en: 'Utilities', vi: 'Tiện ích' },
};

const TOOL_COPY: Record<string, {
  name: { en: string; vi: string };
  description: { en: string; vi: string };
  params: Record<string, { label: { en: string; vi: string }; description: { en: string; vi: string } }>;
}> = {
  web_search: {
    name: { en: 'Web Search', vi: 'Tìm kiếm web' },
    description: { en: 'Search public information on the web.', vi: 'Tìm thông tin công khai trên web.' },
    params: {
      query: { label: { en: 'query', vi: 'từ khóa' }, description: { en: 'What to search for', vi: 'Nội dung cần tìm' } },
      limit: { label: { en: 'limit', vi: 'giới hạn' }, description: { en: 'Maximum number of results', vi: 'Số kết quả tối đa' } },
    },
  },
  code_execute: {
    name: { en: 'Code Execute', vi: 'Chạy mã' },
    description: { en: 'Run JavaScript inside the governed sandbox.', vi: 'Chạy JavaScript trong môi trường sandbox có kiểm soát.' },
    params: {
      code: { label: { en: 'code', vi: 'mã lệnh' }, description: { en: 'JavaScript to run', vi: 'Đoạn JavaScript cần chạy' } },
      timeout: { label: { en: 'timeout', vi: 'thời gian chờ' }, description: { en: 'Maximum runtime in milliseconds', vi: 'Thời gian chạy tối đa tính bằng mili giây' } },
    },
  },
  file_read: {
    name: { en: 'File Read', vi: 'Đọc tệp' },
    description: { en: 'Read governed files from the workspace.', vi: 'Đọc các tệp được cho phép trong workspace.' },
    params: {
      path: { label: { en: 'path', vi: 'đường dẫn' }, description: { en: 'Relative path to the target file', vi: 'Đường dẫn tương đối tới tệp cần đọc' } },
    },
  },
  file_write: {
    name: { en: 'File Write', vi: 'Ghi tệp' },
    description: { en: 'Write content to an approved file target.', vi: 'Ghi nội dung vào vị trí tệp đã được cho phép.' },
    params: {
      path: { label: { en: 'path', vi: 'đường dẫn' }, description: { en: 'Relative path to the target file', vi: 'Đường dẫn tương đối tới tệp cần ghi' } },
      content: { label: { en: 'content', vi: 'nội dung' }, description: { en: 'Content to write', vi: 'Nội dung sẽ được ghi' } },
    },
  },
  calculator: {
    name: { en: 'Calculator', vi: 'Máy tính' },
    description: { en: 'Evaluate simple math expressions.', vi: 'Tính toán các biểu thức toán học cơ bản.' },
    params: {
      expression: { label: { en: 'expression', vi: 'biểu thức' }, description: { en: 'Math expression to evaluate', vi: 'Biểu thức toán cần tính' } },
    },
  },
  datetime: {
    name: { en: 'Date & Time', vi: 'Ngày & giờ' },
    description: { en: 'Return the current date and time in the requested format.', vi: 'Trả về ngày giờ hiện tại theo định dạng mong muốn.' },
    params: {
      format: { label: { en: 'format', vi: 'định dạng' }, description: { en: 'Output format', vi: 'Định dạng đầu ra' } },
      timezone: { label: { en: 'timezone', vi: 'múi giờ' }, description: { en: 'Target IANA timezone', vi: 'Múi giờ IANA cần dùng' } },
    },
  },
  json_parse: {
    name: { en: 'JSON Parser', vi: 'Phân tích JSON' },
    description: { en: 'Parse JSON and optionally extract one path.', vi: 'Phân tích JSON và có thể trích xuất một nhánh cụ thể.' },
    params: {
      input: { label: { en: 'input', vi: 'đầu vào' }, description: { en: 'JSON string to parse', vi: 'Chuỗi JSON cần phân tích' } },
      path: { label: { en: 'path', vi: 'đường dẫn JSON' }, description: { en: 'Optional JSON path to extract', vi: 'Đường dẫn JSON tùy chọn để trích xuất' } },
    },
  },
  url_fetch: {
    name: { en: 'URL Fetch', vi: 'Tải dữ liệu từ URL' },
    description: { en: 'Fetch data from an approved external URL.', vi: 'Lấy dữ liệu từ một URL bên ngoài đã được cho phép.' },
    params: {
      url: { label: { en: 'url', vi: 'url' }, description: { en: 'URL to request', vi: 'URL cần gọi' } },
      method: { label: { en: 'method', vi: 'phương thức' }, description: { en: 'HTTP method to use', vi: 'Phương thức HTTP sẽ dùng' } },
    },
  },
  governance_check: {
    name: { en: 'Governance Check', vi: 'Kiểm tra quản trị' },
    description: { en: 'Simulate a lightweight governance decision before execution.', vi: 'Mô phỏng nhanh quyết định quản trị trước khi thực thi.' },
    params: {
      phase: { label: { en: 'phase', vi: 'giai đoạn' }, description: { en: 'Target workflow phase', vi: 'Giai đoạn quy trình cần kiểm tra' } },
      riskLevel: { label: { en: 'riskLevel', vi: 'mức rủi ro' }, description: { en: 'Risk level to evaluate', vi: 'Mức rủi ro cần đánh giá' } },
      action: { label: { en: 'action', vi: 'hành động' }, description: { en: 'Planned action', vi: 'Hành động dự kiến' } },
    },
  },
};

export function AdminToolPolicyControls({
  initialTools,
}: {
  initialTools: ToolPolicyView[];
}) {
  const { language } = useLanguage();
  const vi = language === 'vi';
  const [tools, setTools] = useState(initialTools);
  const [savingToolId, setSavingToolId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleRole = (toolId: string, role: TeamRole) => {
    setTools(prev => prev.map(tool => {
      if (tool.id !== toolId) return tool;

      const nextRoles = tool.allowedRoles.includes(role)
        ? tool.allowedRoles.filter(entry => entry !== role)
        : [...tool.allowedRoles, role];

      return {
        ...tool,
        allowedRoles: ROLE_OPTIONS.filter(entry => nextRoles.includes(entry)),
      };
    }));
    setError(null);
    setSuccess(null);
  };

  const savePolicy = async (toolId: string) => {
    const tool = tools.find(entry => entry.id === toolId);
    if (!tool) return;

    if (!tool.allowedRoles.includes('owner')) {
      setError(vi ? 'Vai trò chủ sở hữu luôn phải giữ quyền truy cập.' : 'Owner access must stay enabled for every tool.');
      return;
    }

    setSavingToolId(toolId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/tool-registry/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.id,
          allowedRoles: tool.allowedRoles,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to update tool policy.');
      }

      const updatedAt = payload.data?.setAt ?? new Date().toISOString();
      setTools(prev => prev.map(entry => entry.id === toolId
        ? {
          ...entry,
          allowedRoles: payload.data.allowedRoles ?? entry.allowedRoles,
          policySource: 'custom',
          policyUpdatedAt: updatedAt,
        }
        : entry));
      const toolName = TOOL_COPY[tool.id]?.name[vi ? 'vi' : 'en'] ?? tool.name;
      setSuccess(vi ? `Đã lưu quyền truy cập cho ${toolName}.` : `Saved access rules for ${toolName}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : (vi ? 'Không thể cập nhật quyền truy cập công cụ.' : 'Failed to update tool access policy.'));
    } finally {
      setSavingToolId(null);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {tools.map(tool => (
        <article
          key={tool.id}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm text-gray-500">{(CATEGORY_LABELS[tool.category]?.[vi ? 'vi' : 'en'] ?? tool.category).toUpperCase()}</div>
              <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                {tool.icon} {TOOL_COPY[tool.id]?.name[vi ? 'vi' : 'en'] ?? tool.name}
              </h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {vi ? 'ĐANG BẬT' : 'ENABLED'}
            </span>
          </div>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {TOOL_COPY[tool.id]?.description[vi ? 'vi' : 'en'] ?? tool.description}
          </p>

          <div className="mt-4 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm dark:border-gray-700">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {vi ? 'Nguồn chính sách' : 'Policy source'}
            </div>
            <div className="mt-2 text-gray-700 dark:text-gray-200">
              {tool.policySource === 'custom'
                ? (vi
                  ? `Đang dùng chính sách tùy chỉnh từ ${tool.policyUpdatedAt ? new Date(tool.policyUpdatedAt).toLocaleString('vi-VN') : 'vừa xong'}.`
                  : `Custom access rules active since ${tool.policyUpdatedAt ? new Date(tool.policyUpdatedAt).toLocaleString('en-US') : 'now'}.`)
                : (vi ? 'Đang dùng ma trận quyền mặc định.' : 'Using the default role access matrix.')}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {vi ? 'Vai trò được phép dùng' : 'Allowed roles'}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ROLE_OPTIONS.map(role => {
                const checked = tool.allowedRoles.includes(role);
                return (
                  <label
                    key={role}
                    className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-200">{ROLE_LABELS[role][vi ? 'vi' : 'en']}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(tool.id, role)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {vi ? 'Tham số đầu vào' : 'Input parameters'}
            </div>
            <div className="mt-2 space-y-2">
              {tool.parameters.map(param => (
                <div key={param.name} className="rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {(TOOL_COPY[tool.id]?.params[param.name]?.label[vi ? 'vi' : 'en'] ?? param.name)} <span className="text-gray-500">({param.type})</span>
                  </div>
                  <div className="mt-1 text-gray-600 dark:text-gray-300">
                    {TOOL_COPY[tool.id]?.params[param.name]?.description[vi ? 'vi' : 'en'] ?? param.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => savePolicy(tool.id)}
            disabled={savingToolId === tool.id}
            className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {savingToolId === tool.id ? (vi ? 'Đang lưu...' : 'Saving...') : (vi ? 'Lưu quyền truy cập' : 'Save access rules')}
          </button>
        </article>
      ))}

      {(error || success) && (
        <div className="xl:col-span-2">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
              {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
