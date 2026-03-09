/**
 * Guard Registry Guard — Track IV Phase A.2
 *
 * Meta-guard: ensures every new guard is properly registered in the system.
 * Blocks creation of guards that aren't registered in README.md and Knowledge Base.
 *
 * Rules:
 *   - Every guard file in 05_OPERATION/ must be registered in README.md
 *   - Every guard must be registered in CVF_CORE_KNOWLEDGE_BASE.md
 *   - Registration must happen in the same commit batch
 *   - This guard maintains a runtime registry for validation
 */

import {
  Guard,
  GuardRequestContext,
  GuardResult,
} from '../guard.runtime.types.js';

export class GuardRegistryGuard implements Guard {
  id = 'guard_registry';
  name = 'Guard Registry Guard';
  description = 'Meta-guard ensuring all guards are registered in README and Knowledge Base.';
  priority = 90;
  enabled = true;

  private registry: Map<string, { readme: boolean; knowledgeBase: boolean }> = new Map();

  registerGuardEntry(guardName: string, locations: { readme?: boolean; knowledgeBase?: boolean }): void {
    const existing = this.registry.get(guardName) ?? { readme: false, knowledgeBase: false };
    this.registry.set(guardName, {
      readme: locations.readme ?? existing.readme,
      knowledgeBase: locations.knowledgeBase ?? existing.knowledgeBase,
    });
  }

  isFullyRegistered(guardName: string): boolean {
    const entry = this.registry.get(guardName);
    return !!entry && entry.readme && entry.knowledgeBase;
  }

  getRegistrySize(): number {
    return this.registry.size;
  }

  getOrphanedGuards(): string[] {
    return Array.from(this.registry.entries())
      .filter(([, v]) => !v.readme || !v.knowledgeBase)
      .map(([k]) => k);
  }

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const targetFiles = context.targetFiles ?? [];

    const guardFiles = targetFiles.filter((f) => {
      const normalized = f.replace(/\\/g, '/');
      return normalized.includes('05_OPERATION/CVF_') && normalized.endsWith('_GUARD.md');
    });

    if (guardFiles.length === 0) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: 'No guard files being created/modified.',
        timestamp,
      };
    }

    if (this.registry.size === 0) {
      return {
        guardId: this.id,
        decision: 'ESCALATE',
        severity: 'WARN',
        reason: `Guard file(s) detected (${guardFiles.join(', ')}) but no registry loaded. Ensure guards are registered in README.md and CVF_CORE_KNOWLEDGE_BASE.md.`,
        timestamp,
        metadata: { guardFiles },
      };
    }

    const unregistered: string[] = [];
    for (const file of guardFiles) {
      const filename = file.replace(/\\/g, '/').split('/').pop() ?? '';
      const guardName = filename.replace('.md', '');
      if (!this.isFullyRegistered(guardName)) {
        unregistered.push(guardName);
      }
    }

    if (unregistered.length > 0) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Guard(s) not fully registered: ${unregistered.join(', ')}. Must be in both README.md and CVF_CORE_KNOWLEDGE_BASE.md.`,
        timestamp,
        metadata: { unregistered, orphaned: this.getOrphanedGuards() },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `All ${guardFiles.length} guard file(s) properly registered.`,
      timestamp,
    };
  }
}
