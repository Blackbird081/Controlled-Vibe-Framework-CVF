export class CreativeProvenanceTagger {
  tag(output: string): string {
    return `[creative:controlled]\n${output}`
  }
}
