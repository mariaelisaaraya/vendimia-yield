"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserProvider, parseEther, Contract } from "ethers";
import { connectWallet, onAccountsChanged } from "@/lib/wallet";
import {
  PROTOCOLS,
  YIELD_ROUTER_ADDRESS,
  PROTOCOL_INDEX,
  type Protocol,
  type ProtocolInfo,
} from "@/lib/protocols";

const ROUTER_ABI = [
  "function deposit(uint8 protocol) external payable returns (uint256)",
];

/* ── Count-up hook ─────────────────────── */
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

/* ── Styles ────────────────────────────── */
const s = {
  page: {
    minHeight: "100vh",
    padding: "48px 24px",
    maxWidth: 960,
    margin: "0 auto",
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 80,
  } as React.CSSProperties,

  logo: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 11,
    letterSpacing: "0.3em",
    color: "var(--text-secondary)",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,

  connectBtn: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 12,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "var(--gold)",
    background: "transparent",
    border: "1px solid var(--border-gold)",
    padding: "10px 24px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    borderRadius: 2,
  } as React.CSSProperties,

  walletInfo: {
    textAlign: "right" as const,
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 12,
    color: "var(--text-secondary)",
  } as React.CSSProperties,

  walletBalance: {
    fontFamily: "var(--font-dm-serif), serif",
    fontSize: 18,
    color: "var(--text-primary)",
    marginTop: 2,
  } as React.CSSProperties,

  headline: {
    fontFamily: "var(--font-dm-serif), serif",
    fontSize: 72,
    lineHeight: 1.05,
    color: "var(--text-primary)",
    marginBottom: 64,
  } as React.CSSProperties,

  headlineItalic: {
    fontStyle: "italic",
    color: "var(--gold)",
  } as React.CSSProperties,

  cardsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 64,
  } as React.CSSProperties,

  card: (isWinner: boolean) =>
    ({
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 2,
      padding: "32px 28px",
      display: "flex",
      flexDirection: "column" as const,
      position: "relative" as const,
      borderTop: isWinner ? "2px solid var(--gold)" : "1px solid var(--border)",
      opacity: isWinner ? 1 : 0.55,
      transition: "opacity 0.3s ease",
    }) as React.CSSProperties,

  badge: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 9,
    letterSpacing: "0.3em",
    textTransform: "uppercase" as const,
    color: "var(--gold)",
    marginBottom: 16,
  } as React.CSSProperties,

  cardName: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 13,
    color: "var(--text-secondary)",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    marginBottom: 4,
  } as React.CSSProperties,

  cardDesc: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 11,
    color: "var(--text-muted)",
    marginBottom: 24,
  } as React.CSSProperties,

  apyNumber: {
    fontFamily: "var(--font-dm-serif), serif",
    fontSize: 48,
    color: "var(--text-primary)",
    lineHeight: 1,
  } as React.CSSProperties,

  apyLabel: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 11,
    color: "var(--text-muted)",
    marginTop: 8,
  } as React.CSSProperties,

  // ── Calculator section ──
  calcSection: {
    borderTop: "1px solid var(--border)",
    paddingTop: 48,
    marginBottom: 48,
  } as React.CSSProperties,

  inputRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 12,
    marginBottom: 12,
  } as React.CSSProperties,

  calcInput: {
    fontFamily: "var(--font-dm-serif), serif",
    fontSize: 36,
    color: "var(--text-primary)",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid var(--border-gold)",
    outline: "none",
    width: 200,
    paddingBottom: 8,
  } as React.CSSProperties,

  calcUnit: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 14,
    color: "var(--text-secondary)",
  } as React.CSSProperties,

  btcPrice: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 11,
    color: "var(--text-muted)",
    marginBottom: 32,
  } as React.CSSProperties,

  estimateLabel: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 12,
    color: "var(--text-secondary)",
    marginBottom: 8,
  } as React.CSSProperties,

  estimateValue: {
    fontFamily: "var(--font-dm-serif), serif",
    fontSize: 32,
    color: "#00D37F",
    marginBottom: 32,
    lineHeight: 1.2,
  } as React.CSSProperties,

  depositBtn: (isLoading: boolean) =>
    ({
      fontFamily: "var(--font-dm-mono), monospace",
      fontSize: 13,
      letterSpacing: "0.15em",
      textTransform: "uppercase" as const,
      color: isLoading ? "var(--text-muted)" : "#C9A84C",
      background: "transparent",
      border: "1px solid #C9A84C",
      padding: 18,
      cursor: isLoading ? "default" : "pointer",
      transition: "all 0.3s ease",
      borderRadius: 2,
      width: "100%",
    }) as React.CSSProperties,

  error: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 12,
    color: "#ef4444",
    background: "#ef444410",
    border: "1px solid #ef444430",
    borderRadius: 2,
    padding: "12px 16px",
    marginBottom: 24,
  } as React.CSSProperties,

  txBox: {
    fontFamily: "var(--font-dm-mono), monospace",
    fontSize: 12,
    color: "var(--text-secondary)",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 2,
    padding: "14px 16px",
    marginTop: 24,
    wordBreak: "break-all" as const,
  } as React.CSSProperties,

  txLink: {
    color: "var(--gold)",
    textDecoration: "underline",
  } as React.CSSProperties,
} as const;

/* ── Component ─────────────────────────── */
export default function Home() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [protocols, setProtocols] = useState<ProtocolInfo[]>(PROTOCOLS);
  const [selected, setSelected] = useState<Protocol | null>(null);
  const [depositing, setDepositing] = useState<Protocol | null>(null);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);

  // Determine winner (highest APY)
  const winner = protocols.reduce<ProtocolInfo | null>((best, p) => {
    if (p.apy === null) return best;
    if (!best || best.apy === null) return p;
    return p.apy > best.apy ? p : best;
  }, null);

  // Count-up values for each protocol
  const apyTropykus = useCountUp(protocols[0].apy);
  const apySovryn = useCountUp(protocols[1].apy);
  const apyMoc = useCountUp(protocols[2].apy);
  const apyValues = [apyTropykus, apySovryn, apyMoc];

  // Selected protocol for deposit (defaults to winner)
  const activeProtocol = selected ?? winner?.id ?? null;
  const activeProto = protocols.find((p) => p.id === activeProtocol);

  // Yield estimate in USD: amount * btcPrice * (apy/100) / 12
  const monthlyYieldUsd =
    activeProto?.apy && amount && btcPrice
      ? (parseFloat(amount) * btcPrice * (activeProto.apy / 100)) / 12
      : null;

  // Fetch APYs
  useEffect(() => {
    async function fetchYields() {
      try {
        const res = await fetch("/api/yields");
        if (!res.ok) return;
        const data = await res.json();
        setProtocols((prev) =>
          prev.map((p) => ({ ...p, apy: data[p.id] ?? null }))
        );
      } catch {
        /* cards show "—" when apy is null */
      }
    }
    fetchYields();
    const interval = setInterval(fetchYields, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch BTC price from CoinGecko
  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        );
        if (!res.ok) return;
        const data = await res.json();
        setBtcPrice(data.bitcoin?.usd ?? null);
      } catch {
        /* price shows nothing if unavailable */
      }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return onAccountsChanged((accounts) => {
      if (!accounts.length) {
        setAddress(null);
        setBalance("0");
        setProvider(null);
      }
    });
  }, []);

  const handleConnect = useCallback(async () => {
    setError(null);
    try {
      const wallet = await connectWallet();
      setAddress(wallet.address);
      setBalance(wallet.balance);
      setProvider(wallet.provider);
    } catch (err: any) {
      setError(err.message ?? "Error al conectar wallet");
    }
  }, []);

  const handleDeposit = useCallback(
    async (protocol: Protocol) => {
      if (!provider || !amount) return;
      setError(null);
      setTxHash(null);
      setDepositing(protocol);
      try {
        const signer = await provider.getSigner();
        const router = new Contract(YIELD_ROUTER_ADDRESS, ROUTER_ABI, signer);
        const tx = await router.deposit(PROTOCOL_INDEX[protocol], {
          value: parseEther(amount),
        });
        setTxHash(tx.hash);
        await tx.wait();
      } catch (err: any) {
        setError(err.reason ?? err.message ?? "Error en el depósito");
      } finally {
        setDepositing(null);
      }
    },
    [provider, amount]
  );

  const formatUsd = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <main style={s.page}>
      {/* ── Header ─────────────────────── */}
      <header style={s.header} className="fade-up fade-up-1">
        <div style={s.logo}>RSK Yield Router</div>
        {address ? (
          <div style={s.walletInfo}>
            <div>
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <div style={s.walletBalance}>
              {Number(balance).toFixed(4)} tRBTC
            </div>
          </div>
        ) : (
          <button
            style={s.connectBtn}
            onClick={handleConnect}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gold-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Conectar Wallet
          </button>
        )}
      </header>

      {/* ── Headline ───────────────────── */}
      <div style={s.headline} className="fade-up fade-up-2">
        Tu Bitcoin.
        <br />
        <span style={s.headlineItalic}>Trabajando.</span>
      </div>

      {/* ── Error ──────────────────────── */}
      {error && (
        <div style={s.error} className="fade-up">
          {error}
        </div>
      )}

      {/* ── Protocol Cards ─────────────── */}
      <div style={s.cardsRow}>
        {protocols.map((p, i) => {
          const isWinner = winner?.id === p.id;
          const apyDisplay = apyValues[i];
          return (
            <div
              key={p.id}
              style={{
                ...s.card(isWinner),
                cursor: "pointer",
                ...(activeProtocol === p.id
                  ? { opacity: 1, borderColor: "var(--border-gold)" }
                  : {}),
              }}
              className={`fade-up fade-up-${i + 3}`}
              onClick={() => setSelected(p.id)}
            >
              {isWinner && <div style={s.badge}>Mejor rendimiento</div>}
              <div style={s.cardName}>{p.name}</div>
              <div style={s.cardDesc}>{p.description}</div>
              <div style={s.apyNumber}>
                {apyDisplay !== null ? `${apyDisplay.toFixed(2)}%` : "—"}
              </div>
              <div style={s.apyLabel}>APY actual</div>
            </div>
          );
        })}
      </div>

      {/* ── Calculator Section ─────────── */}
      <div style={s.calcSection} className="fade-up fade-up-5">
        <div style={s.inputRow}>
          <input
            type="number"
            step="0.0001"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={s.calcInput}
          />
          <span style={s.calcUnit}>RBTC</span>
        </div>

        {btcPrice && (
          <div style={s.btcPrice}>
            1 BTC = ${formatUsd(btcPrice)} USD
          </div>
        )}

        {activeProto && (
          <>
            <div style={s.estimateLabel}>
              Con {activeProto.name} ganarías
            </div>
            <div style={s.estimateValue}>
              ${monthlyYieldUsd && monthlyYieldUsd > 0
                ? formatUsd(monthlyYieldUsd)
                : "0.00"}{" "}
              por mes
            </div>
          </>
        )}

        {activeProtocol && activeProto && (
          <button
            style={s.depositBtn(depositing === activeProtocol)}
            disabled={depositing === activeProtocol}
            onClick={() =>
              address
                ? handleDeposit(activeProtocol)
                : handleConnect()
            }
            onMouseEnter={(e) => {
              if (depositing !== activeProtocol) {
                e.currentTarget.style.background = "#C9A84C15";
                e.currentTarget.style.boxShadow = "0 0 40px #C9A84C30";
              }
            }}
            onMouseLeave={(e) => {
              if (depositing !== activeProtocol) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {depositing === activeProtocol
              ? "Depositando..."
              : address
                ? `Depositar en ${activeProto.name} — ${activeProto.apy?.toFixed(2)}% APY`
                : `Conectar Wallet para depositar`}
          </button>
        )}
      </div>

      {/* ── Tx Hash ────────────────────── */}
      {txHash && (
        <div style={s.txBox} className="fade-up">
          Tx:{" "}
          <a
            href={`https://explorer.testnet.rsk.co/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={s.txLink}
          >
            {txHash}
          </a>
        </div>
      )}
    </main>
  );
}
