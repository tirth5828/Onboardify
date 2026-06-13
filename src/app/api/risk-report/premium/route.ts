import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    title: "Mainnet Ready risk brief",
    findings: [
      "Never grant unlimited token approval to an unverified spender.",
      "A health factor near 1.0 can become a liquidation during volatility.",
      "Private payment tools reduce linkability but timing and amount correlation still matter.",
    ],
    issuedAt: new Date().toISOString(),
  });
}
