import { vi } from 'vitest';
import * as net from 'node:net';

// Runs before every product module in this isolated suite. Values are never logged.
const allowed = new Set(['PATH', 'SystemRoot', 'WINDIR', 'COMSPEC', 'PATHEXT', 'USERPROFILE', 'APPDATA',
  'LOCALAPPDATA', 'TEMP', 'TMP', 'TMPDIR', 'CI', 'NODE_ENV', 'CVF_NCR_TEST_ROOT']);
for (const key of Object.keys(process.env)) if (!allowed.has(key)) delete process.env[key];
if (process.env.CVF_NCR_TEST_ROOT) process.env.CVF_NCR_R1_FIXTURE_ROOT = process.env.CVF_NCR_TEST_ROOT;

const denied = () => { throw new Error('NCR_OFFLINE_NETWORK_DENIED'); };
vi.stubGlobal('fetch', denied);
vi.spyOn(net.Socket.prototype, 'connect').mockImplementation(denied as typeof net.Socket.prototype.connect);
