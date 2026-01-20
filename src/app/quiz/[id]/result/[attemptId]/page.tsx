"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

interface Answer {
  questionId: string;
  questionText: string;
  type: string;
  userAnswer: string;
  userAnswerText: string | null;
  correctAnswer: string | null;
  correctAnswerText: string | null;
  isCorrect: boolean;
}

interface Result {
  attemptId: string;
  quizTitle: string;
  participantName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  completedAt: string;
  answers: Answer[];
}

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

/**
 * Quiz result page - shareable
 */
export default function ResultPage({ params }: PageProps) {
  const { id, attemptId } = use(params);

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResult() {
      try {
        const response = await fetch(`/api/quizzes/${id}/result/${attemptId}`);
        const data = await response.json();

        if (data.success) {
          setResult(data.data);
        } else {
          setError("Result not found");
        }
      } catch {
        setError("Failed to load result");
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [id, attemptId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return "Excellent! 🎉";
    if (percentage >= 80) return "Great job! 👏";
    if (percentage >= 70) return "Good work! 👍";
    if (percentage >= 60) return "Not bad! 💪";
    return "Keep practicing! 📚";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading result...</div>
      </div>
    );
  }

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
              <div className="text-4xl mb-4">❓</div>
              <h2 className="text-lg font-medium mb-2">Result Not Found</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link href="/">
                <Button>Go Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full border-b">
        <div className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">QuizApp</Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="w-full max-w-2xl mx-auto px-6 space-y-8 animate-fade-in">
          {/* Score Card */}
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Quiz Result</p>
              <h1 className="text-2xl font-semibold">{result.quizTitle}</h1>

              <div className={`text-6xl font-bold ${getScoreColor(result.percentage)}`}>
                {result.percentage}%
              </div>

              <p className="text-xl">{getScoreMessage(result.percentage)}</p>

              <p className="text-muted-foreground">
                {result.score} out of {result.totalPoints} correct
              </p>

              <div className="pt-4 border-t mt-6">
                <p className="text-sm text-muted-foreground">
                  Completed by <span className="font-medium text-foreground">{result.participantName}</span>
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <Button variant="outline" onClick={copyLink}>
                  Share Result
                </Button>
                <Link href={`/quiz/${id}`}>
                  <Button>Take Again</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Answer Review */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Answer Review</h2>

            {result.answers.map((answer, index) => (
              <Card
                key={answer.questionId}
                className={answer.isCorrect
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${answer.isCorrect
                        ? "bg-green-500/20 text-green-700 dark:text-green-300"
                        : "bg-red-500/20 text-red-700 dark:text-red-300"
                      }`}>
                      {answer.isCorrect ? "✓" : "✗"}
                    </div>
                    <CardTitle className="text-base font-medium leading-relaxed">
                      {index + 1}. {answer.questionText}
                    </CardTitle>
                  </div>
                </CardHeader>

                {answer.type !== "TEXT" && (
                  <CardContent className="pt-0">
                    <div className="ml-10 space-y-1.5 text-sm">
                      <p>
                        <span className="text-muted-foreground">Your answer: </span>
                        <span className={answer.isCorrect ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400"}>
                          {answer.userAnswerText || "No answer"}
                        </span>
                      </p>
                      {!answer.isCorrect && answer.correctAnswerText && (
                        <p>
                          <span className="text-muted-foreground">Correct answer: </span>
                          <span className="text-green-600 dark:text-green-400 font-medium">{answer.correctAnswerText}</span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}

                {answer.type === "TEXT" && (
                  <CardContent className="pt-0">
                    <div className="ml-10">
                      <p className="text-sm text-muted-foreground mb-1">Your answer:</p>
                      <div className="p-3 bg-background rounded-lg border text-sm">
                        {answer.userAnswerText || "No answer provided"}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
