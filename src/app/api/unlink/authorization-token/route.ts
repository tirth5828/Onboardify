import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { getUnlinkRoutes } from "@/lib/unlink/routes";

export async function POST(request: Request) {
  try {
    if (process.env.DEMO_MODE !== "false") {
      return NextResponse.json({
        token: "demo.authorization.token",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
    }
    return getUnlinkRoutes().authorizationToken(request);
  } catch (error) {
    return apiError(error);
  }
}
