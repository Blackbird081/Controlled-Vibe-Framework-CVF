// financial.validation.rules.ts
// Validation rules specific to financial AI outputs

export interface FinancialOutputValidationContext {
  containsRecommendation: boolean
  includesForwardLookingStatement: boolean
  citesDataSource: boolean
  includesDisclaimer: boolean
}

class FinancialValidationEngine {

  validate(context: FinancialOutputValidationContext): void {

    if (context.containsRecommendation && !context.includesDisclaimer) {
      throw new Error(
        "Investment recommendation must include disclaimer."
      )
    }

    if (context.includesForwardLookingStatement && !context.citesDataSource) {
      throw new Error(
        "Forward-looking statements must cite data source."
      )
    }
  }
}

export const financialValidationEngine = new FinancialValidationEngine()
