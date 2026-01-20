"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuizzes } from "@/hooks/use-quiz";

/**
 * Admin dashboard - uses React Query for data fetching
 */
export default function AdminDashboard() {
  const { data: quizzes, isLoading } = useQuizzes();

  const stats = {
    totalQuizzes: quizzes?.length ?? 0,
    publishedQuizzes: quizzes?.filter(q => q.isPublished).length ?? 0,
    totalAttempts: quizzes?.reduce((sum, q) => sum + q._count.attempts, 0) ?? 0,
  };

  const statCards = [
    {
      label: "Total Quizzes",
      value: stats.totalQuizzes,
      description: "Quizzes you've created"
    },
    {
      label: "Published",
      value: stats.publishedQuizzes,
      description: "Available to take"
    },
    {
      label: "Total Attempts",
      value: stats.totalAttempts,
      description: "Quiz submissions"
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s an overview of your quizzes.
        </p>
      </div>

      {/* Empty State / Onboarding */}
      {!isLoading && stats.totalQuizzes === 0 ? (
        <Card className="border-dashed border-2 bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="p-4 bg-background rounded-full shadow-sm">
              <span className="text-4xl">🚀</span>
            </div>
            <div className="space-y-2 max-w-md">
              <CardTitle className="text-xl">Welcome to QuizApp!</CardTitle>
              <CardDescription className="text-base">
                You haven&apos;t created any quizzes yet. Get started by creating your first quiz to share with others.
              </CardDescription>
            </div>
            <Link href="/admin/quizzes/new">
              <Button size="lg" className="mt-2 text-md px-8">
                Create Your First Quiz
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-3">
            {statCards.map((stat, i) => (
              <Card key={stat.label} className={`animate-fade-in stagger-${i + 1}`}>
                <CardHeader className="pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-3xl font-bold">
                    {isLoading ? "—" : stat.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link href="/admin/quizzes/new">
                <Button>Create New Quiz</Button>
              </Link>
              <Link href="/admin/quizzes">
                <Button variant="outline">Manage Quizzes</Button>
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
