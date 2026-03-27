/**
 * On-chain APY is effective annual yield (%) with compounding.
 * One month’s interest at the equivalent monthly compounded rate:
 * (1 + m)^12 = 1 + APY/100  →  m = (1 + APY/100)^(1/12) - 1
 */
export function monthlyUsdYieldFromApy(
  principalUsd: number,
  apyPercent: number
): number | null {
  if (!Number.isFinite(principalUsd) || principalUsd <= 0) return null;
  if (!Number.isFinite(apyPercent) || apyPercent <= 0) return null;
  const monthlyRate = Math.pow(1 + apyPercent / 100, 1 / 12) - 1;
  if (!Number.isFinite(monthlyRate)) return null;
  return principalUsd * monthlyRate;
}
