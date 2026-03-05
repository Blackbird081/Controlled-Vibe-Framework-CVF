export class ContractEnforcer {

  static validateInput(skill: any, input: any): boolean {

    const schema = skill.contract?.input_schema;
    if (!schema) return false;

    for (const key of Object.keys(schema)) {
      if (!(key in input)) return false;
    }

    return true;
  }

  static validateOutput(skill: any, output: any): boolean {

    const schema = skill.contract?.output_schema;
    if (!schema) return false;

    for (const key of Object.keys(schema)) {
      if (!(key in output)) return false;
    }

    return true;
  }
}