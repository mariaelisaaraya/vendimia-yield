import { createPublicClient, formatEther, http, type PublicClient } from "viem";

import { getRskRpcHttpUrl, rskChain } from "@/lib/chain";

export function getRskPublicClient(): PublicClient {
  return createPublicClient({
    chain: rskChain,
    transport: http(getRskRpcHttpUrl()),
  });
}

/** Promedio de segundos por bloque usando una ventana de hasta 100 bloques. */
export async function getBlocksPerYear(client: PublicClient): Promise<number> {
  const latest = await client.getBlock({ blockTag: "latest" });
  const n = latest.number ?? BigInt(0);
  const hundred = BigInt(100);
  const window =
    n > hundred ? hundred : n > BigInt(1) ? n - BigInt(1) : BigInt(0);
  if (window === BigInt(0)) {
    return Math.round((86400 / 30) * 365);
  }
  const prev = await client.getBlock({ blockNumber: n - window });
  const avgBlockTime = Number(latest.timestamp - prev.timestamp) / Number(window);
  if (!Number.isFinite(avgBlockTime) || avgBlockTime <= 0) {
    return Math.round((86400 / 30) * 365);
  }
  return Math.round((86400 / avgBlockTime) * 365);
}

/**
 * APY compuesto desde tasa por bloque (escala 1e18 en el contrato → fracción por bloque).
 * APY = ((1 + r)^n - 1) * 100; usamos log1p/expm1 para estabilidad numérica.
 */
export function compoundApyFromRatePerBlock(
  ratePerBlockScaled: bigint,
  blocksPerYear: number
): number {
  if (ratePerBlockScaled <= BigInt(0)) return 0;
  if (!Number.isFinite(blocksPerYear) || blocksPerYear <= 0) return 0;

  // uint256 → fracción por bloque (1e18). Number(bigint)/1e18 pierde precisión; formatEther no.
  const ratePerBlock = Number.parseFloat(formatEther(ratePerBlockScaled));
  if (!(ratePerBlock > 0)) return 0;

  const apy = Math.expm1(blocksPerYear * Math.log1p(ratePerBlock)) * 100;
  return Number.isFinite(apy) ? apy : 0;
}
