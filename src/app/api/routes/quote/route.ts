import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api";
import { fetchLifiQuote } from "@/lib/lifi";

const bodySchema = z.object({
  fromChain: z.number().int().positive(),
  toChain: z.number().int().positive(),
  fromToken: z.string().max(16),
  toToken: z.string().max(16),
  fromAmountUnits: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .max(30),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const result = await fetchLifiQuote(body).catch(() => null);
    if (!result) {
      return NextResponse.json(
        { error: "Route resolution failed" },
        { status: 502 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
