import { NextResponse } from "next/server";

import { fetchDocYieldSummary } from "@/lib/yields/moneyonchain-doc";
import { fetchSovrynIrbctApy } from "@/lib/yields/sovryn";
import { fetchTropykusKrbctApy } from "@/lib/yields/tropykus";

export const dynamic = "force-dynamic";

/** APYs pueden ser menores a 0.01%; con 2 decimales se veían como 0.00%. */
function roundApy(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10000) / 10000;
}

export async function GET() {
  const [tropykus, sovryn, doc] = await Promise.all([
    fetchTropykusKrbctApy().catch(() => null),
    fetchSovrynIrbctApy().catch(() => null),
    fetchDocYieldSummary().catch(() => null),
  ]);

  return NextResponse.json({
    tropykus: tropykus != null ? roundApy(tropykus) : null,
    sovryn: sovryn != null ? roundApy(sovryn) : null,
    moneyonchain: doc?.bestApy != null ? roundApy(doc.bestApy) : null,
    doc: doc
      ? {
          kDOC: doc.kDOC ? { apy: roundApy(doc.kDOC.apy), address: doc.kDOC.address } : null,
          iDOC: doc.iDOC ? { apy: roundApy(doc.iDOC.apy), address: doc.iDOC.address } : null,
          bestMarket: doc.bestMarket,
        }
      : undefined,
  });
}
