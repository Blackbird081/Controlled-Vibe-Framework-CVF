import fs from "fs";
import path from "path";
import { CVFSkillCertified } from "./models/cvf-skill.certified";

export class SkillPublisher {

  static persist(skill: CVFSkillCertified) {

    const basePath = path.join(
      process.cwd(),
      "skills",
      "external",
      skill.title.toLowerCase().replace(/\s+/g, "-")
    );

    fs.mkdirSync(basePath, { recursive: true });

    fs.writeFileSync(
      path.join(basePath, "skill.meta.json"),
      JSON.stringify(skill.meta, null, 2)
    );

    fs.writeFileSync(
      path.join(basePath, "skill.logic.md"),
      skill.logic
    );

    fs.writeFileSync(
      path.join(basePath, "risk.report.json"),
      JSON.stringify(skill.risk_report, null, 2)
    );

    fs.writeFileSync(
      path.join(basePath, "audit.log"),
      skill.audit_log.join("\n")
    );

  }

}