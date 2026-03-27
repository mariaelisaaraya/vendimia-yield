"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider, cookieStorage, createStorage } from "wagmi";

import { rskChain } from "@/lib/chain";
import { walletConnectKeyValueStorage } from "@/lib/walletconnect-kv-storage";

const storage = createStorage({ storage: cookieStorage });

const config = getDefaultConfig({
  appName: "Vendimia Yield",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains: [rskChain],
  ssr: true,
  storage,
  walletConnectParameters: {
    storage: walletConnectKeyValueStorage,
  },
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
