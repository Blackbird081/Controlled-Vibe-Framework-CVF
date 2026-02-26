// contract.schema.ts

export const DefaultNonCoderSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    reasoning_level: { type: "string" }
  },
  required: ["answer"]
}