import prisma from "@/lib/prisma";
import { UpdateQuizSchema } from "@/lib/validations/quiz";
import {
  successResponse,
  withErrorHandler,
  ApiError,
} from "@/lib/api-utils";
import { requireAuth } from "@/lib/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

type QuizParams = { id: string };

/**
 * GET /api/quizzes/[id] - Get a single quiz by ID
 * Protected: Requires authentication, must own the quiz
 */
export const GET = withErrorHandler<unknown, QuizParams>(async (_request: Request, context) => {
  const session = await requireAuth();
  const { id } = await context!.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!quiz) {
    throw ApiError.notFound("Quiz not found");
  }

  // Verify ownership
  if (quiz.createdById !== session.user.id) {
    throw ApiError.forbidden("You don't have permission to access this quiz");
  }

  return successResponse(quiz);
});

/**
 * PUT /api/quizzes/[id] - Update a quiz
 * Protected: Requires authentication, must own the quiz
 */
export const PUT = withErrorHandler<unknown, QuizParams>(async (request: Request, context) => {
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await requireAuth();
  const { id } = await context!.params;
  const body = await request.json();

  // Check if quiz exists
  const existingQuiz = await prisma.quiz.findUnique({ where: { id } });
  if (!existingQuiz) {
    throw ApiError.notFound("Quiz not found");
  }

  // Verify ownership
  if (existingQuiz.createdById !== session.user.id) {
    throw ApiError.forbidden("You don't have permission to edit this quiz");
  }

  // Validate request body
  const validationResult = UpdateQuizSchema.safeParse(body);
  if (!validationResult.success) {
    throw validationResult.error;
  }

  const { title, description, isPublished, questions } = validationResult.data;

  // Update quiz in a transaction
  const quiz = await prisma.$transaction(async (tx) => {
    if (questions) {
      await tx.question.deleteMany({ where: { quizId: id } });
    }

    return tx.quiz.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(isPublished !== undefined && { isPublished }),
        ...(questions && {
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
        }),
      },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: "asc" },
        },
      },
    });
  });

  return successResponse(quiz);
});

/**
 * DELETE /api/quizzes/[id] - Delete a quiz
 * Protected: Requires authentication, must own the quiz
 */
export const DELETE = withErrorHandler<unknown, QuizParams>(async (request: Request, context) => {
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await requireAuth();
  const { id } = await context!.params;

  // Check if quiz exists
  const existingQuiz = await prisma.quiz.findUnique({ where: { id } });
  if (!existingQuiz) {
    throw ApiError.notFound("Quiz not found");
  }

  // Verify ownership
  if (existingQuiz.createdById !== session.user.id) {
    throw ApiError.forbidden("You don't have permission to delete this quiz");
  }

  await prisma.quiz.delete({ where: { id } });

  return successResponse({ message: "Quiz deleted successfully" });
});
