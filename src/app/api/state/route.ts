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
        baseContracts: Boolean(
          process.env.NEXT_PUBLIC_GUARDED_VAULT_ADDRESS &&
            process.env.NEXT_PUBLIC_PASSPORT_ADDRESS,
        ),
        unlink: Boolean(process.env.UNLINK_API_KEY),
        world: Boolean(
          process.env.NEXT_PUBLIC_WORLD_APP_ID &&
            process.env.WORLD_RP_ID &&
            process.env.WORLD_RP_SIGNING_KEY,
        ),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
