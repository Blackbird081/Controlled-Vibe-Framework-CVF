/** Server-only WINDOWS_SINGLE_HOST_PRIVATE_V1 profile: measures and hardens real NTFS security state.
 * Disabled unless CVF_INTENT_SPEC_STORE_PROFILE and CVF_INTENT_SPEC_STORE_ROOT are both supplied.
 * Trusted single host only: this does not claim durability, power-loss safety or build authority.
 * Unsupported platforms and unreadable security state fail closed; mode bits are never used as ACLs.
 */
import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import path from 'node:path';

export const PRIVATE_PROFILE_ID = 'WINDOWS_SINGLE_HOST_PRIVATE_V1';
const SYSTEM_SID = 'S-1-5-18';
const ADMINISTRATORS_SID = 'S-1-5-32-544';
const POWERSHELL = () => path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
const SID = /^S-1-\d+(-\d+)+$/;

export interface AceTuple {
    readonly sid: string; readonly rights: number; readonly accessType: string;
    readonly isInherited: boolean; readonly inheritanceFlags: string; readonly propagationFlags: string;
}
export interface SecurityTuple {
    readonly ownerSid: string;
    readonly protectionState: 'PROTECTED' | 'UNPROTECTED';
    readonly inheritanceState: 'HAS_INHERITED_ACES' | 'NO_INHERITED_ACES';
    readonly aces: readonly AceTuple[];
}
export interface MeasuredSecurity { readonly currentSid: string; readonly tuple: SecurityTuple; readonly isReparsePoint: boolean; readonly accessSddl: string }

export type ProfileFailure = 'PROFILE_DISABLED' | 'PROFILE_UNSUPPORTED_PLATFORM' | 'PROFILE_ROOT_INVALID'
    | 'PROFILE_ROOT_INSECURE' | 'PROFILE_MEASUREMENT_FAILED' | 'PROFILE_HARDENING_FAILED' | 'PROFILE_RESTORATION_FAILED';
export class ProfileError extends Error { constructor(readonly code: ProfileFailure) { super(code); } }

const MEASURE = `$ErrorActionPreference='Stop'
$p=$env:CVF_NIS_TARGET
$item=Get-Item -LiteralPath $p -Force
$acl=Get-Acl -LiteralPath $p
$sid=[Security.Principal.SecurityIdentifier]
$aces=@(); foreach($r in $acl.GetAccessRules($true,$true,$sid)){ $aces+=[ordered]@{sid=$r.IdentityReference.Value;rights=[int]$r.FileSystemRights;accessType=[string]$r.AccessControlType;isInherited=[bool]$r.IsInherited;inheritanceFlags=[string]$r.InheritanceFlags;propagationFlags=[string]$r.PropagationFlags} }
[ordered]@{currentSid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value;ownerSid=$acl.GetOwner($sid).Value;protectionState=$(if($acl.AreAccessRulesProtected){'PROTECTED'}else{'UNPROTECTED'});accessSddl=$acl.GetSecurityDescriptorSddlForm('Access');isReparsePoint=[bool]($item.Attributes -band [IO.FileAttributes]::ReparsePoint);aces=$aces}|ConvertTo-Json -Depth 5 -Compress`;

const HARDEN = `$ErrorActionPreference='Stop'
$p=$env:CVF_NIS_TARGET
$sid=[Security.Principal.SecurityIdentifier]
$cur=[Security.Principal.WindowsIdentity]::GetCurrent().User
if((Get-Acl -LiteralPath $p).GetOwner($sid).Value -ne $cur.Value){ throw 'WRONG_OWNER' }
$item=Get-Item -LiteralPath $p -Force
$acl=$item.GetAccessControl('Access')
$acl.SetAccessRuleProtection($true,$false)
foreach($r in @($acl.GetAccessRules($true,$false,$sid))){ [void]$acl.RemoveAccessRuleSpecific($r) }
$fs=[Security.AccessControl.FileSystemRights]::FullControl
$ci=[Security.AccessControl.InheritanceFlags]'ContainerInherit,ObjectInherit'
$none=[Security.AccessControl.PropagationFlags]::None
$allow=[Security.AccessControl.AccessControlType]::Allow
foreach($s in @($cur,(New-Object Security.Principal.SecurityIdentifier('${SYSTEM_SID}')))){ $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($s,$fs,$ci,$none,$allow))) }
$item.SetAccessControl($acl)`;

const RESTORE = `$ErrorActionPreference='Stop'
$p=$env:CVF_NIS_TARGET
$item=Get-Item -LiteralPath $p -Force
$acl=$item.GetAccessControl('Access')
$acl.SetSecurityDescriptorSddlForm($env:CVF_NIS_SDDL,'Access')
$item.SetAccessControl($acl)`;

function powershell(script: string, env: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
        // Drop every case variant: Windows/Vitest may expose PSMODULEPATH while a parent uses PSModulePath.
        // Only the child uses the selected Windows PowerShell executable's bundled Desktop modules.
        const inheritedEnv: NodeJS.ProcessEnv = { ...process.env };
        for (const key of Object.keys(inheritedEnv)) {
            if (key.toUpperCase() === 'PSMODULEPATH') delete inheritedEnv[key];
        }
        execFile(POWERSHELL(), ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], {
            env: { ...inheritedEnv, ...env, PSModulePath: path.join(path.dirname(POWERSHELL()), 'Modules') }, windowsHide: true, timeout: 20000, maxBuffer: 1024 * 1024, shell: false,
        }, (error, stdout) => error ? reject(new Error('SECURITY_OPERATION_FAILED')) : resolve(stdout));
    });
}
const requireWindows = () => { if (process.platform !== 'win32') throw new ProfileError('PROFILE_UNSUPPORTED_PLATFORM'); };

/** Semantic ACL tuple with complete ACE tuples in a deterministic order. */
export async function measureSecurity(target: string): Promise<MeasuredSecurity> {
    requireWindows();
    try {
        const raw = JSON.parse(await powershell(MEASURE, { CVF_NIS_TARGET: target }));
        const aces: AceTuple[] = (Array.isArray(raw.aces) ? raw.aces : raw.aces ? [raw.aces] : []).map((ace: AceTuple) => ({
            sid: ace.sid, rights: ace.rights, accessType: ace.accessType, isInherited: ace.isInherited,
            inheritanceFlags: ace.inheritanceFlags, propagationFlags: ace.propagationFlags,
        }));
        aces.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        if (!SID.test(raw.currentSid) || !SID.test(raw.ownerSid) || aces.some(ace => !SID.test(ace.sid))) throw new Error('UNRESOLVED_SID');
        const tuple: SecurityTuple = {
            ownerSid: raw.ownerSid, protectionState: raw.protectionState,
            inheritanceState: aces.some(ace => ace.isInherited) ? 'HAS_INHERITED_ACES' : 'NO_INHERITED_ACES', aces,
        };
        return { currentSid: raw.currentSid, tuple, isReparsePoint: raw.isReparsePoint === true, accessSddl: String(raw.accessSddl) };
    } catch { throw new ProfileError('PROFILE_MEASUREMENT_FAILED'); }
}

/** A private object is owned by this process identity, blocks inheritance and grants only trusted principals. */
export function isPrivateSecurity(measured: MeasuredSecurity): boolean {
    const { tuple, currentSid } = measured;
    const trusted = new Set([currentSid, SYSTEM_SID, ADMINISTRATORS_SID]);
    return !measured.isReparsePoint && tuple.ownerSid === currentSid && tuple.protectionState === 'PROTECTED'
        && tuple.inheritanceState === 'NO_INHERITED_ACES' && tuple.aces.length > 0
        && tuple.aces.every(ace => ace.accessType === 'Allow' && trusted.has(ace.sid));
}

/** Probe/test instrumentation only; production callers never supply it. */
export interface HardenInstrumentation {
    /** Runs after the real mutation, so a throw reproduces an ambiguous failure before the rollback handle is returned. */
    readonly afterMutation?: () => void | Promise<void>;
    /** Runs before an in-function restoration attempt, so a throw reproduces a failed restoration. */
    readonly beforeRestore?: () => void | Promise<void>;
}

/** Restricts an existing object to this identity plus SYSTEM; returns an exact DACL rollback. A wrong owner is refused.
 * The caller only receives a rollback after hardening succeeded, so any failure once the mutation may have started
 * (including a timeout whose effect is unknown) restores the measured pre-state here and verifies it. Failing to
 * verify that restoration is reported as PROFILE_RESTORATION_FAILED, never as a plain hardening failure.
 */
export async function hardenPrivate(target: string, instrumentation: HardenInstrumentation = {}): Promise<() => Promise<void>> {
    const before = await measureSecurity(target);
    if (before.tuple.ownerSid !== before.currentSid) throw new ProfileError('PROFILE_ROOT_INSECURE');
    const restore = () => powershell(RESTORE, { CVF_NIS_TARGET: target, CVF_NIS_SDDL: before.accessSddl }).then(() => undefined);
    try {
        await powershell(HARDEN, { CVF_NIS_TARGET: target });
        await instrumentation.afterMutation?.();
    } catch {
        try {
            await instrumentation.beforeRestore?.();
            await restore();
            const after = await measureSecurity(target);
            if (JSON.stringify(after.tuple) !== JSON.stringify(before.tuple)) throw new Error('RESTORATION_MISMATCH');
        } catch { throw new ProfileError('PROFILE_RESTORATION_FAILED'); }
        throw new ProfileError('PROFILE_HARDENING_FAILED');
    }
    return restore;
}

export interface PrivateProfileSecurity {
    readonly profile: typeof PRIVATE_PROFILE_ID;
    isPrivate(target: string): Promise<boolean>;
    harden(target: string): Promise<() => Promise<void>>;
}
export const windowsPrivateSecurity: PrivateProfileSecurity = Object.freeze({
    profile: PRIVATE_PROFILE_ID,
    isPrivate: async (target: string) => isPrivateSecurity(await measureSecurity(target)),
    harden: hardenPrivate,
});

/** Complete explicit configuration or no store; unsafe or unsupported state refuses instead of falling back. */
export async function admitPrivateStoreProfile(env: NodeJS.ProcessEnv = process.env):
    Promise<Readonly<{ profile: typeof PRIVATE_PROFILE_ID; root: string; security: PrivateProfileSecurity }>> {
    const root = env.CVF_INTENT_SPEC_STORE_ROOT;
    if (env.CVF_INTENT_SPEC_STORE_PROFILE !== PRIVATE_PROFILE_ID || !root) throw new ProfileError('PROFILE_DISABLED');
    requireWindows();
    if (!path.win32.isAbsolute(root) || root.startsWith('\\\\') || /[\0*?"<>|]/.test(root) || !path.win32.parse(root).root.match(/^[A-Za-z]:\\$/)
        || path.resolve(root) === path.parse(root).root) throw new ProfileError('PROFILE_ROOT_INVALID');
    const resolved = path.resolve(root);
    try {
        const stat = await fs.lstat(resolved);
        if (!stat.isDirectory() || stat.isSymbolicLink() || path.relative(await fs.realpath(resolved), resolved) !== '') {
            throw new ProfileError('PROFILE_ROOT_INVALID');
        }
    } catch (error) { throw error instanceof ProfileError ? error : new ProfileError('PROFILE_ROOT_INVALID'); }
    if (!await windowsPrivateSecurity.isPrivate(resolved)) throw new ProfileError('PROFILE_ROOT_INSECURE');
    return Object.freeze({ profile: PRIVATE_PROFILE_ID, root: resolved, security: windowsPrivateSecurity });
}
