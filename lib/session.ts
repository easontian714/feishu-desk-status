import { cookies } from "next/headers";

export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt?: number;
  openId?: string;
};

const COOKIE_NAME = "desk_status_session";

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret.slice(0, 32)),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

async function encrypt(value: Session) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await secretKey(),
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return `${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
}

async function decrypt(value: string): Promise<Session | null> {
  try {
    const [ivValue, encryptedValue] = value.split(".");
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: Buffer.from(ivValue, "base64url") },
      await secretKey(),
      Buffer.from(encryptedValue, "base64url"),
    );
    return JSON.parse(new TextDecoder().decode(decrypted)) as Session;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return value ? decrypt(value) : null;
}

export async function setSession(session: Session) {
  const store = await cookies();
  store.set(COOKIE_NAME, await encrypt(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
