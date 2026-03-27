"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";

import { Button } from "@/components/ui/button";
import { useYieldDeposit } from "@/hooks/use-yield-deposit";
import { getRskBlockExplorerTxUrl, rskChain } from "@/lib/chain";
import { cn } from "@/lib/utils";
import type { Protocol } from "@/lib/protocols";

const outlineGold =
  "h-auto w-full rounded-sm border-primary py-4 font-mono text-xs tracking-[0.15em] text-primary uppercase";

type DepositCtaProps = {
  protocol: Protocol;
  amountEth: string;
  depositLabel: string;
};

export function DepositCta({
  protocol,
  amountEth,
  depositLabel,
}: DepositCtaProps) {
  const { openConnectModal } = useConnectModal();
  const {
    isConnected,
    isWrongChain,
    switchToRsk,
    isSwitchPending,
    deposit,
    hash,
    isPending,
    isSuccess,
    error,
    hasRouter,
  } = useYieldDeposit();

  if (!isConnected) {
    return (
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={cn(outlineGold)}
          onClick={() => openConnectModal?.()}
        >
          Conectar Wallet para depositar
        </Button>
      </div>
    );
  }

  if (isWrongChain) {
    return (
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={cn(outlineGold)}
          disabled={isSwitchPending}
          onClick={() => void switchToRsk()}
        >
          {isSwitchPending
            ? "Cambiando red…"
            : `Cambiar a ${rskChain.name}`}
        </Button>
        {error && (
          <p className="font-mono text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className={cn(outlineGold)}
        disabled={
          isPending || !hasRouter || !amountEth.trim()
        }
        onClick={() => deposit(protocol, amountEth)}
      >
        {isPending
          ? "Confirmando depósito…"
          : depositLabel}
      </Button>
      {!hasRouter && (
        <p className="font-mono text-xs text-muted-foreground">
          Configurá NEXT_PUBLIC_YIELD_ROUTER para depositar.
        </p>
      )}
      {error && (
        <p className="font-mono text-xs text-destructive">{error}</p>
      )}
      {isSuccess && hash && (
        <p className="font-mono text-xs text-muted-foreground break-all">
          Tx:{" "}
          <a
            href={getRskBlockExplorerTxUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            {hash}
          </a>
        </p>
      )}
    </div>
  );
}
