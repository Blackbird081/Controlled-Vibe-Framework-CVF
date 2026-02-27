export class SafeRewriteEngine {
  rewrite(message: string): string {
    return message.replace(/kill myself|suicide/gi, "[self-harm redacted]")
  }
}
