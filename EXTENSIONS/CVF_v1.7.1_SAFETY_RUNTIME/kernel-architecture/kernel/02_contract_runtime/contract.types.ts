// contract.types.ts

export type OutputFormat =
  | "text"
  | "json"
  | "markdown"
  | "structured"
  | "structured_text"

export type ContractConsumerRole =
  | "user"
  | "assistant"
  | "system"
  | "integration"

export interface IOContract {
  contract_id: string
  domain_id: string
  expected_output_format: OutputFormat
  max_tokens: number
  allow_external_links: boolean
  allow_code_blocks: boolean
  strict_schema?: object
  allowed_consumers?: ContractConsumerRole[]
  allow_transform?: boolean
}

export interface ContractDefinition {
  requiredFields?: string[]
  allowedTypes?: string[]
  outputType?: OutputFormat
  requireDomainMatch?: boolean
}

export interface RuntimeContractRequest {
  ioContract: IOContract
  consumerRole?: ContractConsumerRole
  transformRequested?: boolean
  declaredDomain?: string
}
