import prisma from "@/lib/prisma";
import { CreateQuizSchema } from "@/lib/validations/quiz";
import {
  successResponse,
  withErrorHandler,
} from "@/lib/api-utils";
import { requireAuth } from "@/lib/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * GET /api/quizzes - List quizzes owned by the current user
 * Protected: Requires authentication
 */
export const GET = withErrorHandler(async () => {
  const session = await requireAuth();

  // Only return quizzes created by the logged-in user
  const quizzes = await prisma.quiz.findMany({
    where: { createdById: session.user.id },
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
export const POST = withErrorHandler(async (request: Request) => {
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await requireAuth();

  const body = await request.json();

  const validationResult = CreateQuizSchema.safeParse(body);
  if (!validationResult.success) {
    throw validationResult.error;
  }

  const { title, description, isPublished, questions } = validationResult.data;

  // Create quiz with createdById set to current user
  const quiz = await prisma.quiz.create({
    data: {
      title,
      description,
      isPublished: isPublished ?? false,
      createdById: session.user.id,
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
