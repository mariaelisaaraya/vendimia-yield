import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const yields = {
    tropykus: 4.82,
    sovryn: 3.15,
    moneyonchain: 2.47,
  };

  return NextResponse.json(yields);
}
