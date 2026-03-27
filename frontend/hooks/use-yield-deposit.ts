"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { isAddress, parseEther } from "viem";

import { yieldRouterAbi } from "@/lib/abi/yield-router";
import { RSK_CHAIN_ID } from "@/lib/chain";
import {
  PROTOCOL_INDEX,
  YIELD_ROUTER_ADDRESS,
  type Protocol,
} from "@/lib/protocols";

function shortError(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message;
    if (m.includes("User rejected") || m.includes("user rejected")) {
      return "Transacción cancelada";
    }
    return m.length > 120 ? `${m.slice(0, 117)}…` : m;
  }
  return "Error desconocido";
}

export function useYieldDeposit() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();

  const [localError, setLocalError] = useState<string | null>(null);

  const routerAddress = useMemo(() => {
    const a = YIELD_ROUTER_ADDRESS.trim();
    if (!a || !isAddress(a)) return null;
    return a as `0x${string}`;
  }, []);

  const isWrongChain = isConnected && chainId !== RSK_CHAIN_ID;

  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const error = useMemo(() => {
    if (localError) return localError;
    if (writeError) return shortError(writeError);
    if (receiptError) return shortError(receiptError);
    return null;
  }, [localError, writeError, receiptError]);

  const isPending = isWritePending || isConfirming;

  const switchToRsk = useCallback(async () => {
    setLocalError(null);
    if (!switchChainAsync) {
      setLocalError("No se pudo cambiar de red");
      return;
    }
    try {
      await switchChainAsync({ chainId: RSK_CHAIN_ID });
    } catch (e) {
      setLocalError(shortError(e));
    }
  }, [switchChainAsync]);

  const deposit = useCallback(
    (protocol: Protocol, amountEth: string) => {
      setLocalError(null);
      resetWrite();

      if (!routerAddress) {
        setLocalError("Falta NEXT_PUBLIC_YIELD_ROUTER en el entorno");
        return;
      }

      const n = parseFloat(amountEth);
      if (!Number.isFinite(n) || n <= 0) {
        setLocalError("Ingresá un monto mayor a 0");
        return;
      }

      let value: bigint;
      try {
        value = parseEther(amountEth);
      } catch {
        setLocalError("Monto inválido");
        return;
      }

      if (value <= BigInt(0)) {
        setLocalError("Monto inválido");
        return;
      }

      try {
        writeContract({
          address: routerAddress,
          abi: yieldRouterAbi,
          functionName: "deposit",
          args: [PROTOCOL_INDEX[protocol]],
          value,
        });
      } catch (e) {
        setLocalError(shortError(e));
      }
    },
    [routerAddress, resetWrite, writeContract]
  );

  const reset = useCallback(() => {
    setLocalError(null);
    resetWrite();
  }, [resetWrite]);

  return {
    address,
    isConnected,
    isWrongChain,
    switchToRsk,
    isSwitchPending,
    deposit,
    hash: hash ?? null,
    isPending,
    isSuccess,
    error,
    reset,
    hasRouter: routerAddress !== null,
  };
}
