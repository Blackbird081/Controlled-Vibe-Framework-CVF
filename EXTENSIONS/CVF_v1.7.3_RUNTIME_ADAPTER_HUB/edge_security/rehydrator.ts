export function rehydrateResponse(
  response: string,
  vaultEntries: { original: string; masked: string }[]
): string {
  let output = response

  vaultEntries.forEach(entry => {
    output = output.split(entry.masked).join(entry.original)
  })

  return output
}
