import { defineChain, type Chain } from "viem";

const MAINNET_RPC = "https://mainnet.sovryn.app/rpc";
const TESTNET_RPC = "https://public-node.testnet.rsk.co";

export type RskChainId = 30 | 31;

function readChainId(): RskChainId {
  const raw = process.env.NEXT_PUBLIC_RSK_CHAIN_ID;
  if (raw === "31") return 31;
  return 30;
}

export const RSK_CHAIN_ID = readChainId();

export const rskChain: Chain = defineChain({
  id: RSK_CHAIN_ID,
  name: RSK_CHAIN_ID === 31 ? "RSK Testnet" : "RSK Mainnet",
  nativeCurrency:
    RSK_CHAIN_ID === 31
      ? { name: "Test RBTC", symbol: "tRBTC", decimals: 18 }
      : { name: "RBTC", symbol: "RBTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [RSK_CHAIN_ID === 31 ? TESTNET_RPC : MAINNET_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: RSK_CHAIN_ID === 31 ? "RSK Explorer" : "Blockscout",
      url:
        RSK_CHAIN_ID === 31
          ? "https://explorer.testnet.rsk.co"
          : "https://rootstock.blockscout.com",
    },
  },
  testnet: RSK_CHAIN_ID === 31,
});

export function getRskRpcHttpUrl(): string {
  return rskChain.rpcUrls.default.http[0];
}

export function getRskBlockExplorerTxUrl(txHash: string): string {
  const base = rskChain.blockExplorers?.default.url ?? "";
  return `${base.replace(/\/$/, "")}/tx/${txHash}`;
}
