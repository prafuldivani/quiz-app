import prisma from "@/lib/prisma";
import {
  successResponse,
  withErrorHandler,
} from "@/lib/api-utils";
import { requireAuth } from "@/lib/session";
import { requireQuizOwnership, calculatePercentage } from "@/lib/quiz-utils";

type AttemptsParams = { id: string };

/**
 * GET /api/quizzes/[id]/attempts - Get all attempts for a quiz
 * Protected: Requires authentication, must own the quiz
 */
export const GET = withErrorHandler<unknown, AttemptsParams>(async (_request: Request, context) => {
  const session = await requireAuth();
  const { id } = await context!.params;

  // Verify ownership
  const quiz = await requireQuizOwnership(id, session.user.id);

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
      percentage: calculatePercentage(a.score, a.totalPoints),
    })),
  });
});
