import prisma from "@/lib/prisma";
import {
  successResponse,
  withErrorHandler,
  ApiError,
} from "@/lib/api-utils";

type QuizParams = { id: string };

/**
 * GET /api/public/quizzes/[id] - Get a published quiz for public taking
 * Public: No authentication required
 * 
 * Note: This is separate from /api/quizzes/[id] which requires auth
 * This endpoint only returns published quizzes and hides correct answers
 */
export const GET = withErrorHandler<unknown, QuizParams>(async (_request: Request, context) => {
  const { id } = await context!.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          options: {
            select: {
              id: true,
              text: true,
              // Note: isCorrect is NOT included - hidden from public
            }
          }
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!quiz) {
    throw ApiError.notFound("Quiz not found");
  }

  // Only published quizzes can be taken publicly
  if (!quiz.isPublished) {
    throw ApiError.notFound("Quiz not found");
  }

  // Return quiz without revealing correct answers
  return successResponse({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    questions: quiz.questions.map((q: any) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      order: q.order,
      options: q.options,
    })),
  });
});
