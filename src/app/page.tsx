import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Landing page - Production-grade design
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            QuizApp
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - CENTERED */}
      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex items-center justify-center px-6 py-24">
          <div className="w-full max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Create & share quizzes
              <br />
              <span className="text-muted-foreground">in minutes</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Build interactive quizzes with multiple question types. Share with anyone and track results instantly.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="min-w-[160px]">
                  Start Creating
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="min-w-[160px]">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/30">
          <div className="w-full max-w-6xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: "📝",
                  title: "Multiple Question Types",
                  description: "Support for multiple choice, true/false, and open text answers"
                },
                {
                  icon: "🔗",
                  title: "Shareable Results",
                  description: "Every quiz attempt generates a unique shareable link"
                },
                {
                  icon: "⚡",
                  title: "Instant Scoring",
                  description: "Automatic grading with detailed answer breakdown"
                }
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className={`text-center animate-fade-in stagger-${i + 1}`}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="w-full max-w-6xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          Built with Next.js, Prisma, and shadcn/ui
        </div>
      </footer>
    </div>
  );
}
