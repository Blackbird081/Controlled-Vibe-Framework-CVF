import fetch from "node-fetch";

export interface GithubSkillPackage {
  repo: string;
  path: string;
  content: string;
}

export class GithubAdapter {

  static async fetchRawFile(
    owner: string,
    repo: string,
    path: string,
    branch: string = "main"
  ): Promise<GithubSkillPackage | null> {

    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const content = await response.text();

      return {
        repo: `${owner}/${repo}`,
        path,
        content
      };
    } catch {
      return null;
    }
  }
}