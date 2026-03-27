import { getAddress } from "viem";

import {
  compoundApyFromRatePerBlock,
  getBlocksPerYear,
  getRskPublicClient,
} from "./rsk";

const kTokenAbi = [
  {
    name: "supplyRatePerBlock",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
] as const;

export const TROPYKUS_MARKETS = {
  kRBTC: "0x0aeadb9d4c6a80462a47e87e76e487fa8b9a37d7",
  kDOC: "0x544eb90e766b405134b3b3f62b6b4c23fcd5fda2",
} as const;

export type TropykusMarketResult = {
  market: string;
  apy: number;
  address: string;
};

export async function fetchTropykusMarketApys(): Promise<TropykusMarketResult[]> {
  const client = getRskPublicClient();
  const blocksPerYear = await getBlocksPerYear(client);
  const entries = Object.entries(TROPYKUS_MARKETS) as [
    string,
    string,
  ][];

  const results: TropykusMarketResult[] = [];

  for (const [market, rawAddress] of entries) {
    try {
      const address = getAddress(rawAddress);
      const rate = await client.readContract({
        address,
        abi: kTokenAbi,
        functionName: "supplyRatePerBlock",
      });
      const apy = compoundApyFromRatePerBlock(rate, blocksPerYear);
      results.push({ market, apy, address });
    } catch {
      /* un mercado falla, seguimos con el resto */
    }
  }

  return results;
}

/** APY del mercado kRBTC para la tarjeta “Tropykus” del agregador. */
export async function fetchTropykusKrbctApy(): Promise<number | null> {
  const rows = await fetchTropykusMarketApys();
  const row = rows.find((r) => r.market === "kRBTC");
  return row?.apy ?? null;
}
