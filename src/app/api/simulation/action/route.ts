import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import {
  applyMirrorAction,
  setWalletAddress,
  summarizeJourney,
} from "@/lib/domain/journey";
import { getJourneyStore } from "@/lib/db/store";

const bodySchema = z.object({
  action: z.enum([
    "safe_send",
    "safe_swap",
    "safe_loan",
    "accept_malicious_approval",
    "inspect_malicious_approval",
    "revoke_malicious_approval",
  ]),
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
    state = applyMirrorAction(state, body.action);
    await store.save(state);
    return NextResponse.json({ state, summary: summarizeJourney(state) });
  } catch (error) {
    return apiError(error);
  }
}
