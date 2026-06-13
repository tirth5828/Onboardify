import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { getUnlinkRoutes } from "@/lib/unlink/routes";

export async function POST(request: Request) {
  try {
    if (process.env.DEMO_MODE !== "false") {
      return new NextResponse(null, { status: 204 });
    }
    return getUnlinkRoutes().register(request);
  } catch (error) {
    return apiError(error);
  }
}
