import prisma from "@/lib/prisma";
import { UpdateQuizSchema } from "@/lib/validations/quiz";
import {
  successResponse,
  withErrorHandler,
} from "@/lib/api-utils";
import { requireAuth } from "@/lib/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  getOwnedQuizWithQuestions,
  requireQuizOwnership,
  buildQuestionsCreateData,
  QUIZ_WITH_QUESTIONS_INCLUDE,
} from "@/lib/quiz-utils";

type QuizParams = { id: string };

/**
 * GET /api/quizzes/[id] - Get a single quiz by ID
 * Protected: Requires authentication, must own the quiz
 */
export const GET = withErrorHandler<unknown, QuizParams>(async (_request: Request, context) => {
  const session = await requireAuth();
  const { id } = await context!.params;

  const quiz = await getOwnedQuizWithQuestions(id, session.user.id);

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

  // Verify ownership first
  await requireQuizOwnership(id, session.user.id);

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
            create: buildQuestionsCreateData(questions),
          },
        }),
      },
      include: QUIZ_WITH_QUESTIONS_INCLUDE,
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

  // Verify ownership
  await requireQuizOwnership(id, session.user.id);

  await prisma.quiz.delete({ where: { id } });

  return successResponse({ message: "Quiz deleted successfully" });
});
