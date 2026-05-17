// external-skill.raw.ts

export type ExternalSkillSource =
  | "skills.sh"
  | "github_repo"
  | "partner_registry"
  | "manual_upload"
  | "api_import"
  | "unknown";

export type RawContentFormat =
  | "markdown"
  | "json"
  | "yaml"
  | "repository"
  | "url"
  | "text";

export interface ExternalSkillRaw {

  // ---- Identity (source-level) ----
  source: ExternalSkillSource;

  source_reference?: string;   // URL, repo link, skill ID external
  source_version?: string;

  // ---- Content ----
  format: RawContentFormat;

  raw_content: string;         // untouched original content
  raw_content_hash: string;    // SHA256 of raw_content

  // ---- Metadata (untrusted) ----
  external_metadata?: Record<string, any>;

  // ---- Intake Context ----
  ingested_at: string;
  ingested_by: string;         // system | admin | auto-crawler

  ingestion_pipeline_version: string;

}