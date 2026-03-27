// TODO: reemplazar con xo-connect cuando tengamos el paquete correcto
// xo-connect@2.1.4 existe (npm: xo-connect, repo: github.com/latamxo/xo-connect)
// pero depende de ethers v5 — evaluar migración o esperar versión compatible con v6

import { BrowserProvider, formatEther } from "ethers";

const RSK_TESTNET = {
  chainId: "0x1f", // 31
  chainName: "RSK Testnet",
  nativeCurrency: { name: "tRBTC", symbol: "tRBTC", decimals: 18 },
  rpcUrls: ["https://public-node.testnet.rsk.co"],
  blockExplorerUrls: ["https://explorer.testnet.rsk.co"],
};

function getEthereum(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  return (window as any).ethereum ?? null;
}

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
};

export async function connectWallet(): Promise<{
  address: string;
  balance: string;
  provider: BrowserProvider;
}> {
  const eth = getEthereum();
  if (!eth) throw new Error("No se detectó wallet. Instalá Beexo o MetaMask.");

  // Pedir cuentas
  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts.length) throw new Error("No se obtuvo cuenta.");

  // Asegurar red RSK Testnet
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: RSK_TESTNET.chainId }],
    });
  } catch (switchErr: any) {
    if (switchErr.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [RSK_TESTNET],
      });
    } else {
      throw switchErr;
    }
  }

  const provider = new BrowserProvider(eth as any);
  const balance = await provider.getBalance(accounts[0]);

  return {
    address: accounts[0],
    balance: formatEther(balance),
    provider,
  };
}

export function onAccountsChanged(handler: (accounts: string[]) => void) {
  const eth = getEthereum();
  if (!eth) return () => {};
  const cb = (...args: unknown[]) => handler(args[0] as string[]);
  eth.on("accountsChanged", cb);
  return () => eth.removeListener("accountsChanged", cb);
}
