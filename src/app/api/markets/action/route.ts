import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import { getJourneyStore } from "@/lib/db/store";
import { applyMarketsAction, summarizeJourney } from "@/lib/domain/journey";

const bodySchema = z.object({
  action: z.enum([
    "acknowledge_custody",
    "compare_settlement",
    "fund_account",
    "allocate",
    "exit_position",
  ]),
  instrument: z.enum(["USDC", "TBILL", "ETH", "WSTETH", "DEX_LP"]).optional(),
  amountUsd: z.number().nonnegative().max(1_000_000).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = bodySchema.parse(await request.json());
    const store = getJourneyStore();
    const state = applyMarketsAction(await store.get(session.userId), body);
    await store.save(state);
    return NextResponse.json({ state, summary: summarizeJourney(state) });
  } catch (error) {
    return apiError(error);
  }
}
