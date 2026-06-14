import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
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
