import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ApiError } from "@/lib/api-utils";

/**
 * Get the current session from the request
 * Returns null if not authenticated
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Require authentication - throws if not authenticated
 * Use in protected API routes
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    throw ApiError.unauthorized("You must be logged in to access this resource");
  }

  return session;
}

/**
 * Check if user is authenticated (boolean)
 * Use for conditional logic
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}
