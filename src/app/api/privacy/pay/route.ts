import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import {
  completePrivacy,
  demoHash,
  summarizeJourney,
} from "@/lib/domain/journey";
import { getJourneyStore } from "@/lib/db/store";
import { getOrCreatePayer } from "@/lib/privacy/payers";

const bodySchema = z.object({
  unlinkAddress: z.string().min(8).optional(),
});

function demoUnlinkAddress(userId: string) {
  return `unlink1${createHash("sha256")
    .update(userId)
    .digest("hex")
    .slice(0, 36)}`;
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const payer = getOrCreatePayer(session.userId);
    let paymentTxHash: string = demoHash("arc-private-payment");
    let fundingTxHash: string = demoHash("unlink-private-withdrawal");
    const resourceUrl =
      process.env.X402_RESOURCE_URL ?? "/api/risk-report/premium";

    if (
      process.env.DEMO_MODE === "false" &&
      process.env.X402_RESOURCE_URL &&
      process.env.ARC_RPC_URL
    ) {
      const { GatewayClient } = await import(
        "@circle-fin/x402-batching/client"
      );
      const gateway = new GatewayClient({
        chain: "arcTestnet",
        privateKey: payer.privateKey,
        rpcUrl: process.env.ARC_RPC_URL,
      });
      const deposit = await gateway.deposit("0.08");
      const payment = await gateway.pay(process.env.X402_RESOURCE_URL);
      fundingTxHash = deposit.depositTxHash;
      paymentTxHash = payment.transaction;
    }

    const store = getJourneyStore();
    const state = completePrivacy(await store.get(session.userId), {
      unlinkAddress: body.unlinkAddress ?? demoUnlinkAddress(session.userId),
      payerAddress: payer.address,
      fundingTxHash,
      paymentTxHash,
      resourceUrl,
    });
    await store.save(state);
    return NextResponse.json({ state, summary: summarizeJourney(state) });
  } catch (error) {
    return apiError(error);
  }
}
