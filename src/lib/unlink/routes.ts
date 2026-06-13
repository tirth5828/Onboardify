import {
  createUnlinkAdmin,
  createUnlinkAuthRoutes,
} from "@unlink-xyz/sdk/admin";

import { requireSession, type AppSession } from "@/lib/auth/session";

declare global {
  var __mainnetReadyUnlinkOwners: Map<string, string> | undefined;
}

const owners =
  globalThis.__mainnetReadyUnlinkOwners ??
  (globalThis.__mainnetReadyUnlinkOwners = new Map<string, string>());

export function getUnlinkRoutes() {
  if (!process.env.UNLINK_API_KEY) {
    throw new Error("UNLINK_API_KEY is required for live Unlink routes.");
  }

  const admin = createUnlinkAdmin({
    environment: "arc-testnet",
    apiKey: process.env.UNLINK_API_KEY,
  });

  return createUnlinkAuthRoutes<AppSession>({
    admin,
    authenticate: async () => requireSession(),
    onRegister: async ({ session, registration }) => {
      owners.set(registration.address, session.userId);
    },
    authorizeUnlinkAddress: async ({ session, unlinkAddress }) =>
      owners.get(unlinkAddress) === session.userId,
    authorizeUserStorage: async ({ session, userId }) =>
      session.userId === userId,
  });
}
