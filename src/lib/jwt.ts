import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@kleeblatt/shared";
import { env, sessionCookie } from "../config/env.js";

function secretKey() {
  return new TextEncoder().encode(env.sessionSecret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    displayName: user.displayName,
    picture: user.picture,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(`${sessionCookie.ttlSeconds}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!userId || !email) return null;
    return {
      userId,
      email,
      displayName: typeof payload.displayName === "string" ? payload.displayName : null,
      picture: typeof payload.picture === "string" ? payload.picture : null,
    };
  } catch {
    return null;
  }
}
