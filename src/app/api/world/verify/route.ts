import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import {
  markWorldVerified,
  summarizeJourney,
} from "@/lib/domain/journey";
import { getJourneyStore } from "@/lib/db/store";
import { reserveNullifier } from "@/lib/world/nullifiers";

const bodySchema = z.object({
  proof: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { proof } = bodySchema.parse(await request.json().catch(() => ({})));
    let nullifier = `demo:${session.userId}`;

    if (process.env.DEMO_MODE === "false") {
      if (!proof) throw new Error("A World ID proof is required.");
      const rpId = process.env.WORLD_RP_ID;
      if (!rpId) throw new Error("WORLD_RP_ID is not configured.");
      const response = await fetch(
        `https://developer.world.org/api/v4/verify/${rpId}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(proof),
          cache: "no-store",
        },
      );
      const result = (await response.json()) as {
        success?: boolean;
        nullifier?: string;
        detail?: string;
      };
      if (!response.ok || !result.success || !result.nullifier) {
        throw new Error(result.detail ?? "World ID proof verification failed.");
      }
      nullifier = result.nullifier;
    }

    const nullifierHash = createHash("sha256")
      .update(nullifier)
      .digest("hex");
    await reserveNullifier(nullifierHash, session.userId);
    const store = getJourneyStore();
    const state = markWorldVerified(
      await store.get(session.userId),
      nullifier,
    );
    await store.save(state);
    return NextResponse.json({ state, summary: summarizeJourney(state) });
  } catch (error) {
    return apiError(error);
  }
}
