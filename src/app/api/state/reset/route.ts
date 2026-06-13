import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import { normalizeJourney, summarizeJourney } from "@/lib/domain/journey";
import { getJourneyStore } from "@/lib/db/store";

export async function POST() {
  try {
    const session = await requireSession();
    const state = normalizeJourney(
      await getJourneyStore().reset(session.userId),
    );
    return NextResponse.json({ state, summary: summarizeJourney(state) });
  } catch (error) {
    return apiError(error);
  }
}
