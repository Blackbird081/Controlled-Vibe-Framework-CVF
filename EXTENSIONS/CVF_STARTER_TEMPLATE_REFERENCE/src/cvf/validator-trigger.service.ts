// src/cvf/validator-trigger.service.ts

import { ExecutionContext } from "../core/execution-context";
import { ValidationFailedError } from "../core/error.types";

export interface Validator {
  validate(output: unknown): Promise<boolean>;
}

export class ValidatorTriggerService {
  constructor(private readonly validator: Validator) { }

  async maybeValidate(context: ExecutionContext): Promise<void> {
    if (context.riskLevel === "HIGH") {
      const isValid = await this.validator.validate(context.output);

      if (!isValid) {
        throw new ValidationFailedError(
          "High risk output did not pass validation."
        );
      }

      context.markValidated();
    }
  }
}
