import fetch from "node-fetch";

export interface ExternalSkillPackage {
  id: string;
  source: string;
  raw: any;
}

export class SkillsShAdapter {

  static async fetchSkill(url: string): Promise<ExternalSkillPackage | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = (await response.json()) as Record<string, unknown>;

      return {
        id: typeof data.id === "string" ? data.id : "",
        source: "skills.sh",
        raw: data
      };
    } catch {
      return null;
    }
  }
}
