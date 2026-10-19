/** Test/probe-only synthetic fixtures for the private profile. Operates solely on directories this
 * module created under the OS temp root; it never touches an operator root or account configuration.
 */
import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { hardenPrivate } from './intent-spec-private-profile';

export const FIXTURE_PREFIX = 'nis-t1b-d-';
export type Adversary = 'EXTRA_ALLOW' | 'DENY' | 'INHERITED' | 'WRONG_OWNER';
const POWERSHELL = () => path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');

function powershell(script: string, target: string): Promise<void> {
    return new Promise((resolve, reject) => execFile(POWERSHELL(), ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], {
        env: { ...process.env, CVF_NIS_TARGET: target }, windowsHide: true, timeout: 20000, shell: false,
    }, (error, _stdout, stderr) => error ? reject(new Error(`FIXTURE_SECURITY_FAILED: ${String(stderr).trim().split(/\r?\n/)[0] ?? ''}`)) : resolve()));
}

const rule = (sid: string, rights: string, type: string) => `$acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule((New-Object Security.Principal.SecurityIdentifier('${sid}')),'${rights}','ContainerInherit,ObjectInherit','None','${type}')))`;
const ADVERSARY_SCRIPT: Record<Adversary, string> = {
    EXTRA_ALLOW: `$item=Get-Item -LiteralPath $env:CVF_NIS_TARGET -Force; $acl=$item.GetAccessControl('Access'); ${rule('S-1-5-32-545', 'ReadAndExecute', 'Allow')}; $item.SetAccessControl($acl)`,
    DENY: `$item=Get-Item -LiteralPath $env:CVF_NIS_TARGET -Force; $acl=$item.GetAccessControl('Access'); ${rule('S-1-5-32-546', 'Write', 'Deny')}; $item.SetAccessControl($acl)`,
    INHERITED: `$item=Get-Item -LiteralPath $env:CVF_NIS_TARGET -Force; $acl=$item.GetAccessControl('Access'); $acl.SetAccessRuleProtection($false,$false); $item.SetAccessControl($acl)`,
    WRONG_OWNER: `$item=Get-Item -LiteralPath $env:CVF_NIS_TARGET -Force; $acl=$item.GetAccessControl('Owner'); $acl.SetOwner((New-Object Security.Principal.SecurityIdentifier('S-1-5-32-544'))); $item.SetAccessControl($acl)`,
};

/** Throws FIXTURE_SECURITY_FAILED when the host/token cannot create that adversary (WRONG_OWNER needs ownership privilege). */
export async function applyAdversary(directory: string, kind: Adversary): Promise<void> {
    assertFixture(directory);
    await powershell(ADVERSARY_SCRIPT[kind], directory);
}

export function assertFixture(target: string): void {
    const relative = path.relative(path.resolve(os.tmpdir()), path.resolve(target));
    const first = relative.split(path.sep)[0] ?? '';
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || !first.startsWith(FIXTURE_PREFIX)) {
        throw new Error('UNSAFE_FIXTURE_PATH');
    }
}

/** A real private synthetic root: created here, then restricted through the production hardening path. */
export async function makePrivateRoot(label = 'root'): Promise<string> {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), `${FIXTURE_PREFIX}${label}-`));
    await hardenPrivate(root);
    return root;
}

export async function removeFixture(root: string): Promise<void> {
    assertFixture(root);
    await fs.rm(root, { recursive: true, force: true });
}
