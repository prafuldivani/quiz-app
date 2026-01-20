/**
 * Centralized API client for making HTTP requests
 * All API calls go through this module for consistency
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl = "";

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Request failed");
    }

    return data.data as T;
  }

  // ==================== QUIZ ENDPOINTS ====================

  async getQuizzes() {
    return this.request<Quiz[]>("/api/quizzes");
  }

  async getQuiz(id: string) {
    return this.request<QuizWithQuestions>(`/api/quizzes/${id}`);
  }

  async createQuiz(data: CreateQuizInput) {
    return this.request<QuizWithQuestions>("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateQuiz(id: string, data: UpdateQuizInput) {
    return this.request<QuizWithQuestions>(`/api/quizzes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteQuiz(id: string) {
    return this.request<{ message: string }>(`/api/quizzes/${id}`, {
      method: "DELETE",
    });
  }

  // ==================== ATTEMPTS ENDPOINTS ====================

  async getQuizAttempts(quizId: string) {
    return this.request<AttemptsData>(`/api/quizzes/${quizId}/attempts`);
  }

  async submitQuiz(quizId: string, data: SubmitQuizInput) {
    return this.request<{ attemptId: string }>(`/api/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getQuizResult(quizId: string, attemptId: string) {
    return this.request<QuizResult>(`/api/quizzes/${quizId}/result/${attemptId}`);
  }

  // ==================== PUBLIC ENDPOINTS ====================

  async getPublicQuiz(id: string) {
    return this.request<PublicQuiz>(`/api/public/quizzes/${id}`);
  }
}

// Export singleton instance
export const api = new ApiClient();

// ==================== TYPE DEFINITIONS ====================

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  createdAt: string;
  _count: {
    questions: number;
    attempts: number;
  };
}

export interface Option {
  id?: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: "MCQ" | "TRUE_FALSE" | "TEXT";
  order: number;
  options: Option[];
  correctAnswer?: string;
}

export interface QuizWithQuestions {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  createdAt: string;
  questions: Question[];
}

export interface PublicQuiz {
  id: string;
  title: string;
  description: string | null;
  questions: Array<{
    id: string;
    text: string;
    type: "MCQ" | "TRUE_FALSE" | "TEXT";
    order: number;
    options: Array<{ id: string; text: string }>;
  }>;
}

export interface Attempt {
  id: string;
  participantName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  createdAt: string;
}

export interface AttemptsData {
  quizId: string;
  quizTitle: string;
  attempts: Attempt[];
}

export interface QuizResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  participantName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  completedAt: string;
  answers: Array<{
    questionId: string;
    questionText: string;
    type: string;
    userAnswer: string;
    userAnswerText: string | null;
    correctAnswer: string | null;
    correctAnswerText: string | null;
    isCorrect: boolean;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
  }>;
}

export interface CreateQuizInput {
  title: string;
  description?: string;
  isPublished: boolean;
  questions: Array<{
    text: string;
    type: "MCQ" | "TRUE_FALSE" | "TEXT";
    order: number;
    options?: Array<{ text: string; isCorrect: boolean }>;
    correctAnswer?: string;
  }>;
}

export interface UpdateQuizInput extends CreateQuizInput { }

export interface SubmitQuizInput {
  participantName: string;
  answers: Record<string, string>;
}
