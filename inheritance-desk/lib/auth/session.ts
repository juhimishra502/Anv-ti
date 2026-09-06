// Session handling. Milestone 1 uses a server-side session row (in the real DB)
// referenced by an httpOnly cookie. Access to a demo account is CLEARLY LABELLED as
// demo in the UI — it is not presented as real government authentication.
// getCurrentUser() is the seam if this is later swapped for a hosted auth provider.
import "server-only";
import { cookies } from "next/headers";
import { createSession, deleteSession, getSessionUser, type User } from "@/lib/db/repo";

export const SESSION_COOKIE = "id_session";

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  return getSessionUser(sid);
}

export async function startSession(userId: string): Promise<void> {
  const sid = await createSession(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (sid) await deleteSession(sid);
  store.delete(SESSION_COOKIE);
}
