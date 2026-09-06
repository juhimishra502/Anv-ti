// Small helpers shared by route handlers: JSON responses, auth guard, and a
// consistent authorization-error shape. Keeps every route terse and uniform.
import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { AccessError, type User } from "@/lib/db/repo";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function error(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

/** Returns the signed-in user or throws a 401 Response. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw error("Sign in required.", 401);
  return user;
}

/** Wraps a handler so thrown Responses and AccessErrors become clean HTTP responses. */
export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof AccessError) return error("Not authorized for this case.", 403);
    console.error("[api] unhandled error", err);
    return error("Something went wrong.", 500);
  }
}
