import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import { summarizeJourney } from "@/lib/domain/journey";
import { getJourneyStore } from "@/lib/db/store";

export async function GET() {
  try {
    const session = await requireSession();
    const state = await getJourneyStore().get(session.userId);
    return NextResponse.json({
      state,
      summary: summarizeJourney(state),
      session,
      integrations: {
        dynamic: Boolean(process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID),
        database: Boolean(process.env.DATABASE_URL),
        guardedVault: Boolean(process.env.NEXT_PUBLIC_GUARDED_VAULT_ADDRESS),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
