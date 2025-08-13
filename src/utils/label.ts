// Convert 0-based index to Excel-like letters: 0->A, 25->Z, 26->AA, ...
export function indexToLetters(index: number): string {
  let n = index
  let result = ''
  do {
    const rem = n % 26
    result = String.fromCharCode(65 + rem) + result
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return result
}