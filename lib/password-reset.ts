import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getServiceKey } from "./supabase/admin";

/**
 * Proof that this browser opened a valid reset link.
 *
 * Opening the link signs the user in, but a normal signed-in session must not
 * be enough to set a new password without the old one. So after the link is
 * verified we also set this short-lived, httpOnly cookie, signed with the
 * server's secret key, and the reset page and action require it.
 */
const COOKIE = "guru_pw_reset";
const TTL_SECONDS = 15 * 60;

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function grantResetPass(userId: string) {
  const secret = getServiceKey();
  if (!secret) throw new Error("Password reset isn't configured.");
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${userId}.${exp}`;
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function hasResetPass(userId: string): Promise<boolean> {
  const secret = getServiceKey();
  if (!secret) return false;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;

  const [id, expStr, mac] = raw.split(".");
  if (!id || !expStr || !mac || id !== userId) return false;
  if (Number(expStr) < Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(sign(`${id}.${expStr}`, secret));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function clearResetPass() {
  (await cookies()).delete(COOKIE);
}
