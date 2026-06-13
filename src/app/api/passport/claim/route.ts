import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";
import { PASSPORT_ABI } from "@/lib/contracts";
import {
  demoHash,
  markPassportClaimed,
  summarizeJourney,
} from "@/lib/domain/journey";
import { getJourneyStore } from "@/lib/db/store";

function skillMask(skills: string[]) {
  return skills.reduce((mask, _skill, index) => mask | (1 << index), 0);
}

export async function POST() {
  try {
    const session = await requireSession();
    const store = getJourneyStore();
    let state = await store.get(session.userId);
    const summary = summarizeJourney(state);
    if (!summary.passportEligible || !state.world.verified) {
      throw new Error("Readiness score and World ID verification are required.");
    }

    let txHash = demoHash("passport-mint");
    let tokenId = "1";

    if (process.env.DEMO_MODE === "false") {
      const address = process.env.NEXT_PUBLIC_PASSPORT_ADDRESS;
      const privateKey = process.env.RELAYER_PRIVATE_KEY as Hex | undefined;
      if (!address || !isAddress(address) || !privateKey || !state.walletAddress) {
        throw new Error("Passport relayer configuration is incomplete.");
      }
      const account = privateKeyToAccount(privateKey);
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(process.env.BASE_SEPOLIA_RPC_URL),
      });
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(process.env.BASE_SEPOLIA_RPC_URL),
      });
      txHash = await walletClient.writeContract({
        address,
        abi: PASSPORT_ABI,
        functionName: "mint",
        args: [
          state.walletAddress as `0x${string}`,
          `0x${state.world.nullifierHash}` as Hex,
          summary.score,
          skillMask(summary.skills),
        ],
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      tokenId = receipt.blockNumber.toString();
    }

    state = markPassportClaimed(state, { tokenId, txHash });
    await store.save(state);
    return NextResponse.json({ state, summary: summarizeJourney(state) });
  } catch (error) {
    return apiError(error);
  }
}
