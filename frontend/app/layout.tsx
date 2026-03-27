import type { Metadata } from "next";
import { DM_Serif_Display, DM_Mono } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vendimia Yield — RSK Yield Aggregator",
  description:
    "Compare APYs across Tropykus, Sovryn and Money on Chain. Deposit RBTC with one click.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${dmSerif.variable} ${dmMono.variable}`}>
      <body
        style={{
          fontFamily: "var(--font-dm-mono), monospace",
          background: "#080B0F",
          color: "#F0EDE6",
        }}
      >
        {children}
      </body>
    </html>
  );
}
