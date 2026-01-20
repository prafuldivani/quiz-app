"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useQuizzes } from "@/hooks/use-quiz";

/**
 * Quiz list page - uses React Query for data fetching
 */
export default function QuizzesPage() {
  const { data: quizzes, isLoading, error } = useQuizzes();

  const copyLink = (quizId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${quizId}`);
    toast.success("Link copied to clipboard");
  };

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
      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">
          Loading quizzes...
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium mb-2">Failed to load quizzes</h3>
            <p className="text-muted-foreground">Please try again later</p>
          </CardContent>
        </Card>
      ) : !quizzes || quizzes.length === 0 ? (
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
                  {quiz.isPublished && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={() => copyLink(quiz.id)}
                      title="Copy Link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
