"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuizAttempts } from "@/hooks/use-quiz";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Quiz attempts/results page for admin - uses React Query
 */
export default function QuizAttemptsPage({ params }: PageProps) {
  const { id } = use(params);
  const { data, isLoading, error } = useQuizAttempts(id);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground">Loading attempts...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link href="/admin/quizzes">
          <Button variant="ghost" size="sm">← Back to Quizzes</Button>
        </Link>
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium mb-2">Error</h3>
            <p className="text-muted-foreground">{error instanceof Error ? error.message : "Failed to load attempts"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/admin/quizzes" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Back to Quizzes
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{data.quizTitle}</h1>
          <p className="text-muted-foreground mt-1">
            {data.attempts.length} {data.attempts.length === 1 ? "attempt" : "attempts"}
          </p>
        </div>
        <Link href={`/admin/quizzes/${id}`}>
          <Button variant="outline">Edit Quiz</Button>
        </Link>
      </div>

      {/* Attempts List */}
      {data.attempts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2">No attempts yet</h3>
            <p className="text-muted-foreground mb-6">
              Share your quiz link to start collecting responses
            </p>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/quiz/${id}`);
              }}
            >
              Copy Quiz Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Results</CardTitle>
            <CardDescription>All participant submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.attempts.map((attempt) => (
                <div key={attempt.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{attempt.participantName}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(attempt.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${getScoreColor(attempt.percentage)}`}>
                      {attempt.percentage}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {attempt.score}/{attempt.totalPoints}
                    </p>
                  </div>
                  <Link href={`/quiz/${id}/result/${attempt.id}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                      View
                    </Badge>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      {data.attempts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Attempts</CardDescription>
              <CardTitle className="text-3xl">{data.attempts.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl">
                {Math.round(
                  data.attempts.reduce((sum, a) => sum + a.percentage, 0) / data.attempts.length
                )}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Highest Score</CardDescription>
              <CardTitle className="text-3xl">
                {Math.max(...data.attempts.map((a) => a.percentage))}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
