"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StatsData {
  totalQuizzes: number;
  publishedQuizzes: number;
  totalAttempts: number;
}

/**
 * Admin dashboard
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData>({
    totalQuizzes: 0,
    publishedQuizzes: 0,
    totalAttempts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/quizzes");
        const data = await response.json();

        if (data.success) {
          const quizzes = data.data;
          setStats({
            totalQuizzes: quizzes.length,
            publishedQuizzes: quizzes.filter((q: { isPublished: boolean }) => q.isPublished).length,
            totalAttempts: quizzes.reduce((sum: number, q: { _count: { attempts: number } }) => sum + q._count.attempts, 0),
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

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

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        {statCards.map((stat, i) => (
          <Card key={stat.label} className={`animate-fade-in stagger-${i + 1}`}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {loading ? "—" : stat.value}
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
    </div>
  );
}
