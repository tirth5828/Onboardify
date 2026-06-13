import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { signRequest } from "@worldcoin/idkit/signing";

import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/session";

const ACTION = "mainnet-ready-passport";

export async function GET() {
  try {
    await requireSession();
    const rpId = process.env.WORLD_RP_ID ?? "rp_demo_mainnet_ready";
    if (process.env.WORLD_RP_SIGNING_KEY && process.env.WORLD_RP_ID) {
      const signature = signRequest({
        signingKeyHex: process.env.WORLD_RP_SIGNING_KEY,
        action: ACTION,
        ttl: 5 * 60,
      });
      return NextResponse.json({
        appId: process.env.NEXT_PUBLIC_WORLD_APP_ID,
        action: ACTION,
        rpContext: {
          rp_id: rpId,
          nonce: signature.nonce,
          created_at: signature.createdAt,
          expires_at: signature.expiresAt,
          signature: signature.sig,
        },
      });
    }

    const createdAt = Math.floor(Date.now() / 1000);
    return NextResponse.json({
      appId: "app_demo_mainnet_ready",
      action: ACTION,
      rpContext: {
        rp_id: rpId,
        nonce: `0x${randomBytes(32).toString("hex")}`,
        created_at: createdAt,
        expires_at: createdAt + 300,
        signature: `0x${randomBytes(65).toString("hex")}`,
      },
      demo: true,
    });
  } catch (error) {
    return apiError(error);
  }
}
