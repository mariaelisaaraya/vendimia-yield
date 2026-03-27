"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { defineChain } from "viem";

const rskTestnet = defineChain({
  id: 31,
  name: "RSK Testnet",
  nativeCurrency: {
    name: "Test RBTC",
    symbol: "tRBTC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://public-node.testnet.rsk.co"] },
  },
  blockExplorers: {
    default: {
      name: "RSK Explorer",
      url: "https://explorer.testnet.rsk.co",
    },
  },
  testnet: true,
});

const config = getDefaultConfig({
  appName: "Vendimia Yield",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains: [rskTestnet],
  ssr: true,
});

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#c9a84c",
            accentColorForeground: "#1a1508",
            borderRadius: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
