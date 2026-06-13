import { cookies, headers } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AppSession {
  userId: string;
  email: string | null;
  mode: "demo" | "dynamic";
}

export async function requireSession(): Promise<AppSession> {
  const requestHeaders = await headers();
  const authorization = requestHeaders.get("authorization");

  if (authorization?.startsWith("Bearer ") && process.env.DYNAMIC_JWKS_URL) {
    const token = authorization.slice("Bearer ".length);
    const jwks = createRemoteJWKSet(new URL(process.env.DYNAMIC_JWKS_URL));
    const { payload } = await jwtVerify(token, jwks);
    if (!payload.sub) throw new Error("Dynamic token is missing a subject.");
    return {
      userId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      mode: "dynamic",
    };
  }

  const cookieStore = await cookies();
  const demoId = cookieStore.get("mr_demo_session")?.value;
  if (demoId || process.env.DEMO_MODE !== "false") {
    return {
      userId: demoId ?? "demo-pioneer",
      email: "pioneer@mainnet.ready",
      mode: "demo",
    };
  }

  throw new Error("Authentication required.");
}
