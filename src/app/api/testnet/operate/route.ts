import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import { getJourneyStore } from "@/lib/db/store";
import {
  applyTestnetOperation,
  setWalletAddress,
  summarizeJourney,
} from "@/lib/domain/journey";

const bodySchema = z.object({
  operation: z.enum([
    "transfer",
    "swap",
    "supply",
    "borrow",
    "approve",
    "inspect",
    "revoke",
    "stake",
    "bridge",
  ]),
  network: z.enum(["base-sepolia", "arc-testnet"]),
  protocol: z.string().max(80).optional(),
  asset: z.string().max(16).optional(),
  targetAsset: z.string().max(16).optional(),
  amount: z.number().nonnegative().max(1_000_000).optional(),
  slippage: z.number().min(0.01).max(50).optional(),
  healthFactor: z.number().min(0.5).max(10).optional(),
  recipient: z.string().max(100).optional(),
  unlimited: z.boolean().optional(),
  trusted: z.boolean().optional(),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = bodySchema.parse(await request.json());
    const store = getJourneyStore();
    let state = await store.get(session.userId);
    if (body.walletAddress) {
      state = setWalletAddress(state, body.walletAddress);
    }
    state = applyTestnetOperation(state, body);
    await store.save(state);
    return NextResponse.json({ state, summary: summarizeJourney(state) });
  } catch (error) {
    return apiError(error);
  }
}
