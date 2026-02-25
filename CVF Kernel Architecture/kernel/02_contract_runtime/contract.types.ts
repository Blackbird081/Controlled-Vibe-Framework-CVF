// contract.types.ts

export type OutputFormat =
  | "text"
  | "json"
  | "markdown"
  | "structured"

export interface IOContract {
  contract_id: string
  domain_id: string
  expected_output_format: OutputFormat
  max_tokens: number
  allow_external_links: boolean
  allow_code_blocks: boolean
  strict_schema?: object
}