import { NextResponse } from "next/server";

// TODO: integrar con APIs reales de cada protocolo para obtener APYs on-chain
// Por ahora retorna valores mock para desarrollo

export const dynamic = "force-dynamic";

export async function GET() {
  const yields = {
    tropykus: 4.82,
    sovryn: 3.15,
    moneyonchain: 2.47,
  };

  return NextResponse.json(yields);
}
