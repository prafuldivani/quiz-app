import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import type { Prisma } from "@prisma/client";

// ==================== PRISMA INCLUDES ====================

/**
 * Standard include for fetching quiz with questions and options
 */
export const QUIZ_WITH_QUESTIONS_INCLUDE = {
  questions: {
    include: { options: true },
    orderBy: { order: "asc" },
  },
} satisfies Prisma.QuizInclude;

/**
 * Minimal include for ownership checks
 */
export const QUIZ_OWNERSHIP_SELECT = {
  id: true,
  title: true,
  createdById: true,
  isPublished: true,
} satisfies Prisma.QuizSelect;

// ==================== QUIZ FETCHING ====================

/**
 * Fetch a quiz by ID or throw not found error
 */
export async function getQuizOrFail(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: QUIZ_WITH_QUESTIONS_INCLUDE,
  });

  if (!quiz) {
    throw ApiError.notFound("Quiz not found");
  }

  return quiz;
}

/**
 * Fetch a quiz and verify the user owns it
 * @throws ApiError.notFound if quiz doesn't exist
 * @throws ApiError.forbidden if user doesn't own the quiz
 */
export async function requireQuizOwnership(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: QUIZ_OWNERSHIP_SELECT,
  });

  if (!quiz) {
    throw ApiError.notFound("Quiz not found");
  }

  if (quiz.createdById !== userId) {
    throw ApiError.forbidden("You don't have permission to access this quiz");
  }

  return quiz;
}

/**
 * Fetch a quiz with full details and verify ownership
 */
export async function getOwnedQuizWithQuestions(quizId: string, userId: string) {
  const quiz = await getQuizOrFail(quizId);

  if (quiz.createdById !== userId) {
    throw ApiError.forbidden("You don't have permission to access this quiz");
  }

  return quiz;
}

// ==================== QUESTION MAPPING ====================

interface CreateQuestionInput {
  text: string;
  type: "MCQ" | "TRUE_FALSE" | "TEXT";
  order?: number;
  correctAnswer?: string | null;
  options?: Array<{ text: string; isCorrect: boolean }>;
}

/**
 * Build Prisma create data for questions with options
 * Used in both POST /api/quizzes and PUT /api/quizzes/[id]
 */
export function buildQuestionsCreateData(questions: CreateQuestionInput[]) {
  return questions.map((q, index) => ({
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
  }));
}

// ==================== SCORE CALCULATION ====================

/**
 * Calculate percentage with safe division
 */
export function calculatePercentage(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

interface QuestionWithOptions {
  id: string;
  text: string;
  type: string;
  correctAnswer: string | null;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
}

interface AnswerResult {
  questionId: string;
  questionText: string;
  type: string;
  userAnswer: string;
  userAnswerText: string | null;
  correctAnswer: string | null;
  correctAnswerText: string | null;
  isCorrect: boolean;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
}

interface ScoreResult {
  score: number;
  totalPoints: number;
  percentage: number;
  answers: AnswerResult[];
}

/**
 * Calculate quiz score and build detailed answer results
 * Used in both submit and result endpoints
 */
export function calculateQuizScore(
  questions: QuestionWithOptions[],
  userAnswers: Record<string, string>
): ScoreResult {
  let score = 0;
  let totalPoints = 0;
  const answers: AnswerResult[] = [];

  for (const question of questions) {
    const userAnswer = userAnswers[question.id] || "";
    let isCorrect = false;
    let correctAnswer: string | null = null;
    let correctAnswerText: string | null = null;
    let userAnswerText: string | null = null;

    if (question.type === "MCQ" || question.type === "TRUE_FALSE") {
      totalPoints += 1;
      const correctOption = question.options.find((opt) => opt.isCorrect);
      const userOption = question.options.find((opt) => opt.id === userAnswer);

      correctAnswer = correctOption?.id || null;
      correctAnswerText = correctOption?.text || null;
      userAnswerText = userOption?.text || null;

      if (userAnswer && correctOption && userAnswer === correctOption.id) {
        isCorrect = true;
        score += 1;
      }
    } else if (question.type === "TEXT") {
      correctAnswer = question.correctAnswer;
      correctAnswerText = question.correctAnswer;
      userAnswerText = userAnswer;

      // Validate text answer: normalize both and check for exact match
      const normalizedUser = userAnswer.trim().toLowerCase();
      const normalizedCorrect = (question.correctAnswer || "").trim().toLowerCase();

      if (normalizedUser && normalizedCorrect && normalizedUser === normalizedCorrect) {
        isCorrect = true;
        score += 1;
        totalPoints += 1;
      } else {
        // Still count towards total points even if wrong
        totalPoints += 1;
      }
    }

    answers.push({
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
    });
  }

  return {
    score,
    totalPoints,
    percentage: calculatePercentage(score, totalPoints),
    answers,
  };
}
