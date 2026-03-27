import { fetchSovrynPoolDetails } from "./sovryn";
import { fetchTropykusMarketApys } from "./tropykus";

export type DocYieldSummary = {
  kDOC: { apy: number; address: string } | null;
  iDOC: { apy: number; address: string } | null;
  bestApy: number | null;
  bestMarket: "kDOC" | "iDOC" | null;
};

/**
 * MoC no expone un supplyRate tipo Compound para BPRO en una sola llamada.
 * Para yield en DOC, la guía reutiliza kDOC (Tropykus) e iDOC (Sovryn).
 */
export async function fetchDocYieldSummary(): Promise<DocYieldSummary> {
  const [tropykusRows, sovrynRows] = await Promise.all([
    fetchTropykusMarketApys(),
    fetchSovrynPoolDetails(),
  ]);

  const k = tropykusRows.find((r) => r.market === "kDOC");
  const i = sovrynRows.find((r) => r.market === "iDOC");

  const kDOC = k ? { apy: k.apy, address: k.address } : null;
  const iDOC = i ? { apy: i.apy, address: i.address } : null;

  let bestApy: number | null = null;
  let bestMarket: "kDOC" | "iDOC" | null = null;
  if (kDOC && iDOC) {
    if (kDOC.apy >= iDOC.apy) {
      bestApy = kDOC.apy;
      bestMarket = "kDOC";
    } else {
      bestApy = iDOC.apy;
      bestMarket = "iDOC";
    }
  } else if (kDOC) {
    bestApy = kDOC.apy;
    bestMarket = "kDOC";
  } else if (iDOC) {
    bestApy = iDOC.apy;
    bestMarket = "iDOC";
  }

  return { kDOC, iDOC, bestApy, bestMarket };
}
