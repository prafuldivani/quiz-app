import prisma from "@/lib/prisma";
import {
  successResponse,
  withErrorHandler,
  ApiError,
} from "@/lib/api-utils";
import { requireAuth } from "@/lib/session";

type AttemptsParams = { id: string };

/**
 * GET /api/quizzes/[id]/attempts - Get all attempts for a quiz
 * Protected: Requires authentication, must own the quiz
 */
export const GET = withErrorHandler<unknown, AttemptsParams>(async (_request: Request, context) => {
  const session = await requireAuth();
  const { id } = await context!.params;

  // Verify quiz exists and user owns it
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: { id: true, createdById: true, title: true },
  });

  if (!quiz) {
    throw ApiError.notFound("Quiz not found");
  }

  if (quiz.createdById !== session.user.id) {
    throw ApiError.forbidden("You don't have permission to view these attempts");
  }

  // Get all attempts for this quiz
  const attempts = await prisma.attempt.findMany({
    where: { quizId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      participantName: true,
      score: true,
      totalPoints: true,
      createdAt: true,
    },
  });

  return successResponse({
    quizId: quiz.id,
    quizTitle: quiz.title,
    attempts: attempts.map((a) => ({
      ...a,
      percentage: a.totalPoints > 0 ? Math.round((a.score / a.totalPoints) * 100) : 0,
    })),
  });
});
