import prisma from "@/lib/prisma";
import { SubmitQuizSchema } from "@/lib/validations/quiz";
import {
  successResponse,
  withErrorHandler,
  ApiError,
} from "@/lib/api-utils";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getQuizOrFail, calculateQuizScore } from "@/lib/quiz-utils";

type SubmitParams = { id: string };

/**
 * POST /api/quizzes/[id]/submit - Submit quiz answers
 * Public: No authentication required
 * Rate limited: 10 submissions per minute to prevent spam
 */
export const POST = withErrorHandler<unknown, SubmitParams>(async (request: Request, context) => {
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.quizSubmit);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await context!.params;
  const body = await request.json();

  // Validate request body
  const validationResult = SubmitQuizSchema.safeParse(body);
  if (!validationResult.success) {
    throw validationResult.error;
  }

  const { participantName, answers } = validationResult.data;

  // Fetch quiz with questions
  const quiz = await getQuizOrFail(id);

  // Check if quiz is published
  if (!quiz.isPublished) {
    throw ApiError.forbidden("Quiz is not available for submission");
  }

  // Calculate score using shared utility
  const scoreResult = calculateQuizScore(quiz.questions, answers);

  // Save the attempt in a transaction
  const attempt = await prisma.attempt.create({
    data: {
      quizId: id,
      participantName,
      answers,
      score: scoreResult.score,
      totalPoints: scoreResult.totalPoints,
    },
  });

  return successResponse({
    attemptId: attempt.id,
    participantName,
    ...scoreResult,
  });
});
