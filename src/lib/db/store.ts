import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { createJourney, normalizeJourney } from "@/lib/domain/journey";
import type { JourneyState } from "@/lib/domain/types";

import { journeys } from "./schema";

interface JourneyStore {
  get(userId: string): Promise<JourneyState>;
  save(state: JourneyState): Promise<JourneyState>;
  reset(userId: string): Promise<JourneyState>;
}

class MemoryJourneyStore implements JourneyStore {
  private states = new Map<string, JourneyState>();

  async get(userId: string) {
    const state = this.states.get(userId) ?? createJourney(userId);
    this.states.set(userId, state);
    return normalizeJourney(structuredClone(state));
  }

  async save(state: JourneyState) {
    this.states.set(state.userId, structuredClone(state));
    return structuredClone(state);
  }

  async reset(userId: string) {
    const state = createJourney(userId);
    this.states.set(userId, state);
    return structuredClone(state);
  }
}

class NeonJourneyStore implements JourneyStore {
  private db;

  constructor(databaseUrl: string) {
    this.db = drizzle(neon(databaseUrl));
  }

  async get(userId: string) {
    const [row] = await this.db
      .select()
      .from(journeys)
      .where(eq(journeys.userId, userId))
      .limit(1);
    if (row) return normalizeJourney(row.state);
    return this.save(createJourney(userId));
  }

  async save(state: JourneyState) {
    await this.db
      .insert(journeys)
      .values({
        userId: state.userId,
        walletAddress: state.walletAddress,
        state,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: journeys.userId,
        set: {
          walletAddress: state.walletAddress,
          state,
          updatedAt: new Date(),
        },
      });
    return state;
  }

  async reset(userId: string) {
    return this.save(createJourney(userId));
  }
}

declare global {
  var __mainnetReadyStore: JourneyStore | undefined;
  var __mainnetReadyStoreVersion: number | undefined;
}

export function getJourneyStore(): JourneyStore {
  if (
    globalThis.__mainnetReadyStore &&
    globalThis.__mainnetReadyStoreVersion === 2
  ) {
    return globalThis.__mainnetReadyStore;
  }
  globalThis.__mainnetReadyStore = process.env.DATABASE_URL
    ? new NeonJourneyStore(process.env.DATABASE_URL)
    : new MemoryJourneyStore();
  globalThis.__mainnetReadyStoreVersion = 2;
  return globalThis.__mainnetReadyStore;
}
