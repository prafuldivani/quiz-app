"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, CreateQuizInput, UpdateQuizInput, SubmitQuizInput } from "@/lib/api-client";

// ==================== QUERY KEYS ====================

export const queryKeys = {
  quizzes: ["quizzes"] as const,
  quiz: (id: string) => ["quiz", id] as const,
  quizAttempts: (id: string) => ["quizAttempts", id] as const,
  quizResult: (quizId: string, attemptId: string) => ["quizResult", quizId, attemptId] as const,
  publicQuiz: (id: string) => ["publicQuiz", id] as const,
};

// ==================== QUIZ HOOKS ====================

/**
 * Fetch all quizzes for the current user
 */
export function useQuizzes() {
  return useQuery({
    queryKey: queryKeys.quizzes,
    queryFn: () => api.getQuizzes(),
  });
}

/**
 * Fetch a single quiz by ID
 */
export function useQuiz(id: string) {
  return useQuery({
    queryKey: queryKeys.quiz(id),
    queryFn: () => api.getQuiz(id),
    enabled: !!id,
  });
}

/**
 * Create a new quiz
 */
export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuizInput) => api.createQuiz(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes });
    },
  });
}

/**
 * Update an existing quiz
 */
export function useUpdateQuiz(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateQuizInput) => api.updateQuiz(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes });
      queryClient.invalidateQueries({ queryKey: queryKeys.quiz(id) });
    },
  });
}

/**
 * Delete a quiz
 */
export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes });
    },
  });
}

// ==================== ATTEMPTS HOOKS ====================

/**
 * Fetch attempts for a quiz
 */
export function useQuizAttempts(quizId: string) {
  return useQuery({
    queryKey: queryKeys.quizAttempts(quizId),
    queryFn: () => api.getQuizAttempts(quizId),
    enabled: !!quizId,
  });
}

/**
 * Submit a quiz
 */
export function useSubmitQuiz(quizId: string) {
  return useMutation({
    mutationFn: (data: SubmitQuizInput) => api.submitQuiz(quizId, data),
  });
}

/**
 * Fetch quiz result
 */
export function useQuizResult(quizId: string, attemptId: string) {
  return useQuery({
    queryKey: queryKeys.quizResult(quizId, attemptId),
    queryFn: () => api.getQuizResult(quizId, attemptId),
    enabled: !!quizId && !!attemptId,
  });
}

// ==================== PUBLIC HOOKS ====================

/**
 * Fetch a public quiz for taking
 */
export function usePublicQuiz(id: string) {
  return useQuery({
    queryKey: queryKeys.publicQuiz(id),
    queryFn: () => api.getPublicQuiz(id),
    enabled: !!id,
  });
}
