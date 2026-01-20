import prisma from "@/lib/prisma";
import { SubmitQuizSchema } from "@/lib/validations/quiz";
import { QuizResult } from "@/types";
import {
  successResponse,
  withErrorHandler,
  ApiError,
  RouteContext,
} from "@/lib/api-utils";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

type SubmitParams = { id: string };

/**
 * POST /api/quizzes/[id]/submit - Submit quiz answers
 * Public: No authentication required
 * Rate limited: 10 submissions per minute to prevent spam
 */
export const POST = withErrorHandler<unknown, SubmitParams>(async (request: Request, context) => {
  // Rate limit quiz submissions to prevent spam
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

  // Fetch quiz with questions and options
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

  // Check if quiz is published
  if (!quiz.isPublished) {
    throw ApiError.forbidden("Quiz is not available for submission");
  }

  // Calculate score
  let score = 0;
  let totalPoints = 0;
  const resultAnswers: QuizResult["answers"] = [];

  for (const question of quiz.questions) {
    const userAnswer = answers[question.id] || "";
    let isCorrect = false;
    let correctAnswer: string | null = null;

    // Only MCQ and TRUE_FALSE are scored
    if (question.type === "MCQ" || question.type === "TRUE_FALSE") {
      totalPoints += 1;

      // Find the correct option
      const correctOption = question.options.find((opt) => opt.isCorrect);
      correctAnswer = correctOption?.id || null;

      if (userAnswer && correctOption && userAnswer === correctOption.id) {
        isCorrect = true;
        score += 1;
      }
    } else if (question.type === "TEXT") {
      // TEXT questions are not scored, just recorded
      correctAnswer = question.correctAnswer;
    }

    resultAnswers.push({
      questionId: question.id,
      questionText: question.text,
      userAnswer,
      correctAnswer,
      isCorrect,
      type: question.type,
    });
  }

  // Save the attempt with participant name
  const attempt = await prisma.attempt.create({
    data: {
      quizId: id,
      participantName,
      answers: answers,
      score,
      totalPoints,
    },
  });

  const result: QuizResult & { attemptId: string; participantName: string } = {
    score,
    totalPoints,
    percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
    attemptId: attempt.id,
    participantName,
    answers: resultAnswers,
  };

  return successResponse(result);
});
