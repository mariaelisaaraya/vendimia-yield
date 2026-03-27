export type Protocol = "tropykus" | "sovryn" | "moneyonchain";

export interface ProtocolInfo {
  id: Protocol;
  name: string;
  description: string;
  apy: number | null;
  color: string;
}

export const PROTOCOLS: ProtocolInfo[] = [
  {
    id: "tropykus",
    name: "Tropykus",
    description: "Lending/borrowing — cToken style",
    apy: null,
    color: "#22c55e",
  },
  {
    id: "sovryn",
    name: "Sovryn",
    description: "Lending pool — iToken model",
    apy: null,
    color: "#eab308",
  },
  {
    id: "moneyonchain",
    name: "Money on Chain",
    description: "RBTC-backed stablecoin yield",
    apy: null,
    color: "#3b82f6",
  },
];

export const YIELD_ROUTER_ADDRESS = process.env.NEXT_PUBLIC_YIELD_ROUTER ?? "";

export const PROTOCOL_INDEX: Record<Protocol, number> = {
  tropykus: 0,
  sovryn: 1,
  moneyonchain: 2,
};
