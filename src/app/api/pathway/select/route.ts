import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import { getJourneyStore } from "@/lib/db/store";
import { selectPathway, summarizeJourney } from "@/lib/domain/journey";

const bodySchema = z.object({
  pathway: z.enum(["onchain", "markets"]),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = bodySchema.parse(await request.json());
    const store = getJourneyStore();
    const state = selectPathway(await store.get(session.userId), body.pathway);
    await store.save(state);
    return NextResponse.json({ state, summary: summarizeJourney(state) });
  } catch (error) {
    return apiError(error);
  }
}
