export function rehydrateResponse(
  response: string,
  vaultEntries: { original: string; masked: string }[]
): string {
  let output = response

  vaultEntries.forEach(entry => {
    output = output.replace(entry.masked, entry.original)
  })

  return output
}