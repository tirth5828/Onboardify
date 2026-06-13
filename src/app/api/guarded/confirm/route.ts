import { NextResponse } from "next/server";
import { createPublicClient, http, isHash } from "viem";
import { baseSepolia } from "viem/chains";
import { z } from "zod";

import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import {
  applyGuardedAction,
  summarizeJourney,
} from "@/lib/domain/journey";
import { getJourneyStore } from "@/lib/db/store";

const bodySchema = z.object({
  action: z.enum(["cancel_flagged", "execute_safe"]),
  intentId: z.string().optional(),
  txHash: z.string().optional(),
});

async function verifyConfiguredTransaction(txHash?: string) {
  if (process.env.DEMO_MODE !== "false") return;
  if (!txHash || !isHash(txHash)) throw new Error("A transaction hash is required.");
  const contract = process.env.NEXT_PUBLIC_GUARDED_VAULT_ADDRESS?.toLowerCase();
  if (!contract) throw new Error("Guarded vault address is not configured.");
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL),
  });
  const [transaction, receipt] = await Promise.all([
    client.getTransaction({ hash: txHash }),
    client.getTransactionReceipt({ hash: txHash }),
  ]);
  if (receipt.status !== "success" || transaction.to?.toLowerCase() !== contract) {
    throw new Error("The Base Sepolia vault transaction could not be verified.");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = bodySchema.parse(await request.json());
    await verifyConfiguredTransaction(body.txHash);
    const store = getJourneyStore();
    const state = applyGuardedAction(
      await store.get(session.userId),
      body.action,
      body,
    );
    await store.save(state);
    return NextResponse.json({ state, summary: summarizeJourney(state) });
  } catch (error) {
    return apiError(error);
  }
}
