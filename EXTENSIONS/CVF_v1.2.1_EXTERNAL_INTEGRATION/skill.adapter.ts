import { CVFSkillDraft, RawSource } from "./models/cvf-skill.draft";
import { ExternalSkillRaw, RawContentFormat } from "./models/external-skill.raw";

function toRawSource(source: ExternalSkillRaw["source"]): RawSource {
  switch (source) {
    case "skills.sh":
    case "partner_registry":
    case "manual_upload":
      return source;
    default:
      return "unknown";
  }
}

function toOriginalFormat(format: RawContentFormat): CVFSkillDraft["original_format"] {
  if (format === "markdown" || format === "json" || format === "yaml") {
    return format;
  }
  return "repo_url";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class SkillAdapter {
  static async transform(raw: ExternalSkillRaw): Promise<CVFSkillDraft> {
    const title =
      typeof raw.external_metadata?.title === "string"
        ? raw.external_metadata.title
        : `External skill (${raw.source})`;

    const now = new Date().toISOString();
    const slug = slugify(title || `ext-${Date.now()}`);

    return {
      skill_id: `ext_${Date.now()}`,
      slug,
      title,
      description:
        typeof raw.external_metadata?.description === "string"
          ? raw.external_metadata.description
          : undefined,
      source: toRawSource(raw.source),
      original_format: toOriginalFormat(raw.format),
      raw_content_hash: raw.raw_content_hash,
      logic: {
        procedural_steps: raw.raw_content,
      },
      governance: {},
      status: "draft",
      created_at: now,
      updated_at: now,
    };
  }
}
