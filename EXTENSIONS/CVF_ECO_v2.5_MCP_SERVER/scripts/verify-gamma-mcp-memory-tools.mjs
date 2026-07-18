#!/usr/bin/env node
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseTextResult(result) {
  const firstText = result.content?.find((item) => item.type === 'text')?.text;
  assert(typeof firstText === 'string', 'Tool result did not include text content.');
  return JSON.parse(firstText);
}

const client = new Client({
  name: 'cvf-gamma-local-verifier',
  version: '1.0.0',
});

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js'],
  cwd: packageDir,
  stderr: 'pipe',
});

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const names = new Set(tools.tools.map((tool) => tool.name));
  const requiredTools = [
    'cvf_get_session_memory',
    'cvf_get_active_handoff',
    'cvf_get_session_state',
    'cvf_get_startup_acknowledgment',
    'cvf_get_governance_rules',
    'cvf_check_governance_action',
    'cvf_get_mcp_tool_audit_log',
  ];

  for (const toolName of requiredTools) {
    assert(names.has(toolName), `Missing Gamma MCP tool: ${toolName}`);
  }

  const ack = parseTextResult(await client.callTool({
    name: 'cvf_get_startup_acknowledgment',
    arguments: {},
  }));
  assert(ack.acknowledgment?.includes('Startup acknowledged:'), 'Startup acknowledgment missing expected text.');

  const state = parseTextResult(await client.callTool({
    name: 'cvf_get_session_state',
    arguments: { maxChars: 4000 },
  }));
  assert(state.exists === true, 'Session state file was not read.');
  assert(state.content.includes('currentMode'), 'Session state content missing currentMode.');

  const handoff = parseTextResult(await client.callTool({
    name: 'cvf_get_active_handoff',
    arguments: { maxChars: 4000 },
  }));
  assert(handoff.exists === true, 'Active handoff was not read.');

  const rules = parseTextResult(await client.callTool({
    name: 'cvf_get_governance_rules',
    arguments: { topic: 'live_run', maxChars: 3000 },
  }));
  assert(rules.topic === 'live_run', 'Governance rules did not normalize topic.');
  assert(rules.files.some((file) => file.path.includes('LIVE_RUN')), 'Live-run governance file not returned.');

  const check = parseTextResult(await client.callTool({
    name: 'cvf_check_governance_action',
    arguments: { action: 'run live provider API proof' },
  }));
  assert(check.requiredRules.includes('mandatory_live_run_diagnostics'), 'Live action check missing diagnostics rule.');

  const audit = parseTextResult(await client.callTool({
    name: 'cvf_get_mcp_tool_audit_log',
    arguments: { limit: 20 },
  }));
  assert(audit.totalEntries >= 5, 'MCP audit log did not record Gamma tool calls.');

  console.log(JSON.stringify({
    status: 'PASS',
    serverName: client.getServerVersion()?.name,
    toolCount: tools.tools.length,
    requiredTools,
    auditEntries: audit.totalEntries,
    rawSecretPrinted: false,
  }, null, 2));
} finally {
  await client.close();
}
