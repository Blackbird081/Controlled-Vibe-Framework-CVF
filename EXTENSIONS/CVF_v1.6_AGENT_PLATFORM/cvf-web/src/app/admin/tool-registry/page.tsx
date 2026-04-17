import { requireAdminSession } from '@/lib/admin-session';
import { TOOL_REGISTRY_CATALOG, TOOL_ROLE_MATRIX } from '@/lib/tool-registry-catalog';

export default async function AdminToolRegistryPage() {
  await requireAdminSession('/admin/tool-registry');
  const tools = TOOL_REGISTRY_CATALOG;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Phase B • Read-only</div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">Tool Registry Inventory</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Current MCP-style tool inventory surfaced from the web runtime. Toggles remain locked until Phase C.
        </p>
      </div>

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

            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Allowed Roles</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(TOOL_ROLE_MATRIX[tool.category] ?? ['owner', 'admin']).map(role => (
                  <span
                    key={role}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {role}
                  </span>
                ))}
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
          </article>
        ))}
      </div>
    </div>
  );
}
