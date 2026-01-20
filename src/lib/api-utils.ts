import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standardized API Response Types
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Custom API Error class for typed error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, "BAD_REQUEST", details);
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(403, message, "FORBIDDEN");
  }

  static notFound(message = "Not found"): ApiError {
    return new ApiError(404, message, "NOT_FOUND");
  }

  static tooManyRequests(message = "Too many requests"): ApiError {
    return new ApiError(429, message, "TOO_MANY_REQUESTS");
  }

  static internal(message = "Internal server error"): ApiError {
    return new ApiError(500, message, "INTERNAL_ERROR");
  }
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Error response helper
 */
export function errorResponse(
  error: string | ApiError | ZodError | Error,
  status = 500
): NextResponse {
  // Handle ApiError
  if (error instanceof ApiError) {
    const body: Record<string, unknown> = {
      success: false,
      error: error.message,
      code: error.code,
    };
    if (error.details) {
      body.details = error.details;
    }
    return NextResponse.json(body, { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    console.error("[API Error]", error.message, error.stack);
    return NextResponse.json(
      { success: false, error: error.message },
      { status }
    );
  }

  // Handle string errors
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Route context type for routes with params
 */
export interface RouteContext<P = Record<string, string>> {
  params: Promise<P>;
}

/**
 * Wrapper for API route handlers with error handling
 * Supports both simple handlers and handlers with context (params)
 */
export function withErrorHandler<T, P = Record<string, string>>(
  handler: (request: Request, context?: RouteContext<P>) => Promise<NextResponse<T>>
) {
  return async (request: Request, context?: RouteContext<P>): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Log the error for debugging
      console.error("[API Error]", error);

      if (error instanceof ApiError) {
        return errorResponse(error);
      }

      if (error instanceof ZodError) {
        return errorResponse(error);
      }

      // Prisma errors
      if (error instanceof Error && error.name.includes("Prisma")) {
        return errorResponse(
          ApiError.badRequest("Database operation failed")
        );
      }

      // Generic error
      return errorResponse(
        ApiError.internal(
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "An unexpected error occurred"
        )
      );
    }
  };
}
