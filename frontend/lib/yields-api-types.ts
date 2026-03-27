import type { Protocol } from "@/lib/protocols";

export type YieldsApiResponse = {
  tropykus: number | null;
  sovryn: number | null;
  moneyonchain: number | null;
  doc?: {
    kDOC: { apy: number; address: string } | null;
    iDOC: { apy: number; address: string } | null;
    bestMarket: "kDOC" | "iDOC" | null;
  };
};

export function applyYieldsToProtocols<T extends { id: Protocol; apy: number | null }>(
  prev: T[],
  data: YieldsApiResponse
): T[] {
  return prev.map((p) => ({
    ...p,
    apy: data[p.id] ?? null,
  }));
}
