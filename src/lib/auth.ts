import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { UserRole } from "./roles";
import {
  decodeSession,
  encodeSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  type SessionUser,
} from "./session";

export type { SessionUser } from "./session";
export {
  buildSessionUser,
  createCheckinToken,
  decodeSession,
  getCheckinUrl,
  verifyCheckinToken,
} from "./session";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}

export async function setSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await decodeSession(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== role) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole("ADMIN");
}

export async function requireUser(): Promise<SessionUser> {
  return requireRole("USER");
}

export async function requireTablet(): Promise<SessionUser> {
  return requireRole("TABLET");
}

export async function getUserWithPenalty(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}
