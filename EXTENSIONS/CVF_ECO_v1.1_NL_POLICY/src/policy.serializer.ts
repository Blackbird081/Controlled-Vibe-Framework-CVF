import { PolicyDocument, SerializedPolicy, SerializedRule } from "./types";

const SCHEMA_VERSION = "cvf-policy-v1";

export class PolicySerializer {
  serialize(policy: PolicyDocument): SerializedPolicy {
    return {
      schema: SCHEMA_VERSION,
      version: policy.version,
      governance_rules: policy.rules.map((rule) => this.serializeRule(rule)),
      metadata: {
        id: policy.id,
        name: policy.name,
        status: policy.status,
        created_at: new Date(policy.createdAt).toISOString(),
        updated_at: new Date(policy.updatedAt).toISOString(),
        source_vibes: policy.sourceVibes,
        author: policy.metadata.author,
        template_id: policy.metadata.templateId ?? null,
        tags: policy.metadata.tags,
        scope: policy.metadata.scope,
      },
    };
  }

  serializeToJSON(policy: PolicyDocument, pretty = true): string {
    const serialized = this.serialize(policy);
    return pretty ? JSON.stringify(serialized, null, 2) : JSON.stringify(serialized);
  }

  deserialize(data: SerializedPolicy): PolicyDocument {
    if (data.schema !== SCHEMA_VERSION) {
      throw new Error(`Unsupported schema: ${data.schema} (expected ${SCHEMA_VERSION})`);
    }

    const meta = data.metadata as Record<string, unknown>;
    const now = Date.now();

    return {
      id: (meta.id as string) ?? "unknown",
      name: (meta.name as string) ?? "Imported Policy",
      version: data.version,
      status: (meta.status as PolicyDocument["status"]) ?? "draft",
      createdAt: meta.created_at ? new Date(meta.created_at as string).getTime() : now,
      updatedAt: meta.updated_at ? new Date(meta.updated_at as string).getTime() : now,
      sourceVibes: (meta.source_vibes as string[]) ?? [],
      rules: data.governance_rules.map((rule, i) => ({
        id: `IMPORT-${String(i + 1).padStart(4, "0")}`,
        intentDomain: rule.intent_domain as PolicyDocument["rules"][0]["intentDomain"],
        actionTrigger: rule.action_trigger,
        constraints: rule.constraints,
        enforcement: rule.enforcement as PolicyDocument["rules"][0]["enforcement"],
        description: `Imported rule for ${rule.action_trigger}`,
      })),
      metadata: {
        author: (meta.author as string) ?? "import",
        templateId: (meta.template_id as string) ?? undefined,
        tags: (meta.tags as string[]) ?? [],
        scope: (meta.scope as PolicyDocument["metadata"]["scope"]) ?? "global",
      },
    };
  }

  deserializeFromJSON(json: string): PolicyDocument {
    const data = JSON.parse(json) as SerializedPolicy;
    return this.deserialize(data);
  }

  private serializeRule(rule: PolicyDocument["rules"][0]): SerializedRule {
    return {
      intent_domain: rule.intentDomain,
      action_trigger: rule.actionTrigger,
      constraints: rule.constraints,
      enforcement: rule.enforcement,
    };
  }
}
