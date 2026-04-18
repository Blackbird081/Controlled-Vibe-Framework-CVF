'use client';

import { useState } from 'react';
import type { TeamRole } from 'cvf-guard-contract/enterprise';

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

export function AdminToolPolicyControls({
  initialTools,
}: {
  initialTools: ToolPolicyView[];
}) {
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
      setError('Owner role cannot be removed from any tool.');
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
      setSuccess(`Saved policy for ${tool.name}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update tool policy.');
    } finally {
      setSavingToolId(null);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {tools.map(tool => (
        <article
          key={tool.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-gray-500">{tool.category.toUpperCase()}</div>
              <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                {tool.icon} {tool.name}
              </h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              ENABLED
            </span>
          </div>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>

          <div className="mt-4 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm dark:border-gray-700">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Policy Source</div>
            <div className="mt-2 text-gray-700 dark:text-gray-200">
              {tool.policySource === 'custom'
                ? `Custom policy active since ${tool.policyUpdatedAt ? new Date(tool.policyUpdatedAt).toLocaleString() : 'now'}.`
                : 'Inherited default role matrix.'}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Allowed Roles</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ROLE_OPTIONS.map(role => {
                const checked = tool.allowedRoles.includes(role);
                return (
                  <label
                    key={role}
                    className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                  >
                    <span className="font-medium text-gray-700 capitalize dark:text-gray-200">{role}</span>
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
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Parameters</div>
            <div className="mt-2 space-y-2">
              {tool.parameters.map(param => (
                <div key={param.name} className="rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {param.name} <span className="text-gray-500">({param.type})</span>
                  </div>
                  <div className="mt-1 text-gray-600 dark:text-gray-300">{param.description}</div>
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
            {savingToolId === tool.id ? 'Saving...' : 'Save Policy'}
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
