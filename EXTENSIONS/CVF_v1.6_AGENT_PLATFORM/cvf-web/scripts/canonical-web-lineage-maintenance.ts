/**
 * Explicit, operator-run maintenance command for the Web attempt lineage journal. Thin entry point: it parses arguments, calls
 * src/lib/server/canonical-web-lineage-maintenance.ts, prints one JSON report and sets the exit code. No daemon, timer or
 * automatic recovery: one bounded pass per invocation.
 *
 * Usage (from the cvf-web package root; a TypeScript runner such as `npx tsx` is required):
 *   canonical-web-lineage-maintenance.ts init      --directory <abs> [--config <file>]
 *   canonical-web-lineage-maintenance.ts archive   --directory <abs> [--config <file>] [--now <ISO>] [--tenant <id>] [--max <1..10>]
 *   canonical-web-lineage-maintenance.ts export    --directory <abs> --destination <abs existing dir> [--config <file>] [--now <ISO>] [--tenant <id>] [--max <1..10>]
 *   canonical-web-lineage-maintenance.ts reconcile --directory <abs> [--config <file>] [--now <ISO>] [--tenant <id>]
 *   canonical-web-lineage-maintenance.ts retire-released --directory <abs> [--config <file>] [--now <ISO>] [--tenant <id>] [--max <1..10>] [--mode dry-run|apply]
 * The configuration is the JSON of CVF_WEB_LINEAGE_CONFIG_JSON, read from --config <file> or from that environment variable;
 * --directory must equal its "directory". Output is one JSON report on stdout.
 * Exit code: 0 completed (and consistent for reconcile), 2 stopped / needs reconciliation / inconsistent, 1 refused or usage error.
 *
 * retire-released moves released request records (owner release marker, released >= 1 h ago) into the archive and resets the release
 * count of owners that no longer hold one; --mode defaults to dry-run (reads only), --mode apply writes. It has the same platform gate
 * as archive and export.
 *
 * SUPPORTED PLATFORM: init and reconcile run on Linux, Docker and native Windows. On native Windows archive, export and retire-released refuse with
 * reason PLATFORM_UNSUPPORTED (exit 1) before reading configuration or touching the journal; run them from Linux/Docker against the
 * same journal directory. An unsupported host prints the operator line to stderr. Stdout stays the single JSON report.
 */
import { lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { LINEAGE_CONFIG_ENV, parseLineageConfig } from '../src/lib/server/canonical-web-lineage';
import {
  MAINTENANCE_MAX_BATCH,
  archiveLineage,
  exportLineage,
  initializeLineage,
  archiveExportPlatformCapability,
  reconcileLineage,
  type MaintenanceOperation,
  type MaintenanceReportBase,
} from '../src/lib/server/canonical-web-lineage-maintenance';
import { retireReleasedLineage } from '../src/lib/server/canonical-web-lineage-maintenance-released';

export type MaintenanceArgs = {
  command: MaintenanceOperation;
  directory: string;
  configFile?: string;
  now?: number;
  destination?: string;
  tenantId?: string;
  maxEnvelopes?: number;
  mode?: 'dry-run' | 'apply';
};
export type MaintenanceCommandResult = { exitCode: 0 | 1 | 2; output: Record<string, unknown> };

const FLAGS = ['--directory', '--config', '--now', '--destination', '--tenant', '--max', '--mode'];
const COMMANDS = ['init', 'archive', 'export', 'reconcile', 'retire-released'];
const TENANT_ID_RE = /^[a-zA-Z0-9._-]{1,64}$/;
const CONFIG_FILE_MAX_BYTES = 8192;

/** Strict argument parse: one command, known flags only, each given at most once with a value. Never throws. */
export function parseMaintenanceArgs(argv: string[]): { ok: true; args: MaintenanceArgs } | { ok: false; reason: string } {
  const bad = (reason: string) => ({ ok: false as const, reason });
  if (!Array.isArray(argv) || argv.length < 1) return bad('USAGE_COMMAND_REQUIRED');
  const command = argv[0];
  if (!COMMANDS.includes(command)) return bad('USAGE_COMMAND_UNKNOWN');
  const values = new Map<string, string>();
  for (let index = 1; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!FLAGS.includes(flag)) return bad('USAGE_FLAG_UNKNOWN');
    if (typeof value !== 'string' || value === '' || FLAGS.includes(value)) return bad('USAGE_FLAG_VALUE_MISSING');
    if (values.has(flag)) return bad('USAGE_FLAG_DUPLICATE');
    values.set(flag, value);
  }
  const directory = values.get('--directory');
  if (!directory) return bad('USAGE_DIRECTORY_REQUIRED');
  const nowText = values.get('--now');
  const now = nowText === undefined ? undefined : Date.parse(nowText);
  if (now !== undefined && (!Number.isFinite(now) || new Date(now).toISOString() !== nowText)) return bad('USAGE_NOW_INVALID');
  const maxText = values.get('--max');
  const maxEnvelopes = maxText === undefined ? undefined : Number(maxText);
  if (maxEnvelopes !== undefined && (!Number.isSafeInteger(maxEnvelopes) || maxEnvelopes < 1 || maxEnvelopes > MAINTENANCE_MAX_BATCH)) return bad('USAGE_MAX_INVALID');
  const tenantId = values.get('--tenant');
  if (tenantId !== undefined && !TENANT_ID_RE.test(tenantId)) return bad('USAGE_TENANT_INVALID');
  const destination = values.get('--destination');
  if (destination !== undefined && command !== 'export') return bad('USAGE_DESTINATION_ONLY_FOR_EXPORT');
  const modeText = values.get('--mode');
  if (modeText !== undefined && command !== 'retire-released') return bad('USAGE_MODE_ONLY_FOR_RETIRE_RELEASED');
  if (modeText !== undefined && modeText !== 'dry-run' && modeText !== 'apply') return bad('USAGE_MODE_INVALID');
  return { ok: true, args: { command: command as MaintenanceOperation, directory, configFile: values.get('--config'), now, destination, tenantId, maxEnvelopes, mode: modeText } };
}

function refused(operation: string, reason: string): MaintenanceCommandResult {
  return { exitCode: 1, output: { operation, status: 'REFUSED', reason, requiresReconciliation: false } };
}
function sameDirectory(left: string, right: string): boolean {
  const normalize = (value: string) => (process.platform === 'win32' ? path.resolve(value).toLowerCase() : path.resolve(value));
  return path.isAbsolute(left) && normalize(left) === normalize(right);
}
/** Bounded read of a regular, non-symlink configuration file; undefined when unreadable. */
function readConfigFile(file: string): string | undefined {
  try {
    const info = lstatSync(file);
    if (!info.isFile() || info.isSymbolicLink() || info.size > CONFIG_FILE_MAX_BYTES) return undefined;
    return readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
}

/**
 * Runs one maintenance command. Requires an explicit --directory that equals the configured directory, a configuration
 * (--config <file> or the environment variable) and, for export, --destination (checked by the export operation itself).
 */
export function runMaintenanceCommand(argv: string[], env: Record<string, string | undefined> = process.env): MaintenanceCommandResult {
  const parsed = parseMaintenanceArgs(argv);
  if (!parsed.ok) return refused('usage', parsed.reason);
  const { args } = parsed;
  if (args.command === 'archive' || args.command === 'export' || args.command === 'retire-released') {
    const capability = archiveExportPlatformCapability();
    if (!capability.supported) return refused(args.command, capability.reason);
  }
  const rawConfig = args.configFile === undefined ? env[LINEAGE_CONFIG_ENV] : readConfigFile(path.resolve(args.configFile));
  if (args.configFile !== undefined && rawConfig === undefined) return refused(args.command, 'CONFIG_FILE_UNREADABLE');
  const loaded = parseLineageConfig(rawConfig);
  if (!loaded.ok) return refused(args.command, loaded.reason);
  const config = loaded.config;
  if (!sameDirectory(args.directory, config.directory)) return refused(args.command, 'DIRECTORY_MISMATCH');
  const { now, tenantId, maxEnvelopes, destination } = args;
  let report: MaintenanceReportBase & { consistent?: boolean };
  switch (args.command) {
    case 'init': report = initializeLineage(config); break;
    case 'archive': report = archiveLineage(config, { now, tenantId, maxEnvelopes }); break;
    case 'export': report = exportLineage(config, { destination, now, tenantId, maxEnvelopes }); break;
    case 'retire-released': report = retireReleasedLineage(config, { now, tenantId, maxEnvelopes, apply: args.mode === 'apply' }); break;
    default: report = reconcileLineage(config, { now, tenantId });
  }
  const needsAttention = report.status === 'STOPPED' || report.requiresReconciliation || report.consistent === false;
  return { exitCode: report.status === 'REFUSED' ? 1 : needsAttention ? 2 : 0, output: report as unknown as Record<string, unknown> };
}

// Runs only when executed as the entry script, never when imported (tests, other tools).
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  // Startup readiness line: printed only for archive, export or retire-released, the only commands this host refuses.
  const capability = archiveExportPlatformCapability();
  const requested = process.argv[2];
  if (!capability.supported && (requested === 'archive' || requested === 'export' || requested === 'retire-released')) process.stderr.write(`${capability.message}\n`);
  const result = runMaintenanceCommand(process.argv.slice(2), process.env);
  process.stdout.write(`${JSON.stringify(result.output)}\n`);
  process.exitCode = result.exitCode;
}
