import { NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";

/**
 * Simple in-memory rate limiter
 * For production, use Redis or similar persistent store
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Maximum number of requests in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Identifier for the rate limit (e.g., 'quiz-submit') */
  identifier?: string;
}

/**
 * Rate limit a request
 * Returns null if allowed, NextResponse if rate limited
 */
export function rateLimit(
  request: Request,
  config: RateLimitConfig
): NextResponse | null {
  const { limit, windowSeconds, identifier = "default" } = config;

  // Get client IP from headers or fallback
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  const key = `${identifier}:${ip}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
    return null; // Allowed
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    const response = errorResponse(
      ApiError.tooManyRequests("Too many requests, please slow down")
    );

    response.headers.set("Retry-After", retryAfter.toString());
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("X-RateLimit-Reset", entry.resetTime.toString());

    return response;
  }

  return null; // Allowed
}

/**
 * Default rate limit configs for different endpoints
 */
export const RATE_LIMITS = {
  // General API endpoints
  api: { limit: 100, windowSeconds: 60 },

  // Quiz submission (prevent spam)
  quizSubmit: { limit: 10, windowSeconds: 60, identifier: "quiz-submit" },

  // Auth endpoints (prevent brute force)
  auth: { limit: 5, windowSeconds: 60, identifier: "auth" },

  // Admin operations
  admin: { limit: 30, windowSeconds: 60, identifier: "admin" },
} as const;
