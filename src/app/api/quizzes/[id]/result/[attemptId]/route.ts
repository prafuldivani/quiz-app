import prisma from "@/lib/prisma";
import {
  successResponse,
  withErrorHandler,
  ApiError,
} from "@/lib/api-utils";

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
        include: {
          questions: {
            include: { options: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!attempt || attempt.quizId !== id) {
    throw ApiError.notFound("Result not found");
  }

  // Build the result response
  const answers = attempt.answers as Record<string, string>;
  const resultAnswers = attempt.quiz.questions.map((question) => {
    const userAnswer = answers[question.id] || "";
    let isCorrect = false;
    let correctAnswer: string | null = null;
    let correctAnswerText: string | null = null;
    let userAnswerText: string | null = null;

    if (question.type === "MCQ" || question.type === "TRUE_FALSE") {
      const correctOption = question.options.find((opt) => opt.isCorrect);
      const userOption = question.options.find((opt) => opt.id === userAnswer);

      correctAnswer = correctOption?.id || null;
      correctAnswerText = correctOption?.text || null;
      userAnswerText = userOption?.text || null;
      isCorrect = userAnswer === correctAnswer;
    } else if (question.type === "TEXT") {
      correctAnswer = question.correctAnswer;
      correctAnswerText = question.correctAnswer;
      userAnswerText = userAnswer;
    }

    return {
      questionId: question.id,
      questionText: question.text,
      type: question.type,
      userAnswer,
      userAnswerText,
      correctAnswer,
      correctAnswerText,
      isCorrect,
      options: question.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
    };
  });

  return successResponse({
    attemptId: attempt.id,
    quizId: attempt.quizId,
    quizTitle: attempt.quiz.title,
    participantName: attempt.participantName,
    score: attempt.score,
    totalPoints: attempt.totalPoints,
    percentage:
      attempt.totalPoints > 0
        ? Math.round((attempt.score / attempt.totalPoints) * 100)
        : 0,
    completedAt: attempt.createdAt,
    answers: resultAnswers,
  });
});
