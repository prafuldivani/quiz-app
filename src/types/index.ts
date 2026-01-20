import { Quiz, Question, Option, Attempt, QuestionType } from "@prisma/client";

// Re-export Prisma types
export type { Quiz, Question, Option, Attempt, QuestionType };

// Quiz with all relations included
export type QuizWithQuestions = Quiz & {
  questions: (Question & {
    options: Option[];
  })[];
};

// Quiz with attempts included
export type QuizWithAttempts = Quiz & {
  attempts: Attempt[];
};

// Full quiz with all relations
export type QuizFull = Quiz & {
  questions: (Question & {
    options: Option[];
  })[];
  attempts: Attempt[];
};

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Quiz submission result
export interface QuizResult {
  score: number;
  totalPoints: number;
  percentage: number;
  attemptId?: string;
  participantName?: string;
  answers: {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string | null;
    isCorrect: boolean;
    type: QuestionType;
  }[];
}
