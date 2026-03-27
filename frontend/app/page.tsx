"use client";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DepositCta } from "@/components/deposit-cta";
import { WalletHeaderButton } from "@/components/wallet-connect-controls";
import { monthlyUsdYieldFromApy } from "@/lib/monthly-yield-usd";
import { cn } from "@/lib/utils";
import { applyYieldsToProtocols, type YieldsApiResponse } from "@/lib/yields-api-types";
import {
  PROTOCOLS,
  type Protocol,
  type ProtocolInfo,
} from "@/lib/protocols";

function formatApyPct(n: number): string {
  if (n > 0 && n < 0.01) return n.toFixed(4);
  return n.toFixed(2);
}

function useCountUp(target: number | null, duration = 1000) {
  const [value, setValue] = useState(0);
  const prev = useRef<number | null>(null);

  useEffect(() => {
    if (target === null || target === prev.current) return;
    prev.current = target;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(eased * target!);
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return target === null ? null : value;
}

export default function HomePage() {
  const [protocols, setProtocols] = useState<ProtocolInfo[]>(PROTOCOLS);
  const [selected, setSelected] = useState<Protocol | null>(null);
  const [amount, setAmount] = useState("");
  const [btcPrice, setBtcPrice] = useState<number | null>(null);

  const winner = protocols.reduce<ProtocolInfo | null>((best, p) => {
    if (p.apy === null) return best;
    if (!best || best.apy === null) return p;
    return p.apy > best.apy ? p : best;
  }, null);

  const apyTropykus = useCountUp(protocols[0].apy);
  const apySovryn = useCountUp(protocols[1].apy);
  const apyMoc = useCountUp(protocols[2].apy);
  const apyValues = [apyTropykus, apySovryn, apyMoc];

  const activeProtocol = selected ?? winner?.id ?? null;
  const activeProto = protocols.find((p) => p.id === activeProtocol);

  const amountBtc = parseFloat(amount);
  const principalUsd =
    Number.isFinite(amountBtc) &&
    amountBtc > 0 &&
    btcPrice != null &&
    Number.isFinite(btcPrice)
      ? amountBtc * btcPrice
      : null;
  const showRbtcMonthlyUsd = activeProto?.id !== "moneyonchain";
  const monthlyYieldUsd =
    showRbtcMonthlyUsd &&
    principalUsd != null &&
    activeProto?.apy != null &&
    activeProto.apy > 0
      ? monthlyUsdYieldFromApy(principalUsd, activeProto.apy)
      : null;

  useEffect(() => {
    async function fetchYields() {
      try {
        const res = await fetch("/api/yields");
        if (!res.ok) return;
        const data = (await res.json()) as YieldsApiResponse;
        setProtocols((prev) => applyYieldsToProtocols(prev, data));
      } catch {
        /* cards show "—" when apy is null */
      }
    }
    fetchYields();
    const interval = setInterval(fetchYields, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          bitcoin?: { usd?: number };
        };
        setBtcPrice(data.bitcoin?.usd ?? null);
      } catch {
        /* price hidden if unavailable */
      }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 60_000);
    return () => clearInterval(interval);
  }, []);

  const formatUsd = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const depositLabel =
    activeProto?.apy != null
      ? `Depositar en ${activeProto.name} — ${formatApyPct(activeProto.apy)}% APY`
      : `Depositar en ${activeProto?.name ?? ""}`;

  return (
    <main className="mx-auto min-h-svh max-w-[960px] px-6 py-12">
      <header className="fade-up fade-up-1 mb-16 flex items-center justify-between gap-4 md:mb-20">
        <div className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
          RSK Yield Router
        </div>
        <WalletHeaderButton />
      </header>

      <h1 className="fade-up fade-up-2 font-heading mb-12 text-5xl leading-[1.05] tracking-tight md:mb-16 md:text-7xl">
        Tu Bitcoin.
        <br />
        <span className="text-primary italic">Trabajando.</span>
      </h1>

      <div className="mb-12 grid gap-4 md:mb-16 md:grid-cols-3">
        {protocols.map((p, i) => {
          const isWinner = winner?.id === p.id;
          const apyDisplay = apyValues[i];
          const isActive = activeProtocol === p.id;
          return (
            <Card
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(p.id);
                }
              }}
              className={cn(
                "fade-up cursor-pointer py-7 transition-all",
                `fade-up-${i + 3}`,
                !isWinner && "opacity-55 hover:opacity-80",
                isWinner && "border-t-2 border-t-primary pt-6",
                isActive &&
                  "ring-2 ring-primary/50 ring-offset-2 ring-offset-background opacity-100"
              )}
            >
              <CardHeader className="gap-3">
                {isWinner && (
                  <Badge
                    variant="outline"
                    className="w-fit rounded-sm border-primary/50 bg-transparent font-mono text-[9px] tracking-[0.3em] text-primary uppercase"
                  >
                    Mejor rendimiento
                  </Badge>
                )}
                <div className="font-mono text-[13px] tracking-[0.08em] text-muted-foreground uppercase">
                  {p.name}
                </div>
                <CardDescription className="font-mono text-[11px] leading-relaxed">
                  {p.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-heading text-5xl leading-none">
                  {apyDisplay !== null
                    ? `${formatApyPct(apyDisplay)}%`
                    : "—"}
                </p>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  APY actual
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="fade-up fade-up-5 border-t border-border pt-10 md:pt-12">
        <div className="mb-3 flex flex-wrap items-baseline gap-3">
          <Input
            type="number"
            step="0.0001"
            min={0}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-auto max-w-[200px] rounded-none border-0 border-b border-primary/40 bg-transparent px-0 py-2 font-heading text-3xl shadow-none focus-visible:ring-0 md:text-4xl"
          />
          <span className="font-mono text-sm text-muted-foreground">RBTC</span>
        </div>

        {btcPrice && (
          <p className="mb-8 font-mono text-[11px] text-muted-foreground">
            1 BTC = ${formatUsd(btcPrice)} USD
          </p>
        )}

        {activeProto && (
          <>
            {activeProto.id === "moneyonchain" ? (
              <>
                <p className="mb-2 font-mono text-xs text-muted-foreground">
                  {activeProto.name}
                </p>
                <p className="mb-8 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                  El APY mostrado corresponde a mercados DOC (kDOC / iDOC), no a préstamo directo
                  en RBTC. No estimamos ganancia mensual en USD a partir del monto en RBTC.
                </p>
              </>
            ) : (
              <>
                <p className="mb-2 font-mono text-xs text-muted-foreground">
                  Con {activeProto.name} ganarías
                </p>
                <p className="mb-8 font-heading text-3xl text-[#00d37f] md:text-4xl">
                  $
                  {monthlyYieldUsd && monthlyYieldUsd > 0
                    ? formatUsd(monthlyYieldUsd)
                    : "0.00"}{" "}
                  por mes
                </p>
              </>
            )}
          </>
        )}

        {activeProtocol && activeProto && (
          <DepositCta
            protocol={activeProtocol}
            amountEth={amount}
            depositLabel={depositLabel}
          />
        )}
      </section>
    </main>
  );
}
