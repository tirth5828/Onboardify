import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  const message =
    error instanceof ZodError
      ? error.issues[0]?.message
      : error instanceof Error
        ? error.message
        : "Unexpected request failure.";
  const status =
    message === "Authentication required." ? 401 : message.includes("required") ? 403 : 400;
  return NextResponse.json({ error: message }, { status });
}
