import type { TeamRole } from 'cvf-guard-contract/enterprise';

import { getAllToolPolicies } from '@/lib/policy-reader';

export interface ToolRegistryCatalogEntry {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'code' | 'file' | 'utility';
  icon: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

export interface ToolInventoryEntry extends ToolRegistryCatalogEntry {
  allowedRoles: TeamRole[];
  policySource: 'default' | 'custom';
  policyUpdatedAt: string | null;
}

export const TOOL_ROLE_MATRIX: Record<string, TeamRole[]> = {
  web: ['owner', 'admin', 'developer', 'reviewer'],
  code: ['owner', 'admin', 'developer'],
  file: ['owner', 'admin', 'developer'],
  utility: ['owner', 'admin', 'developer', 'reviewer', 'viewer'],
};

export const TOOL_REGISTRY_CATALOG: ToolRegistryCatalogEntry[] = [
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the web for information.',
    category: 'web',
    icon: '🔍',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query' },
      { name: 'limit', type: 'number', description: 'Max results' },
    ],
  },
  {
    id: 'code_execute',
    name: 'Code Execute',
    description: 'Execute JavaScript code inside the CVF sandbox.',
    category: 'code',
    icon: '▶️',
    parameters: [
      { name: 'code', type: 'string', description: 'JavaScript code to execute' },
      { name: 'timeout', type: 'number', description: 'Execution timeout in ms' },
    ],
  },
  {
    id: 'file_read',
    name: 'File Read',
    description: 'Read governed file contents from the workspace.',
    category: 'file',
    icon: '📄',
    parameters: [
      { name: 'path', type: 'string', description: 'Relative file path' },
    ],
  },
  {
    id: 'file_write',
    name: 'File Write',
    description: 'Write content to a governed file target.',
    category: 'file',
    icon: '✍️',
    parameters: [
      { name: 'path', type: 'string', description: 'Relative file path' },
      { name: 'content', type: 'string', description: 'File content' },
    ],
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Evaluate math expressions.',
    category: 'utility',
    icon: '🔢',
    parameters: [
      { name: 'expression', type: 'string', description: 'Math expression' },
    ],
  },
  {
    id: 'datetime',
    name: 'Date & Time',
    description: 'Return current date/time values.',
    category: 'utility',
    icon: '📅',
    parameters: [
      { name: 'format', type: 'string', description: 'Output format' },
      { name: 'timezone', type: 'string', description: 'IANA timezone' },
    ],
  },
  {
    id: 'json_parse',
    name: 'JSON Parser',
    description: 'Parse JSON and optionally extract a path.',
    category: 'utility',
    icon: '📋',
    parameters: [
      { name: 'input', type: 'string', description: 'JSON string to parse' },
      { name: 'path', type: 'string', description: 'Optional JSON path' },
    ],
  },
  {
    id: 'url_fetch',
    name: 'URL Fetch',
    description: 'Fetch data from an allowed external URL.',
    category: 'web',
    icon: '🌐',
    parameters: [
      { name: 'url', type: 'string', description: 'URL to fetch' },
      { name: 'method', type: 'string', description: 'HTTP method' },
    ],
  },
  {
    id: 'governance_check',
    name: 'Governance Check',
    description: 'Run a lightweight governance decision simulation.',
    category: 'utility',
    icon: '🛡️',
    parameters: [
      { name: 'phase', type: 'string', description: 'Target phase' },
      { name: 'riskLevel', type: 'string', description: 'Target risk level' },
      { name: 'action', type: 'string', description: 'Planned action' },
    ],
  },
];

export async function getToolInventory(): Promise<ToolInventoryEntry[]> {
  const policyMap = await getAllToolPolicies();

  return TOOL_REGISTRY_CATALOG.map(tool => {
    const policy = policyMap.get(tool.id);
    return {
      ...tool,
      allowedRoles: policy?.allowedRoles ?? (TOOL_ROLE_MATRIX[tool.category] ?? ['owner', 'admin']),
      policySource: policy ? 'custom' : 'default',
      policyUpdatedAt: policy?.setAt ?? null,
    };
  });
}
