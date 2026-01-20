import prisma from "@/lib/prisma";
import { CreateQuizSchema } from "@/lib/validations/quiz";
import {
  successResponse,
  withErrorHandler,
  RouteContext,
} from "@/lib/api-utils";
import { requireAuth } from "@/lib/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * GET /api/quizzes - List all quizzes
 * Protected: Requires authentication
 */
export const GET = withErrorHandler(async () => {
  // Require authentication for listing quizzes
  await requireAuth();

  const quizzes = await prisma.quiz.findMany({
    include: {
      _count: {
        select: { questions: true, attempts: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse(quizzes);
});

/**
 * POST /api/quizzes - Create a new quiz with questions
 * Protected: Requires authentication
 * Rate limited: 30 requests per minute
 */
export const POST = withErrorHandler(async (request: Request, _context?: RouteContext) => {
  // Rate limit check
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.admin);
  if (rateLimitResponse) return rateLimitResponse;

  // Require authentication
  await requireAuth();

  const body = await request.json();

  // Validate with Zod (throws ZodError if invalid)
  const validationResult = CreateQuizSchema.safeParse(body);
  if (!validationResult.success) {
    throw validationResult.error;
  }

  const { title, description, isPublished, questions } = validationResult.data;

  // Create quiz with questions and options in a transaction
  const quiz = await prisma.quiz.create({
    data: {
      title,
      description,
      isPublished: isPublished ?? false,
      questions: {
        create: questions.map((q, index) => ({
          text: q.text,
          type: q.type,
          order: q.order ?? index,
          correctAnswer: q.correctAnswer,
          options: q.options
            ? {
              create: q.options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
              })),
            }
            : undefined,
        })),
      },
    },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: "asc" },
      },
    },
  });

  return successResponse(quiz, 201);
});
