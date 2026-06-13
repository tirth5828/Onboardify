import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { worldNullifiers } from "@/lib/db/schema";

declare global {
  var __mainnetReadyNullifiers: Map<string, string> | undefined;
}

const memoryNullifiers =
  globalThis.__mainnetReadyNullifiers ??
  (globalThis.__mainnetReadyNullifiers = new Map<string, string>());

export async function reserveNullifier(
  nullifierHash: string,
  userId: string,
) {
  if (!process.env.DATABASE_URL) {
    const owner = memoryNullifiers.get(nullifierHash);
    if (owner && owner !== userId) {
      throw new Error("This World ID has already claimed a passport.");
    }
    memoryNullifiers.set(nullifierHash, userId);
    return;
  }

  const db = drizzle(neon(process.env.DATABASE_URL));
  try {
    await db.insert(worldNullifiers).values({ nullifierHash, userId });
  } catch {
    throw new Error("This World ID or account has already claimed a passport.");
  }
}
