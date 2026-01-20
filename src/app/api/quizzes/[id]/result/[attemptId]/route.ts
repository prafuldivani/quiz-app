import prisma from "@/lib/prisma";
import {
  successResponse,
  withErrorHandler,
  ApiError,
} from "@/lib/api-utils";
import { calculateQuizScore, QUIZ_WITH_QUESTIONS_INCLUDE } from "@/lib/quiz-utils";

type ResultParams = { id: string; attemptId: string };

/**
 * GET /api/quizzes/[id]/result/[attemptId] - Get attempt result (public)
 * Public: No authentication required - used for shareable results
 */
export const GET = withErrorHandler<unknown, ResultParams>(async (_request: Request, context) => {
  const { id, attemptId } = await context!.params;

  // Fetch the attempt with quiz details
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: QUIZ_WITH_QUESTIONS_INCLUDE,
      },
    },
  });

  if (!attempt || attempt.quizId !== id) {
    throw ApiError.notFound("Result not found");
  }

  // Calculate score using shared utility
  const userAnswers = attempt.answers as Record<string, string>;
  const scoreResult = calculateQuizScore(attempt.quiz.questions, userAnswers);

  return successResponse({
    attemptId: attempt.id,
    quizId: attempt.quizId,
    quizTitle: attempt.quiz.title,
    participantName: attempt.participantName,
    score: attempt.score,
    totalPoints: attempt.totalPoints,
    percentage: scoreResult.percentage,
    completedAt: attempt.createdAt,
    answers: scoreResult.answers,
  });
});
