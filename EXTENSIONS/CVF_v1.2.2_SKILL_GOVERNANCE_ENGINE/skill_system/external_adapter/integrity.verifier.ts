import crypto from "crypto";

export class IntegrityVerifier {

  static computeChecksum(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  static verify(content: string, expectedChecksum: string): boolean {
    const actual = this.computeChecksum(content);
    return actual === expectedChecksum;
  }

  static attachIntegrity(skill: any, source: string, checksum: string): any {
    return {
      ...skill,
      integrity: {
        source,
        checksum,
        verified: true
      }
    };
  }
}