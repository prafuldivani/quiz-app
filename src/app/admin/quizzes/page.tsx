"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Quiz {
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

/**
 * Quiz list page
 */
export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const response = await fetch("/api/quizzes");
        const data = await response.json();
        if (data.success) {
          setQuizzes(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch quizzes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuizzes();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your quizzes
          </p>
        </div>
        <Link href="/admin/quizzes/new">
          <Button>Create Quiz</Button>
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          Loading quizzes...
        </div>
      ) : quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2">No quizzes yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first quiz to get started
            </p>
            <Link href="/admin/quizzes/new">
              <Button>Create Quiz</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz, i) => (
            <Card key={quiz.id} className={`animate-fade-in stagger-${Math.min(i + 1, 4)} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg leading-tight line-clamp-2">{quiz.title}</CardTitle>
                  <Badge variant={quiz.isPublished ? "default" : "secondary"} className="shrink-0">
                    {quiz.isPublished ? "Live" : "Draft"}
                  </Badge>
                </div>
                {quiz.description && (
                  <CardDescription className="line-clamp-2">
                    {quiz.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">📋</span>
                    {quiz._count.questions} questions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">👥</span>
                    {quiz._count.attempts} attempts
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/quizzes/${quiz.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/admin/quizzes/${quiz.id}/attempts`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Results
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
