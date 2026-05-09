export class ToolRouter {

  static async route(skill: any, input: any): Promise<any> {

    if (typeof skill.execute !== "function") {
      throw new Error("Skill execution function not found.");
    }

    return await skill.execute(input);
  }
}