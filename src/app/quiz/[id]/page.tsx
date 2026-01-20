"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  type: "MCQ" | "TRUE_FALSE" | "TEXT";
  options: Option[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Public quiz taking page
 */
export default function TakeQuizPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [participantName, setParticipantName] = useState("");
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const response = await fetch(`/api/public/quizzes/${id}`);
        const data = await response.json();

        if (data.success) {
          setQuiz(data.data);
        } else {
          setError("This quiz is not available");
        }
      } catch {
        setError("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [id]);

  const handleStart = () => {
    if (!participantName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setStarted(true);
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/quizzes/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantName, answers }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/quiz/${id}/result/${data.data.attemptId}`);
      } else {
        toast.error(data.error || "Failed to submit quiz");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading quiz...</div>
      </div>
    );
  }

  // Error state
  if (error || !quiz) {
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
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-lg font-medium mb-2">Quiz Not Available</h2>
              <p className="text-muted-foreground mb-6">{error || "This quiz does not exist or is not published"}</p>
              <Link href="/">
                <Button>Go Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Start screen
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="w-full border-b">
          <div className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">QuizApp</Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md animate-fade-in">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">{quiz.title}</CardTitle>
              {quiz.description && (
                <CardDescription className="mt-2">{quiz.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="text-center py-4 border-y">
                <span className="text-3xl font-bold">{quiz.questions.length}</span>
                <p className="text-sm text-muted-foreground mt-1">questions</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name to begin"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                  className="h-11"
                />
              </div>

              <Button onClick={handleStart} className="w-full h-11">
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Quiz taking
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const hasAnswered = !!answers[question.id];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with progress */}
      <header className="w-full border-b sticky top-0 bg-background z-50">
        <div className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold truncate max-w-[200px]">{quiz.title}</span>
          <span className="text-sm text-muted-foreground">
            {currentQuestion + 1} of {quiz.questions.length}
          </span>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-xl animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl font-medium leading-relaxed">
              {question.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {question.type === "MCQ" && (
              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={(value) => handleAnswer(question.id, value)}
                className="space-y-3"
              >
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${answers[question.id] === option.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                      }`}
                    onClick={() => handleAnswer(question.id, option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer text-base">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === "TRUE_FALSE" && (
              <div className="grid grid-cols-2 gap-4">
                {question.options.map((option) => (
                  <Button
                    key={option.id}
                    variant={answers[question.id] === option.id ? "default" : "outline"}
                    className="h-14 text-lg"
                    onClick={() => handleAnswer(question.id, option.id)}
                  >
                    {option.text}
                  </Button>
                ))}
              </div>
            )}

            {question.type === "TEXT" && (
              <Textarea
                placeholder="Type your answer here..."
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                rows={4}
                className="text-base"
              />
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                disabled={currentQuestion === 0}
              >
                ← Previous
              </Button>

              {isLastQuestion ? (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  disabled={!hasAnswered && question.type !== "TEXT"}
                >
                  Next →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
