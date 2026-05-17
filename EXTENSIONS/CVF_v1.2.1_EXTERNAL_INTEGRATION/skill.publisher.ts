import fs from "fs";
import path from "path";
import { CVFSkillCertified } from "./models/cvf-skill.certified";

export class SkillPublisher {
  static persist(skill: CVFSkillCertified) {
    const basePath = path.join(
      process.cwd(),
      "skills",
      "external",
      skill.slug || skill.title.toLowerCase().replace(/\s+/g, "-")
    );

    fs.mkdirSync(basePath, { recursive: true });

    fs.writeFileSync(
      path.join(basePath, "skill.meta.json"),
      JSON.stringify(
        {
          skill_id: skill.skill_id,
          title: skill.title,
          description: skill.description,
          domain: skill.domain,
          phase_binding: skill.phase_binding,
          certification: skill.certification,
          status: skill.status,
        },
        null,
        2
      )
    );

    fs.writeFileSync(path.join(basePath, "skill.logic.md"), skill.procedural_steps);

    fs.writeFileSync(path.join(basePath, "risk.report.json"), JSON.stringify(skill.risk, null, 2));
  }
}
