export function containsLikelySecret(input: string): boolean {
  const patterns = [
    /sk-[a-zA-Z0-9]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN [A-Z ]+PRIVATE KEY-----/,
  ];
  return patterns.some((pattern) => pattern.test(input));
}
