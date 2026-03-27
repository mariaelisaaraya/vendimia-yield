import { getAddress, parseEther } from "viem";

import { getRskPublicClient } from "./rsk";

const iTokenAbi = [
  {
    name: "supplyInterestRate",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    name: "nextSupplyInterestRate",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "supplyAmount", type: "uint256" }],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    name: "totalAssetSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    name: "totalAssetBorrow",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
] as const;

export const SOVRYN_POOLS = {
  iRBTC: "0xa9dcdc63eabb8a2b6f39d7ff9429d88340044a7a",
  iDOC: "0xd8d25f03ebba94e15df2ed4d6d38276b595593c1",
} as const;

const SIM_DEPOSIT = parseEther("1");

export type SovrynPoolResult = {
  market: string;
  apy: number;
  utilization: number;
  projectedApy: number;
  address: string;
};

function apyFromScaledRate(scaled: bigint): number {
  return Number(scaled) / 1e18;
}

export async function fetchSovrynPoolDetails(): Promise<SovrynPoolResult[]> {
  const client = getRskPublicClient();
  const entries = Object.entries(SOVRYN_POOLS) as [string, string][];
  const out: SovrynPoolResult[] = [];

  for (const [market, rawAddress] of entries) {
    try {
      const address = getAddress(rawAddress);
      const [supplyRate, nextRate, supply, borrow] = await Promise.all([
        client.readContract({
          address,
          abi: iTokenAbi,
          functionName: "supplyInterestRate",
        }),
        client.readContract({
          address,
          abi: iTokenAbi,
          functionName: "nextSupplyInterestRate",
          args: [SIM_DEPOSIT],
        }),
        client.readContract({
          address,
          abi: iTokenAbi,
          functionName: "totalAssetSupply",
        }),
        client.readContract({
          address,
          abi: iTokenAbi,
          functionName: "totalAssetBorrow",
        }),
      ]);

      const apy = apyFromScaledRate(supplyRate);
      const projectedApy = apyFromScaledRate(nextRate);
      const supplyN = Number(supply);
      const utilization =
        supplyN > 0 ? (Number(borrow) / supplyN) * 100 : 0;

      out.push({
        market,
        apy,
        utilization,
        projectedApy,
        address,
      });
    } catch {
      /* seguir con el siguiente pool */
    }
  }

  return out;
}

export async function fetchSovrynIrbctApy(): Promise<number | null> {
  const rows = await fetchSovrynPoolDetails();
  const row = rows.find((r) => r.market === "iRBTC");
  return row?.apy ?? null;
}
