import { readFileSync } from "fs";
import * as yaml from "js-yaml";

export class SkillValidator {

  static validateSchema(skill: any, schemaPath: string): boolean {
    const schema: any = yaml.load(readFileSync(schemaPath, "utf8"));

    if (!skill.id || !skill.name || !skill.version) return false;

    if (!new RegExp(schema.skill.id.pattern).test(skill.id)) return false;
    if (!new RegExp(schema.skill.version.pattern).test(skill.version)) return false;

    return true;
  }

  static validateIntegrity(skill: any): boolean {
    if (!skill.integrity) return false;
    if (!skill.integrity.checksum) return false;
    return skill.integrity.verified === true;
  }
}