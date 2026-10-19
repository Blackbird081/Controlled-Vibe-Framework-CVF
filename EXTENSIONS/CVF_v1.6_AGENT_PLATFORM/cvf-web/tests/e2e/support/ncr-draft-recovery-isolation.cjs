'use strict';
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');

const logPath = process.env.CVF_NCR_ISOLATION_LOG;
const runRoot = process.env.CVF_NCR_RUN_ROOT;
if (!logPath || !runRoot || !path.isAbsolute(logPath) || !path.isAbsolute(runRoot)
  || !path.resolve(logPath).startsWith(path.resolve(runRoot) + path.sep)) throw new Error('ISOLATION_ROOT_REQUIRED');
const log = (event, detail = {}) => fs.appendFileSync(logPath, JSON.stringify({ event, pid: process.pid, ...detail }) + '\n');
const local = host => ['localhost', '127.0.0.1', '::1', '[::1]'].includes(String(host).toLowerCase());
const denied = (kind, target) => { log('BLOCKED', { kind, target: String(target).slice(0, 100) }); throw new Error(`NCR_${kind}_BLOCKED`); };

const envName = value => typeof value === 'string' && /^\.env(?:\..*)?$/.test(path.basename(value));
for (const method of ['statSync', 'lstatSync', 'readFileSync', 'openSync', 'existsSync']) {
  const original = fs[method];
  fs[method] = function(file, ...args) {
    if (envName(file)) {
      log('ENV_READ_BLOCKED', { method });
      if (method === 'existsSync') return false;
      const error = new Error('NCR_PRIVATE_ENV_BLOCKED'); error.code = 'ENOENT'; throw error;
    }
    return original.call(this, file, ...args);
  };
}
for (const method of ['readFile', 'stat', 'open']) {
  const original = fs.promises[method];
  fs.promises[method] = async function(file, ...args) {
    if (envName(file)) denied('PRIVATE_ENV', method);
    return original.call(this, file, ...args);
  };
}
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(...args) {
  const arg = Array.isArray(args[0]) ? args[0][0] : args[0];
  const host = typeof arg === 'object' ? (arg.host || arg.hostname || 'localhost') : typeof args[1] === 'string' ? args[1] : 'localhost';
  if (typeof arg === 'string' || !local(host)) denied('NETWORK', host);
  return originalConnect.apply(this, args);
};
for (const protocol of [http, https]) {
  const original = protocol.request;
  protocol.request = function(...args) {
    const arg = args[0];
    const host = typeof arg === 'string' || arg instanceof URL ? new URL(arg).hostname : (arg.hostname || arg.host || 'localhost');
    if (!local(String(host).split(':')[0])) denied('NETWORK', host);
    return original.apply(this, args);
  };
}
const originalFetch = globalThis.fetch;
globalThis.fetch = function(resource, ...args) {
  const host = new URL(typeof resource === 'string' ? resource : resource.url).hostname;
  if (!local(host)) denied('NETWORK', host);
  return originalFetch.call(this, resource, ...args);
};
const originalEmit = http.Server.prototype.emit;
http.Server.prototype.emit = function(event, ...args) {
  if (event === 'request' && args[0]?.url) {
    const pathname = new URL(args[0].url, 'http://localhost').pathname;
    if (pathname === '/api/governance/evaluate' || pathname === '/api/execute') {
      log('EVALUATE_DISPATCH_BLOCKED', { pathname });
      args[1].writeHead(403); args[1].end(); return true;
    }
  }
  return originalEmit.call(this, event, ...args);
};
log('PRELOAD_ACTIVE', { envProcessed: process.env.__NEXT_PROCESSED_ENV === 'true', nextauthEmpty: process.env.NEXTAUTH_URL === '' });
