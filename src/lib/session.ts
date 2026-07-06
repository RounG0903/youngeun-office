import type { UserRole } from "./roles";

export const SESSION_COOKIE = "yo_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  name: string;
  role: UserRole;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set to at least 16 characters");
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBase64Url(value: string): string {
  return toBase64Url(new TextEncoder().encode(value));
}

function base64UrlToString(value: string): string {
  return new TextDecoder().decode(fromBase64Url(value));
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

let hmacKeyPromise: Promise<CryptoKey> | null = null;

function getHmacKey(): Promise<CryptoKey> {
  if (!hmacKeyPromise) {
    hmacKeyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }
  return hmacKeyPromise;
}

async function signPayload(payload: string): Promise<string> {
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

export async function encodeSession(user: SessionUser): Promise<string> {
  const payload = stringToBase64Url(JSON.stringify(user));
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function decodeSession(token: string): Promise<SessionUser | null> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = await signPayload(payload);
  if (!timingSafeEqualString(signature, expected)) {
    return null;
  }

  try {
    return JSON.parse(base64UrlToString(payload)) as SessionUser;
  } catch {
    return null;
  }
}

export function buildSessionUser(user: {
  id: string;
  name: string;
  role: UserRole;
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
  };
}

export async function createCheckinToken(reservationId: string): Promise<string> {
  return signPayload(reservationId);
}

export async function verifyCheckinToken(reservationId: string, token: string): Promise<boolean> {
  const expected = await signPayload(reservationId);
  return timingSafeEqualString(token, expected);
}

export async function getCheckinUrl(reservationId: string, baseUrl: string): Promise<string> {
  const token = await createCheckinToken(reservationId);
  return `${baseUrl}/checkin/${reservationId}?token=${token}`;
}
