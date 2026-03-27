"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const outlineGold =
  "rounded-sm border-primary/40 font-mono text-xs tracking-[0.15em] text-primary uppercase hover:bg-primary/10";

export function WalletHeaderButton() {
  return (
    <ConnectButton.Custom>
      {({ account, openAccountModal, openConnectModal, mounted }) => {
        if (!mounted) {
          return (
            <div
              className="h-8 min-w-[140px] animate-pulse rounded-sm border border-border bg-muted/30"
              aria-hidden
            />
          );
        }
        if (account) {
          return (
            <button
              type="button"
              onClick={openAccountModal}
              className="text-right font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <div>
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </div>
              <div className="font-heading mt-0.5 text-lg text-foreground">
                {account.displayBalance ?? "—"}
              </div>
            </button>
          );
        }
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(outlineGold)}
            onClick={openConnectModal}
          >
            Conectar Wallet
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
