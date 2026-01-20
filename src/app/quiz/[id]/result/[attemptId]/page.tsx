"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { useQuizResult } from "@/hooks/use-quiz";

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

/**
 * Quiz result page - uses React Query
 */
export default function ResultPage({ params }: PageProps) {
  const { id, attemptId } = use(params);
  const { data: result, isLoading, error } = useQuizResult(id, attemptId);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading results...</div>
      </div>
    );
  }

  // Error state
  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="w-full border-b">
          <div className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">QuizApp</Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md text-center">
            <CardContent className="py-16">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-lg font-medium mb-2">Result Not Found</h2>
              <p className="text-muted-foreground mb-6">This result does not exist</p>
              <Link href="/">
                <Button>Go Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const getScoreMessage = () => {
    if (result.percentage >= 90) return "Excellent!";
    if (result.percentage >= 70) return "Great job!";
    if (result.percentage >= 50) return "Good effort!";
    return "Keep practicing!";
  };

  const getScoreColor = () => {
    if (result.percentage >= 70) return "text-green-600 dark:text-green-400";
    if (result.percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full border-b">
        <div className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">QuizApp</Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto p-6 space-y-6">
        {/* Score Card */}
        <Card className="text-center animate-fade-in">
          <CardHeader className="pb-2">
            <CardDescription>Quiz Completed</CardDescription>
            <CardTitle className="text-2xl">{result.quizTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`text-6xl font-bold ${getScoreColor()}`}>
              {result.percentage}%
            </div>
            <p className="text-lg font-medium">{getScoreMessage()}</p>
            <p className="text-muted-foreground">
              {result.participantName} scored {result.score} out of {result.totalPoints}
            </p>

            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" onClick={copyLink}>
                Share Result
              </Button>
              <Link href={`/quiz/${id}`}>
                <Button>Retake Quiz</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Answer Review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Answer Review</CardTitle>
            <CardDescription>See how you did on each question</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.answers.map((answer, index) => (
              <div
                key={answer.questionId}
                className={`p-4 rounded-lg border ${answer.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{answer.isCorrect ? "✓" : "✗"}</span>
                  <div className="flex-1">
                    <p className="font-medium mb-2">Q{index + 1}: {answer.questionText}</p>
                    <div className="text-sm space-y-1">
                      <p className={answer.isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        Your answer: {answer.userAnswerText || "Not answered"}
                      </p>
                      {!answer.isCorrect && answer.correctAnswerText && (
                        <p className="text-green-600 dark:text-green-400">
                          Correct: {answer.correctAnswerText}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
