import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth API route handler
 * Handles all auth endpoints: /api/auth/sign-in, /api/auth/sign-up, /api/auth/sign-out, etc.
 */
export const { GET, POST } = toNextJsHandler(auth);
