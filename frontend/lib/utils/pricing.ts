export function roundToHundred(value: number): number {
  return Math.round(value / 100) * 100
}

export function computeDeposit(total: number, depositPct: number): number {
  return roundToHundred((total * depositPct) / 100)
}
