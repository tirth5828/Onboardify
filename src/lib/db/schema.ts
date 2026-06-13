import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { JourneyState } from "@/lib/domain/types";

export const journeys = pgTable(
  "journeys",
  {
    userId: text("user_id").primaryKey(),
    walletAddress: text("wallet_address"),
    state: jsonb("state").$type<JourneyState>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("journeys_wallet_idx").on(table.walletAddress)],
);

export const worldNullifiers = pgTable(
  "world_nullifiers",
  {
    nullifierHash: text("nullifier_hash").primaryKey(),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("world_nullifier_user_idx").on(table.userId)],
);
